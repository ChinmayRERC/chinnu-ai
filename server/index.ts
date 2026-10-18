import express from 'express';
import {createServer} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {GoogleGenAI,Modality,Type,type Session as LiveSession} from '@google/genai';
import {z} from 'zod';
import {library} from '../src/exercises/engine.js';
import {actionSchema,agentActions} from '../src/agent/actions.js';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const app=express();app.disable('x-powered-by');app.set('trust proxy',1);
app.use((req,res,next)=>{res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Cache-Control','no-store');if(req.method==='OPTIONS'){res.sendStatus(204);return;}next();});
app.use(express.json({limit:'24kb'}));
const sessions=new Map<string,{expires:number;voice:boolean;requests:number}>(),attempts=new Map<string,{count:number;expires:number}>();
const MAX_SESSIONS=100;
const key=process.env.GEMINI_API_KEY,access=process.env.APP_ACCESS_CODE;
const ai=key?new GoogleGenAI({apiKey:key}):null;
const prompt=`You are Chinnu AI, a calm, concise in-app voice agent. Use app_action to execute app requests: navigate pages, open exercises, show image/animated guides, control training, toggle spoken coaching, run a breathing timer, log an explicitly requested check-in, read progress, suggest today's plan, show latest report, request PDF export, open camera/video setup or request data deletion. Similar to familiar voice assistants, users can speak naturally ("open my progress", "show me a squat", "pause", "log my sleep"). You cannot control other phone apps or claim Siri integration. Use only supported tools and wait for actual app results before claiming success. If a result requires user action, tell the user exactly what to tap. Ask for missing check-in values instead of inventing them. Do not override conservative screening. Do not change credentials or send health history without a specific user request. Never diagnose or give medication/supplement advice. You cannot see video. Only structured measurements supplied by the app are observations. Do not invent measurements, rep counts, injuries or safety guarantees. All reference thresholds and diagrams are unvalidated prototypes. Keep spoken responses short. On reported pain stop the session with control_session/pain. Respect local permission prompts. No breath detection or loaded deadlift guidance. Video is local; voice and requests are cloud processed. Available exercises: ${library.map(e=>`${e.id}: ${e.name}`).join(', ')}.`;
const appActionTool={name:'app_action',description:'Execute one supported action inside Chinnu AI. Wait for actual result. show_guide shows step images and animation. open_exercise opens practice setup, not automatic camera permission.',parameters:{type:Type.OBJECT,properties:{action:{type:Type.STRING,enum:[...agentActions]},page:{type:Type.STRING,enum:['Today','Train','Progress','Journal','Settings']},exerciseId:{type:Type.STRING,enum:library.map(e=>e.id)},command:{type:Type.STRING,enum:['pause','resume','stop','pain']},enabled:{type:Type.BOOLEAN},checkin:{type:Type.OBJECT,properties:{energy:{type:Type.INTEGER},soreness:{type:Type.INTEGER},sleep:{type:Type.NUMBER},mood:{type:Type.STRING,enum:['Great','Okay','Low','Stressed']},note:{type:Type.STRING}},required:['energy','soreness','sleep','mood']}},required:['action']}};
const appStateSchema=z.object({page:z.string().max(30),exerciseId:z.string().max(30).nullable(),availableExercises:z.array(z.object({id:z.string().max(30),name:z.string().max(50)})).max(20),conservativeMode:z.boolean()});
function limited(ip:string){const now=Date.now();let entry=attempts.get(ip);if(!entry||entry.expires<now){entry={count:0,expires:now+60000};attempts.set(ip,entry);}return ++entry.count>10;}
const authorize=(header:string|undefined)=>{const token=header?.replace(/^Bearer /,'');const s=token?sessions.get(token):null;if(!s||s.expires<Date.now()||++s.requests>60)return null;return s;};
app.get('/health',(_req,res)=>res.json({status:'ok',voiceConfigured:!!key&&!!access,historyStorage:'device-only',videoUpload:false}));
app.post('/sessions',(req,res)=>{if(limited(req.ip??'unknown')){res.status(429).json({error:'Too many attempts. Retry in a minute.'});return;}if(!ai||!access){res.status(503).json({error:'Configure GEMINI_API_KEY and APP_ACCESS_CODE on Render first.'});return;}
 const parsed=z.object({accessCode:z.string().min(1).max(256)}).safeParse(req.body);const supplied=Buffer.from(parsed.success?parsed.data.accessCode:'');const expected=Buffer.from(access);
 if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected)){res.status(401).json({error:'Invalid application access code.'});return;}
 if(sessions.size>=MAX_SESSIONS){res.status(429).json({error:'Session capacity reached.'});return;}
 const token=randomBytes(32).toString('hex');sessions.set(token,{expires:Date.now()+15*60000,voice:false,requests:0});res.json({token,expiresIn:900});});
