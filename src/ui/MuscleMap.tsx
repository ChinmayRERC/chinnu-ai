import {useState} from 'react';
import {RotateCcw} from 'lucide-react';
import {library} from '../exercises/engine';

type View='Front'|'Back';
type Muscle={name:string;view:View;x:number;y:number;note:string};

const muscles:Muscle[]=[
 {name:'Shoulders',view:'Front',x:50,y:25,note:'Shoulder-supported pressing, reaching, and stability practices.'},
 {name:'Chest',view:'Front',x:50,y:32,note:'Upper-body pushing practices with chest involvement.'},
 {name:'Biceps',view:'Front',x:25,y:39,note:'Elbow-flexion practices such as the controlled curl.'},
 {name:'Core',view:'Front',x:50,y:48,note:'Trunk-control and bracing practices.'},
 {name:'Quads',view:'Front',x:42,y:68,note:'Knee-extension and lower-body practices.'},
 {name:'Calves',view:'Front',x:59,y:86,note:'Lower-leg support and balance practices.'},
 {name:'Shoulders',view:'Back',x:50,y:25,note:'Shoulder-supported pressing, reaching, and stability practices.'},
 {name:'Triceps',view:'Back',x:75,y:39,note:'Elbow-extension support in upper-body pushing practices.'},
 {name:'Lower back',view:'Back',x:50,y:49,note:'Unloaded hinge and gentle mobility practices only.'},
 {name:'Glutes',view:'Back',x:50,y:59,note:'Hip-extension and lower-body stability practices.'},
 {name:'Hamstrings',view:'Back',x:42,y:72,note:'Hip-extension and posterior-leg practices.'},
 {name:'Calves',view:'Back',x:59,y:86,note:'Lower-leg support and balance practices.'}
];

export default function MuscleMap({selected,onSelect}:{selected:string;onSelect:(muscle:string)=>void}){
 const [view,setView]=useState<View>('Front');
 const visible=muscles.filter(m=>m.view===view),active=muscles.find(m=>m.name===selected);
 return <section className="card muscle-explorer" aria-labelledby="muscle-map-title"><div className="muscle-copy"><span className="eyebrow accent">CHINNU MUSCLE MAP</span><h2 id="muscle-map-title">Tap a muscle. Find a practice.</h2><p>Explore the movements already supported by Chinnu's local camera guidance. The map describes exercise involvement, not pain, injury, or anatomy diagnosis.</p><div className="tabs compact" aria-label="Body view"><button className={view==='Front'?'active':''} onClick={()=>setView('Front')}>Front</button><button className={view==='Back'?'active':''} onClick={()=>setView('Back')}>Back</button></div>{active?<div className="muscle-selection"><span className="eyebrow">SELECTED AREA</span><h3>{active.name}</h3><p>{active.note}</p><strong>{library.filter(e=>e.muscles.includes(active.name)).length} supported practices</strong><button className="text-button" onClick={()=>onSelect('')}><RotateCcw size={14}/>Show every practice</button></div>:<div className="muscle-selection muted"><h3>Choose an area</h3><p>Each point filters the library below. You can still search or switch categories.</p></div>}</div><div className="body-map" data-view={view.toLowerCase()} aria-label={`${view} body muscle selector`}><svg viewBox="0 0 160 320" aria-hidden="true"><circle cx="80" cy="28" r="18"/><path d="M57 57 Q80 44 103 57 L116 139 Q105 163 99 187 L108 296 L86 296 L80 203 L74 296 L52 296 L61 187 Q55 164 44 139 Z"/><path d="M50 64 L20 142 L36 149 L63 92 M110 64 L140 142 L124 149 L97 92"/></svg>{visible.map(m=><button key={`${m.view}-${m.name}`} className={selected===m.name?'muscle-point selected':'muscle-point'} style={{left:`${m.x}%`,top:`${m.y}%`}} onClick={()=>onSelect(selected===m.name?'':m.name)} aria-label={`${selected===m.name?'Clear':'Show'} ${m.name} practices`}><span>{m.name}</span></button>)}</div></section>;
}
