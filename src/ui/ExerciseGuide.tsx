import {useEffect,useState} from 'react';
import {Play,Pause,ChevronLeft,ChevronRight,Volume2} from 'lucide-react';
import type {Exercise} from '../exercises/engine';
import {guides} from '../exercises/guides';
import {speak} from '../feedback/speech';
type XY=[number,number];
// Original schematic keyframes. Illustrations are not motion-capture data or scoring references.
const stand:XY[]=[[140,45],[140,80],[140,155],[140,215],[140,280],[105,125],[95,175],[175,125],[185,175],[175,215],[175,280]];
const shapes:Record<string,XY[]>={
 squat:[[152,73],[147,105],[100,166],[162,215],[150,280],[192,128],[226,126],[182,137],[222,145],[182,220],[180,280]],
 pushup:[[65,120],[95,142],[177,161],[220,180],[265,205],[85,185],[80,225],[120,183],[115,225],[225,188],[265,210]],
 lunge:[[135,65],[135,100],[135,170],[87,220],[87,280],[100,140],[95,185],[166,135],[175,180],[206,220],[250,272]],
 plank:[[58,125],[85,145],[165,160],[215,177],[270,190],[75,190],[105,220],[102,188],[125,220],[219,188],[270,205]],
 curl:[[140,45],[140,80],[140,155],[140,215],[140,280],[105,132],[111,85],[175,125],[185,175],[175,215],[175,280]],
 hinge:[[205,118],[178,132],[100,158],[125,222],[140,280],[196,176],[202,221],[178,180],[183,222],[155,220],[165,280]],
 mountain:stand,
 warrior:[[150,50],[150,85],[150,155],[82,205],[58,278],[90,90],[25,95],[218,90],[282,95],[222,210],[265,275]],
 tree:[[147,43],[147,78],[147,153],[145,218],[145,280],[109,104],[140,82],[183,105],[150,82],[207,192],[154,220]],
 chair:[[165,57],[162,92],[112,167],[168,218],[157,280],[185,62],[191,19],[201,81],[219,35],[190,215],[184,280]],
 triangle:[[125,125],[150,150],[206,171],[237,220],[266,279],[170,92],[190,25],[128,209],[101,268],[125,220],[76,279]],
 dog:[[79,218],[96,196],[165,100],[218,175],[265,253],[63,222],[29,261],[97,232],[62,270],[218,198],[256,270]],
 cobra:[[83,160],[102,186],[166,237],[216,255],[270,263],[93,228],[78,267],[122,230],[108,268],[216,265],[270,274]],
 child:[[65,237],[96,235],[167,204],[220,260],[152,273],[62,250],[19,266],[90,260],[41,275],[233,269],[165,285]],
 breathing:[[150,70],[150,105],[150,170],[100,220],[160,239],[109,155],[89,205],[190,156],[212,205],[212,220],[154,241]]
};
const edges=[[1,2],[2,3],[3,4],[1,5],[5,6],[1,7],[7,8],[2,9],[9,10]];
export default function ExerciseGuide({exercise,compact=false}:{exercise:Exercise;compact?:boolean}){
 const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[mode,setMode]=useState<'images'|'animation'>('images');const guide=guides[exercise.id];
 useEffect(()=>{setStep(0);setPlaying(false);},[exercise.id]);
 useEffect(()=>{if(!playing)return;const timer=setInterval(()=>setStep(s=>(s+1)%3),2200);return()=>clearInterval(timer);},[playing]);
 const target=shapes[exercise.id]??stand;const points=exercise.category==='Yoga'||exercise.category==='Breathing'||!exercise.phase?target:step===1?target:stand;
 return <section className={`card exercise-guide ${compact?'compact':''}`}><div className="section-heading"><div><span className="eyebrow accent">LEARN THE MOVEMENT</span><h3>How to do {exercise.name}</h3></div><span className="pill">{exercise.view} view</span></div>
 <div className="tabs"><button className={mode==='images'?'active':''} onClick={()=>{setMode('images');setPlaying(false);}}>Step images</button><button className={mode==='animation'?'active':''} onClick={()=>{setMode('animation');setPlaying(true);}}>Animated guide</button></div>
 <div className="guide-content"><div className="guide-illustration"><svg viewBox="0 0 300 310" role="img" aria-label={`${exercise.name} schematic reference, step ${step+1}`}><path d="M15 290H285" stroke="#577361" strokeWidth="2"/>{edges.map(([a,b],i)=><line key={i} x1={points[a][0]} y1={points[a][1]} x2={points[b][0]} y2={points[b][1]} stroke="#bce5a5" strokeWidth="9" strokeLinecap="round" style={{transition:mode==='animation'?'all .7s ease':'none'}}/>)}<circle cx={points[0][0]} cy={points[0][1]} r="16" stroke="#c4edab" strokeWidth="6" fill="none"/>{points.slice(1).map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4" fill="#effae8" style={{transition:mode==='animation'?'all .7s ease':'none'}}/>)}</svg><span>Original schematic · not a clinical reference</span></div>
 <div><p>{guide.setup}</p><ol>{guide.steps.map((text,i)=><li key={i} className={step===i?'selected':''}><button onClick={()=>{setStep(i);setPlaying(false);}}><b>{i+1}</b>{text}</button></li>)}</ol><div className="actions"><button className="icon-button" aria-label="Previous instruction" onClick={()=>{setStep((step+2)%3);setPlaying(false);}}><ChevronLeft/></button><button className="secondary" onClick={()=>{setMode('animation');setPlaying(!playing);}}>{playing?<Pause size={16}/>:<Play size={16}/>} {playing?'Pause':'Play'} guide</button><button className="icon-button" aria-label="Next instruction" onClick={()=>{setStep((step+1)%3);setPlaying(false);}}><ChevronRight/></button><button className="secondary" onClick={()=>void speak(`${exercise.name}. ${guide.steps[step]}`).catch(()=>{})}><Volume2 size={16}/>Read step</button></div></div></div>
 <div className="notice">{guide.avoid} All alignment thresholds and illustrations need qualified expert review. Animation is an instructional sketch, not a filmed demonstration.</div>
 </section>;
}
