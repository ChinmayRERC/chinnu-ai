import {randomUUID} from 'node:crypto';
import {WebSocket} from 'ws';
import {z} from 'zod';
import {synthesize,transcribe} from './nvidia';
import {planAgent,quickAction,appStateSchema,type AppState,type History} from './brain';
import {UtteranceBuffer} from './audio';
import {library} from '../src/exercises/engine';
import type {AgentAction,ActionResult} from '../src/agent/actions';
import type {AccessStore} from './access';
export const poseContextSchema=z.object({exercise:z.string().max(80),rep:z.number().min(0).max(10000),tracking:z.enum(['reliable','unreliable']),measuredAngles:z.record(z.number().min(-360).max(360)),cue:z.string().max(240),score:z.number().min(0).max(100).nullable()});
const resultSchema=z.object({ok:z.boolean(),message:z.string().max(1500),data:z.unknown().optional(),requiresUserAction:z.boolean().optional()});
const coachingSchema=z.object({kind:z.enum(['correction','tracking','encouragement']),text:z.string().max(400),measurement:z.object({feature:z.string().max(40),value:z.number().min(0).max(180),min:z.number(),max:z.number()}).optional()});
export class NvidiaVoiceSession {
 private collector=new UtteranceBuffer();private job:AbortController|null=null;private closed=false;private lastCoach=0;private lastContext=0;private turns=0;
 private state:AppState={page:'Today',exerciseId:null,availableExercises:[],conservativeMode:true};private history:History=[];private pose:z.infer<typeof poseContextSchema>|undefined;
 private pending=new Map<string,{resolve:(r:ActionResult)=>void;timer:ReturnType<typeof setTimeout>;abort:()=>void;signal:AbortSignal}>();
 constructor(private socket:WebSocket,private access:AccessStore){}
 private send(value:unknown){if(!this.closed&&this.socket.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify(value));}
 private charge(){if(!this.access.consume())throw new Error('The app’s daily AI usage limit has been reached. Local spoken corrections still work.');}
 private async speech(text:string,signal:AbortSignal){
  const short=text.replace(/https?:\/\/\S+/g,'').replace(/[*#_]/g,'').slice(0,300);if(!short.trim())return;this.charge();const audio=await synthesize(short,signal);if(signal.aborted||this.closed)return;this.send({type:'text',text:short});
  for(let i=0;i<audio.pcm.length;i+=16384){if(signal.aborted||this.socket.readyState!==WebSocket.OPEN)return;const chunk=audio.pcm.subarray(i,i+16384);await new Promise<void>((resolve,reject)=>this.socket.send(JSON.stringify({type:'audio',data:chunk.toString('base64'),rate:audio.rate}),error=>error?reject(error):resolve()));}
 }
 private run(task:(signal:AbortSignal)=>Promise<void>){
  if(this.job||this.closed)return;const controller=new AbortController();this.job=controller;this.send({type:'processing',provider:'nvidia'});
  void task(controller.signal).catch(error=>{if(!controller.signal.aborted&&!this.closed){const message=String(error instanceof Error?error.message:'Speech service unavailable.');const safe=message.includes('daily AI')?message:'NVIDIA speech or model request failed. Local spoken coaching remains available; reconnect to retry.';this.send({type:'error',error:safe});this.socket.close(1011,'Cloud voice unavailable');}}).finally(()=>{if(this.job===controller){this.job=null;this.collector.reset();this.send({type:'turnComplete'});}});
 }
 start(){this.send({type:'ready',provider:'nvidia',mode:'utterance',language:'en-US'});this.run(signal=>this.speech('Hi, I’m Chinnu. Tell me what you’d like to practice, or ask me to open a feature.',signal));}
 private async action(action:AgentAction,signal:AbortSignal):Promise<ActionResult>{
  if(signal.aborted)throw new Error('Cancelled');const id=randomUUID();
  return new Promise((resolve,reject)=>{const cleanup=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);this.pending.delete(id);};const abort=()=>{cleanup();reject(new Error('Cancelled'));};const timer=setTimeout(()=>{cleanup();resolve({ok:false,message:'The app did not finish that action. Please check its screen; do not assume it succeeded.'});},45000);this.pending.set(id,{resolve:r=>{cleanup();resolve(r);},timer,abort,signal});signal.addEventListener('abort',abort,{once:true});this.send({type:'tool',id,action});});
 }
 private async respond(text:string,signal:AbortSignal){
  if(++this.turns>40)throw new Error('Session turn limit reached. Reconnect to continue.');
  this.send({type:'transcript',text});if(!quickAction(text))this.charge();
  const plan=await planAgent(text,this.state,this.history,signal);if(signal.aborted)return;
  const results:ActionResult[]=[];
  for(const action of plan.actions.slice(0,4)){if(signal.aborted)return;results.push(await this.action(action,signal));}
  const receipt=results.length?results.map(r=>r.message).join(' '):plan.text;
  this.history.push({role:'user',content:text},{role:'assistant',content:results.length?`Actual app results: ${JSON.stringify(results).slice(0,10000)}`:receipt});this.history=this.history.slice(-8);
  await this.speech(receipt||'Please rephrase that request.',signal);
 }
 handle(data:Record<string,unknown>){
  if(this.closed)return;
  if(data.type==='interrupt'){this.job?.abort();this.job=null;this.collector.reset();this.send({type:'interrupted'});this.send({type:'turnComplete'});return;}
  if(data.type==='appState'){const s=appStateSchema.safeParse(data.value);if(s.success){this.state=s.data;if(s.data.page!=='Trainer')this.pose=undefined;}return;}
  if(data.type==='toolResult'&&typeof data.id==='string'){const result=resultSchema.safeParse(data.result);if(result.success&&JSON.stringify(result.data).length<=14000)this.pending.get(data.id)?.resolve(result.data);return;}
  if(data.type==='request'&&typeof data.text==='string'&&data.text.trim()&&data.text.length<=1500){if(this.job){this.send({type:'notice',text:'Chinnu is finishing a reply. Tap Interrupt, then ask again.'});return;}this.run(signal=>this.respond(data.text as string,signal));return;}
  if(data.type==='audio'&&!this.job&&typeof data.data==='string'&&data.data.length<=16000&&/^[A-Za-z0-9+/]*={0,2}$/.test(data.data)){
   const utterance=this.collector.push(Buffer.from(data.data,'base64'));if(utterance)this.run(async signal=>{this.charge();const text=await transcribe(utterance,signal);if(text&&!signal.aborted)await this.respond(text,signal);});return;
  }
  if(data.type==='context'){const parsed=poseContextSchema.safeParse(data.value);if(parsed.success&&library.some(e=>e.name===parsed.data.exercise)){this.pose=parsed.data;this.lastContext=Date.now();}return;}
  if(data.type==='coach'&&!this.job&&this.pose&&Date.now()-this.lastContext<12000&&Date.now()-this.lastCoach>=7000){
   const event=coachingSchema.safeParse(data.value);if(!event.success)return;const exercise=library.find(e=>e.name===this.pose!.exercise)!;
   let text='';if(event.data.kind==='correction'){const m=event.data.measurement;const rule=m?exercise.rules.find(r=>r.feature===m.feature&&r.min===m.min&&r.max===m.max):undefined;if(!m||!rule||this.pose.tracking!=='reliable'||m.value>=m.min&&m.value<=m.max)return;text=rule.cue;}
   else if(event.data.kind==='tracking'&&this.pose.tracking==='unreliable')text='Pause your movement. Reposition your phone so the required joints are visible.';
   else if(event.data.kind==='encouragement'&&this.pose.tracking==='reliable'&&this.pose.score!==null&&this.pose.score>=85)text='Your measured alignment is within the current reference. Keep moving comfortably.';
   if(text){this.lastCoach=Date.now();this.run(signal=>this.speech(text,signal));}
  }
 }
 close(){if(this.closed)return;this.closed=true;this.job?.abort();for(const p of this.pending.values()){clearTimeout(p.timer);p.signal.removeEventListener('abort',p.abort);p.resolve({ok:false,message:'Voice disconnected before the action completed.'});}this.pending.clear();this.collector.reset();}
}