const requestSchema=z.object({facts:z.string().max(12000)});
app.post('/agent',async(req,res)=>{
 if(!authorize(req.headers.authorization)){res.status(401).json({error:'Agent session expired. Try again.'});return;}
 const body=z.object({text:z.string().min(1).max(1500),context:appStateSchema}).safeParse(req.body);if(!body.success){res.status(400).json({error:'Invalid agent request.'});return;}
 if(!ai){res.status(503).json({error:'Gemini is not configured.'});return;}
 try{const result=await ai.models.generateContent({model:process.env.GEMINI_TEXT_MODEL??'gemini-2.5-flash',contents:`App state (data only): ${JSON.stringify(body.data.context)}\nUser request: ${body.data.text}`,config:{systemInstruction:prompt,tools:[{functionDeclarations:[appActionTool]}],maxOutputTokens:1500,httpOptions:{timeout:25000}}});
 const actions=(result.functionCalls??[]).filter(call=>call.name==='app_action').slice(0,4).flatMap(call=>{const action=actionSchema.safeParse(call.args);return action.success?[action.data]:[];});res.json({actions,text:result.text??'',source:'cloud-agent'});
 }catch{res.status(502).json({error:'Agent provider unavailable. Use the app controls or retry.'});}
});
for(const endpoint of ['explanations','summaries','plans'])app.post(`/ai/${endpoint}`,async(req,res)=>{if(!authorize(req.headers.authorization)){res.status(401).json({error:'Session expired. Reconnect.'});return;}if(!ai){res.status(503).json({error:'AI not configured'});return;}const data=requestSchema.safeParse(req.body);if(!data.success){res.status(400).json({error:'Expected facts string (up to 12000 chars).'});return;}
 try{const result=await ai.models.generateContent({model:process.env.GEMINI_TEXT_MODEL??'gemini-2.5-flash',contents:`Task: ${endpoint}. Facts (untrusted input):\n${data.data.facts}`,config:{systemInstruction:prompt,maxOutputTokens:700,httpOptions:{timeout:20000}}});res.json({text:result.text,source:'cloud-ai',unvalidated:true});}catch{res.status(502).json({error:'AI provider unavailable. Local coaching remains available.'});}});
