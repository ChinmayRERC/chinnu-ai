import {useState} from 'react';
import {Mic,Sparkles,X,Send,Square} from 'lucide-react';
import {useAgent} from './AgentProvider';
import {commandExamples} from './actions';
export default function AgentDock(){const agent=useAgent();const [open,setOpen]=useState(false),[text,setText]=useState(''),[consent,setConsent]=useState(false),[error,setError]=useState('');return <div className="agent-dock">
 <button className="agent-launcher" onClick={()=>setOpen(!open)}><Sparkles size={19}/>{agent.status==='Listening'?'Chinnu is listening':'Ask Chinnu'}<span className={agent.status==='Listening'?'agent-dot live':'agent-dot'}/></button>
 {open&&<section className="agent-panel"><header><div><span className="eyebrow accent">YOUR IN-APP AGENT</span><h3>Say it. Chinnu can help.</h3></div><button className="icon-button" aria-label="Close agent" onClick={()=>setOpen(false)}><X/></button></header>
 <p>Open exercises, show visual guides, control training, review progress and record check-ins. Chinnu works inside this app, not across other phone apps.</p>
 <div className="agent-examples">{commandExamples.slice(0,6).map(example=><button key={example} onClick={()=>setText(example)}>{example}</button>)}</div>
 <div className="agent-caption" role="status">{agent.caption||'Try “Show me how to do a squat” or “Open my progress”.'}</div>
 <form onSubmit={e=>{e.preventDefault();if(text.trim()){void agent.submit(text.trim());setText('');}}}><input aria-label="Message Chinnu" placeholder="Ask or tell Chinnu what to do…" value={text} maxLength={1500} onChange={e=>setText(e.target.value)}/><button className="primary" disabled={agent.busy||!text.trim()} aria-label="Send agent message"><Send size={18}/></button></form>
 {agent.status!=='Listening'?<><label className="check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Allow cloud microphone audio, requests and requested app results to reach the AI provider. Camera video stays local.</label><button className="primary full" disabled={!consent||agent.status==='Connecting'} onClick={async()=>{setError('');try{await agent.connect();}catch(e){setError(e instanceof Error?e.message:'Voice unavailable.');}}}><Mic size={17}/>{agent.status==='Connecting'?'Connecting…':'Talk to Chinnu'}</button></>:<button className="secondary full" onClick={agent.disconnect}><Square size={16}/>Disconnect microphone</button>}
 {error&&<div className="error">{error}</div>}
 {agent.events.length>0&&<details><summary>Actions actually executed</summary>{agent.events.map((event,i)=><div className="agent-event" key={i}><strong>{event.action} · {event.result.ok?'done':'not done'}</strong><p>{event.result.message}</p></div>)}</details>}
 <small>Exports and data deletion require on-device confirmation. Voice never bypasses screening or permission prompts. Text requests also use cloud AI when sent.</small>
 </section>}
 </div>;}
