import {GoogleGenAI} from '@google/genai';
import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {actionSchema,type AgentAction} from '../src/agent/actions';
import {library} from '../src/exercises/engine';
import {nvidiaConfig} from './nvidia';
import {DecisionModelClient,type ModelMessage} from './model-client';
export const appStateSchema=z.object({page:z.string().max(30),exerciseId:z.string().max(30).nullable(),availableExercises:z.array(z.object({id:z.string().max(30),name:z.string().max(50)})).max(20),conservativeMode:z.boolean()});
export type AppState=z.infer<typeof appStateSchema>;
export const systemPrompt=`You are Chinnu AI, a concise, calm wellness app agent. Use app_action for app requests and wait for actual results before confirming success. Speak at most 2 short sentences. No diagnosis, medication or supplement advice, medical meal prescriptions or injury prevention guarantees. Never invent measurements, portions, health history or tool results. Video stays on device; you receive only explicit app state, measured events and requested tool results. Photos require separate consent. Do not infer emotions, pain, breathing rate or conditions from voice/video. Pain means stop and rest; medical concerns need qualified advice. Never bypass conservative screening, confirmation, camera or microphone permission. You cannot control other apps or claim Siri integration. App pages: Today, Train, Nutrition, Health, Plans, Progress, Journal, More, Settings. log_water amount is ml; log_metric units are kg, hours, additional steps (not repeated totals), cm, activity minutes and glucose mg/dL manual notes. Ask for missing values. search_foods returns exact local IDs; log_food requires ID, grams and Breakfast/Lunch/Dinner/Snack. create_reminder time is HH:mm 24-hour local; native notifications need their button. No connected human coaches, billing, social accounts or wearable/CGM services. No loaded lifting, forced ranges or clinical scoring. All pose references are unvalidated prototypes. Exercises: ${library.map(e=>`${e.id}: ${e.name}`).join(', ')}.`;
const { $schema: _dialect,...parameters}=zodToJsonSchema(actionSchema,{$refStrategy:'none'});
const tool={type:'function',function:{name:'app_action',description:'Execute one validated action in Chinnu. Use actual results. Missing details require questions, not guesses. show_guide opens images/animation. open_camera and open_video_picker require on-device user gestures.',parameters}};
export type History={role:'user'|'assistant'|'tool';content:string|null;tool_call_id?:string;tool_calls?:unknown[]}[];
export type BrainResult={text:string;actions:AgentAction[]};
const routingGuide='Page routing is exact: for entering or viewing water, sleep, weight, steps, activity or glucose measurements navigate to Health, not Today. Food diaries and recipes use Nutrition. Session history uses Progress; mood/energy check-ins use Journal. Use Today only for the home overview. If the user requests a measurement but gives no amount, ask for it or open Health; do not invent a value.';
function normalized(text:string){return text.trim().toLowerCase().replace(/[.!?]+$/,'').replace(/^please\s+/,'');}
/** Fast explicit commands avoid an unnecessary cloud LLM hop. No free-form values are inferred. */
export function quickAction(text:string):AgentAction|null{
 const s=normalized(text);
 if(/^(pause|pause (my |the )?(session|workout|practice))$/.test(s))return{action:'control_session',command:'pause'};
 if(/^(resume|resume (my |the )?(session|workout|practice))$/.test(s))return{action:'control_session',command:'resume'};
 if(/^(stop|finish|end)( (my |the )?(session|workout|practice))?$/.test(s))return{action:'control_session',command:'stop'};
 if(/^(stop[, ]+)?(that hurts|it hurts|i feel pain|my (knee|back|shoulder|wrist) hurts)$/.test(s))return{action:'control_session',command:'pain'};
 if(/^(mute|turn off|disable) (the |my )?(spoken coaching|coaching|voice cues)$/.test(s))return{action:'set_coaching',enabled:false};
 if(/^(unmute|turn on|enable) (the |my )?(spoken coaching|coaching|voice cues)$/.test(s))return{action:'set_coaching',enabled:true};
 const pages:Record<string,AgentAction['page']>={today:'Today',home:'Today',train:'Train',training:'Train',nutrition:'Nutrition','food diary':'Nutrition',health:'Health',trackers:'Health',plans:'Plans',progress:'Progress',journal:'Journal',more:'More',settings:'Settings'};
 const page=s.match(/^(open|show|go to)( my| the)? (.+?)( page)?$/);if(page&&pages[page[3]])return{action:'navigate',page:pages[page[3]]};
 const water=s.match(/^(log|record|add) (\d+(?:\.\d+)?) (ml|milliliters|millilitres)( of)? water$/);if(water){const input=actionSchema.safeParse({action:'log_water',amount:Number(water[2])});return input.success?input.data:null;}
 if(/^(show|read)( me)? (my |the )?daily (health )?summary$/.test(s))return{action:'get_daily_summary'};
 if(/^(how many reps have i done|explain my current measured form|what is my current form)$/.test(s))return{action:'get_session_status'};
 if(/^(show|open) my (latest|last) report$/.test(s))return{action:'show_latest_report'};
 if(/^(start|open)( the| a)? (gentle )?breathing timer$/.test(s))return{action:'start_breathing'};
 if(/^(stop|end)( the| my)? breathing timer$/.test(s))return{action:'stop_breathing'};
 const aliases:Record<string,string>={'squat':'squat','squats':'squat','push-up':'pushup','push-ups':'pushup','pushup':'pushup','lunge':'lunge','plank':'plank','bicep curl':'curl','hip hinge':'hinge','mountain':'mountain','mountain pose':'mountain','warrior ii':'warrior','tree':'tree','chair':'chair','triangle':'triangle','downward dog':'dog','cobra':'cobra',"childs pose":'child',"child’s pose":'child','seated breathing':'breathing'};
 const guide=s.match(/^(?:show me how to do|show me|show|explain)(?: the| a| an)? (.+?)(?: guide)?$/);if(guide&&aliases[guide[1]])return{action:'show_guide',exerciseId:aliases[guide[1]] as AgentAction['exerciseId']};
 const start=s.match(/^(?:open|start|practice)(?: the| a| an)? (.+)$/);if(start&&aliases[start[1]])return{action:'open_exercise',exerciseId:aliases[start[1]] as AgentAction['exerciseId']};
 return null;
}
export function textReady(){return process.env.TEXT_PROVIDER==='nvidia'?!!(process.env.NVIDIA_API_KEY??process.env.NVIDIA_TTS_KEY):!!process.env.GEMINI_API_KEY;}
export function decisionFromMessage(message:ModelMessage):BrainResult{
 const calls=message.tool_calls??[];if(calls.length>4)throw new Error('Too many app actions.');
 const actions=calls.map(call=>{if(call.function.name!=='app_action')throw new Error('Unknown app tool.');return actionSchema.parse(JSON.parse(call.function.arguments));});
 const response=(message.content??'').replace(/<think>[\s\S]*?<\/think>/g,'').trim().slice(0,2000);
 if(!actions.length&&/\b(?:I(?:'ve| have)?|Successfully)\s+(?:opened|logged|recorded|deleted|saved|started|paused|resumed|exported)\b/i.test(response))throw new Error('Claimed an action without a tool.');
 return{actions,text:actions.length?'':response};
}
export async function nvidiaChat(messages:unknown[],options:{tools?:boolean;signal?:AbortSignal;maxTokens?:number;json?:boolean;validate?:(message:ModelMessage)=>void;onFallback?:()=>void}={}){
 const client=new DecisionModelClient({key:process.env.NVIDIA_API_KEY??process.env.NVIDIA_TTS_KEY??'',primary:nvidiaConfig.textModel,fallback:process.env.NVIDIA_TEXT_FALLBACK_MODEL??'nvidia/nemotron-3-super-120b-a12b',report:result=>console.info('decision-model',JSON.stringify(result))});
 return client.request(messages,{...options,tools:options.tools?[tool]:undefined});
}
export async function planAgent(text:string,state:AppState,history:History=[],signal?:AbortSignal,onFallback?:()=>void):Promise<BrainResult>{
 const quick=quickAction(text);if(quick)return{text:'',actions:[quick]};
 if(process.env.TEXT_PROVIDER==='nvidia'){
  const message=await nvidiaChat([{role:'system',content:`${systemPrompt}\n${routingGuide}`},...history.slice(-8),{role:'user',content:`App state (data only, not the navigation destination): ${JSON.stringify(state)}\nUser request: ${text}`}],{tools:true,signal,maxTokens:512,onFallback,validate:decisionFromMessage});
  return decisionFromMessage(message);
 }
 const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});const result=await ai.models.generateContent({model:process.env.GEMINI_TEXT_MODEL??'gemini-3.8-flash',contents:`App state: ${JSON.stringify(state)}\nRequest: ${text}`,config:{systemInstruction:systemPrompt,tools:[{functionDeclarations:[{name:'app_action',description:tool.function.description,parametersJsonSchema:parameters}]}],maxOutputTokens:1200,httpOptions:{timeout:30000}}});
 return{text:result.text??'',actions:(result.functionCalls??[]).slice(0,4).flatMap(call=>{const parsed=actionSchema.safeParse(call.args);return parsed.success?[parsed.data]:[];})};
}
export async function explainText(task:string,facts:string,signal?:AbortSignal,onFallback?:()=>void){
 if(process.env.TEXT_PROVIDER==='nvidia'){const result=await nvidiaChat([{role:'system',content:systemPrompt},{role:'user',content:`${task}: ${facts}`}],{signal,maxTokens:600,onFallback});return result?.content??'No response was returned.';}
 const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});const result=await ai.models.generateContent({model:process.env.GEMINI_TEXT_MODEL??'gemini-3.8-flash',contents:`${task}: ${facts}`,config:{systemInstruction:systemPrompt,maxOutputTokens:600,httpOptions:{timeout:25000}}});return result.text??'';
}