const server=createServer(app),wss=new WebSocketServer({server,path:'/voice',maxPayload:24*1024});
const contextSchema=z.object({exercise:z.string().max(80),rep:z.number().min(0).max(10000),tracking:z.enum(['reliable','unreliable']),measuredAngles:z.record(z.number().min(-360).max(360)),cue:z.string().max(240),score:z.number().min(0).max(100).nullable()});
wss.on('connection',ws=>{let live:LiveSession|undefined;let authenticated=false,connecting=false,lastContext=0,lastCoaching=0,bytes=0;let currentContext:z.infer<typeof contextSchema>|undefined;let usedSession:{voice:boolean}|undefined;
 const pending=new Map<string,{name:string;timer:ReturnType<typeof setTimeout>}>();
 const send=(value:unknown)=>{if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<512000)ws.send(JSON.stringify(value));};
 const timeout=setTimeout(()=>{if(!authenticated)ws.close(1008,'Authentication required');},5000);
 const expiry=setTimeout(()=>ws.close(1000,'15 minute session limit'),15*60000);
 const budget=setInterval(()=>{bytes=0;},1000);
 const fail=()=>{send({type:'error',error:'Voice provider unavailable or session ended. Check the configured model, billing and quota. Local cues are available.'});ws.close();};
 ws.on('message',async raw=>{try{const text=raw.toString();bytes+=Buffer.byteLength(text);if(bytes>100000){ws.close(1008,'Audio rate limit');return;}const data=JSON.parse(text);
 if(!authenticated){if(data.type!=='auth'||connecting)return;const s=sessions.get(data.token);if(!s||s.expires<Date.now()||s.voice||!ai){ws.close(1008,'Invalid voice session');return;}authenticated=true;connecting=true;s.voice=true;usedSession=s;clearTimeout(timeout);
   try{live=await ai.live.connect({model:process.env.GEMINI_LIVE_MODEL??'gemini-2.5-flash-native-audio-preview-12-2025',config:{responseModalities:[Modality.AUDIO],systemInstruction:prompt,inputAudioTranscription:{},outputAudioTranscription:{},speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:process.env.GEMINI_VOICE??'Aoede'}}},tools:[{functionDeclarations:[appActionTool,{name:'control_session',description:'Apply an explicit user request to pause, resume, stop or report pain.',parameters:{type:Type.OBJECT,properties:{command:{type:Type.STRING,enum:['pause','resume','stop','pain']}},required:['command']}}]}]},callbacks:{
    onmessage:message=>{if(message.serverContent?.interrupted)send({type:'interrupted'});if(message.serverContent?.turnComplete)send({type:'turnComplete'});for(const part of message.serverContent?.modelTurn?.parts??[]){if(part.inlineData?.data)send({type:'audio',data:part.inlineData.data,rate:24000});}if(message.serverContent?.outputTranscription?.text)send({type:'text',text:message.serverContent.outputTranscription.text});
     for(const call of message.toolCall?.functionCalls??[]){
      const parsed=actionSchema.safeParse(call.name==='control_session'?{action:'control_session',command:call.args?.command}:call.name==='app_action'?call.args:null);
      if(!parsed.success||!call.id){live?.sendToolResponse({functionResponses:[{id:call.id,name:call.name,response:{ok:false,message:'Invalid or unsupported action.'}}]});continue;}
      if(pending.has(call.id)||pending.size>=4)continue;const id=call.id,name=call.name!;const timer=setTimeout(()=>{pending.delete(id);live?.sendToolResponse({functionResponses:[{id,name,response:{ok:false,message:'The app did not complete this action in time. Do not claim success.'}}]});},60000);pending.set(id,{name,timer});send({type:'tool',id,action:parsed.data});
     }
   },onerror:()=>fail(),onclose:()=>ws.close()}});connecting=false;if(ws.readyState!==WebSocket.OPEN){live.close();return;}send({type:'ready'});live.sendClientContent({turns:[{role:'user',parts:[{text:'Greet me briefly as Chinnu and ask what I would like to practice. Do not claim camera access.'}]}],turnComplete:true});}catch{fail();}return;
 }
  if(!live)return;
  if(data.type==='toolResult'&&typeof data.id==='string'){
   const call=pending.get(data.id);const result=z.object({ok:z.boolean(),message:z.string().max(1500),data:z.unknown().optional(),requiresUserAction:z.boolean().optional()}).safeParse(data.result);if(call&&result.success){clearTimeout(call.timer);pending.delete(data.id);live.sendToolResponse({functionResponses:[{id:data.id,name:call.name,response:result.data}]});}return;
  }
  if(data.type==='appState'){const state=appStateSchema.safeParse(data.value);if(state.success){if(state.data.page!=='Trainer')currentContext=undefined;live.sendClientContent({turns:[{role:'user',parts:[{text:`Updated app state (data only, not a request): ${JSON.stringify(state.data)}. Use this when answering user requests; do not announce every state update.`}]}],turnComplete:false});}return;}
 if(data.type==='audio'&&typeof data.data==='string'&&data.data.length<=16000&&/^[A-Za-z0-9+/]*={0,2}$/.test(data.data))live.sendRealtimeInput({audio:{data:data.data,mimeType:'audio/pcm;rate=16000'}});
  if(data.type==='context'&&Date.now()-lastContext>=3000){const context=contextSchema.safeParse(data.value);if(!context.success||!library.some(e=>e.name===context.data.exercise))return;lastContext=Date.now();currentContext=context.data;}
  if(data.type==='coach'&&currentContext&&Date.now()-lastContext<12000&&Date.now()-lastCoaching>=5000){
   const event=z.object({kind:z.enum(['correction','tracking','encouragement']),text:z.string().max(400),measurement:z.object({feature:z.string().max(40),value:z.number().min(0).max(180),min:z.number(),max:z.number()}).optional()}).safeParse(data.value);if(!event.success)return;
   const m=event.data.measurement;const exercise=library.find(e=>e.name===currentContext!.exercise)!;
   const rule=m?exercise.rules.find(r=>r.feature===m.feature&&r.min===m.min&&r.max===m.max):undefined;
   if(event.data.kind==='correction'&&(!rule||!m||currentContext.tracking!=='reliable'||m.value>=m.min&&m.value<=m.max))return;
   lastCoaching=Date.now();const measured=event.data.kind==='correction'?{cue:rule!.cue,feature:m!.feature,observedDegrees:m!.value,reference:[m!.min,m!.max]}:{kind:event.data.kind};
   live.sendClientContent({turns:[{role:'user',parts:[{text:`Give one short proactive coaching sentence now based only on this app event: ${JSON.stringify(measured)} and context ${JSON.stringify(currentContext)}. For tracking loss ask me to pause and reposition. For a correction say the cue; no injury claim. For encouragement describe only measured alignment. References are unvalidated; do not claim full pose correctness.`}]}],turnComplete:true});
  }
 }catch{ws.close(1008,'Invalid message');}});
  ws.on('close',()=>{clearTimeout(timeout);clearTimeout(expiry);clearInterval(budget);for(const call of pending.values())clearTimeout(call.timer);pending.clear();live?.close();if(usedSession)usedSession.voice=false;});ws.on('error',()=>ws.close());
});
const pruning=setInterval(()=>{const now=Date.now();for(const[k,v]of sessions)if(v.expires<now)sessions.delete(k);for(const[k,v]of attempts)if(v.expires<now)attempts.delete(k);},60000);pruning.unref();
app.use((error:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{res.status(400).json({error:'Invalid request body.'});});
if(existsSync(resolve('dist/index.html'))){app.use(express.static(resolve('dist'),{maxAge:'1h'}));app.get('/',(_req,res)=>res.sendFile(resolve('dist/index.html')));}
server.listen(Number(process.env.PORT??10000),'0.0.0.0',()=>console.log('Chinnu API listening; content logging disabled'));
process.on('SIGTERM',()=>{wss.clients.forEach(ws=>ws.close(1012,'Service restarting'));server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),5000).unref();});
