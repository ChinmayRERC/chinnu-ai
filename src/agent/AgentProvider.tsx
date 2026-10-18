import {createContext,useContext,useEffect,useRef,useState,type ReactNode,type MutableRefObject} from 'react';
import {VoiceCoach} from '../feedback/voice';
import {actionSchema,type ExecuteAction,type AgentAction,type ActionResult} from './actions';
import {getBackendURL} from './config';
type AgentState={voice:MutableRefObject<VoiceCoach|null>;status:string;caption:string;connect:()=>Promise<void>;disconnect:()=>void;execute:ExecuteAction;register:(handler:ExecuteAction)=>()=>void;registerSession:(handler:ExecuteAction)=>()=>void;setContext:(value:Record<string,unknown>)=>void;submit:(text:string)=>Promise<void>;busy:boolean;events:{action:string;result:ActionResult}[]};
const Context=createContext<AgentState|null>(null);
export function AgentProvider({children}:{children:ReactNode}){
 const voice=useRef<VoiceCoach|null>(null),executor=useRef<ExecuteAction|null>(null),session=useRef<ExecuteAction|null>(null),context=useRef<Record<string,unknown>>({});
 const [status,setStatus]=useState('Disconnected'),[caption,setCaption]=useState(''),[busy,setBusy]=useState(false),[events,setEvents]=useState<AgentState['events']>([]);
 useEffect(()=>{const hide=()=>{if(document.hidden){voice.current?.disconnect();}};document.addEventListener('visibilitychange',hide);return()=>{document.removeEventListener('visibilitychange',hide);voice.current?.disconnect();};},[]);
 const execute:ExecuteAction=async input=>{const parsed=actionSchema.safeParse(input);if(!parsed.success)return{ok:false,message:'The requested action is not supported.'};let result:ActionResult;
  try{const sessionAction=['control_session','set_coaching','open_camera','open_video_picker'].includes(parsed.data.action);const handler=sessionAction?session.current:executor.current;result=handler?await handler(parsed.data):{ok:false,message:sessionAction?'Open an exercise first; no active trainer is available.':'Complete onboarding first.'};}catch{result={ok:false,message:'Action could not be completed. Your local data was preserved.'};}
  setEvents(e=>[...e.slice(-7),{action:parsed.data.action,result}]);return result;
 };
 async function connect(){voice.current?.disconnect();const next=new VoiceCoach(setStatus,setCaption,command=>{void execute({action:'control_session',command:command as AgentAction['command']});},execute);voice.current=next;await next.connect(getBackendURL(),localStorage.getItem('chinnu-access')??'');next.sendAppState(context.current);}
 async function submit(text:string){if(busy)return;if(voice.current?.request(text)){setCaption('Request sent to the connected voice agent…');return;}setBusy(true);setCaption('Understanding your request…');try{
  const base=getBackendURL();if(!base)throw new Error('Set the Render backend URL in Settings first.');
  const auth=await fetch(`${base}/sessions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessCode:localStorage.getItem('chinnu-access')??''}),signal:AbortSignal.timeout(65000)});const credentials=await auth.json();if(!auth.ok)throw new Error(credentials.error??'Agent access failed.');
  const response=await fetch(`${base}/agent`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${credentials.token}`},body:JSON.stringify({text,context:context.current}),signal:AbortSignal.timeout(30000)});const plan=await response.json();if(!response.ok)throw new Error(plan.error??'Agent request failed.');
  const results:ActionResult[]=[];for(const action of (plan.actions??[]).slice(0,4))results.push(await execute(action));
  setCaption(results.length?results.map(r=>r.message).join(' '):plan.text||'Tell me which app feature you want to use.');
 }catch(e){setCaption(e instanceof TypeError?'Backend unreachable. Check the Render URL and internet in Settings.':e instanceof Error?e.message:'Agent unavailable.');}finally{setBusy(false);}}
 return <Context.Provider value={{voice,status,caption,connect,disconnect:()=>voice.current?.disconnect(),execute,register:handler=>{executor.current=handler;return()=>{if(executor.current===handler)executor.current=null;};},registerSession:handler=>{session.current=handler;return()=>{if(session.current===handler)session.current=null;};},setContext:value=>{if(JSON.stringify(context.current)===JSON.stringify(value))return;context.current=value;voice.current?.sendAppState(value);},submit,busy,events}}>{children}</Context.Provider>;
}
export function useAgent(){const state=useContext(Context);if(!state)throw new Error('AgentProvider missing');return state;}
