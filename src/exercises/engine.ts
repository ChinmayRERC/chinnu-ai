import { z } from 'zod';
import raw from './library.json';
export type Point={x:number;y:number;z?:number;visibility?:number;presence?:number};
const rule=z.object({feature:z.string(),min:z.number(),max:z.number(),cue:z.string(),explanation:z.string()});
const schema=z.object({id:z.string(),name:z.string(),category:z.enum(['Gym','Yoga','Breathing']),view:z.enum(['Side','Front']),feature:z.string().optional(),phase:z.object({low:z.number(),high:z.number()}).optional(),rules:z.array(rule),seconds:z.number(),restricted:z.boolean(),expertReviewNeeded:z.boolean()});
export const library=z.array(schema).parse(raw);
export type Exercise=z.infer<typeof schema>;
export type Flag={time:number;rep:number;feature:string;value:number;min:number;max:number;cue:string;explanation:string};
export type Sample={time:number;score:number|null;tracked:boolean;phase:string;reps:number;hold:number;cue:string;features:Record<string,number>;flags:Flag[]};
export function angle(a:Point,b:Point,c:Point){const u={x:a.x-b.x,y:a.y-b.y},v={x:c.x-b.x,y:c.y-b.y};const n=Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y);return n<1e-8?NaN:Math.acos(Math.max(-1,Math.min(1,(u.x*v.x+u.y*v.y)/n)))*180/Math.PI;}
const visible=(p:Point|undefined)=>!!p&&Math.min(p.visibility??0,p.presence??1)>=.65&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export function features(points:Point[],width:number,height:number):Record<string,number>{
 const p=points.map(v=>({...v,x:v.x*width,y:v.y*height}));
 const left=[11,13,15,23,25,27],right=[12,14,16,24,26,28];
 const side=left.filter(i=>visible(p[i])).length>=right.filter(i=>visible(p[i])).length?left:right;
 const [s,e,w,h,k,a]=side;const out:Record<string,number>={};
 const joint=(name:string,ids:number[])=>{if(ids.every(i=>visible(p[i])))out[name]=angle(p[ids[0]],p[ids[1]],p[ids[2]]);};
 joint('knee',[h,k,a]);joint('hip',[s,h,k]);joint('elbow',[s,e,w]);joint('body',[s,h,a]);joint('armLine',[s,e,w]);joint('upperArm',[e,s,h]);
 if(visible(p[s])&&visible(p[h]))out.trunk=Math.atan2(Math.abs(p[s].x-p[h].x),Math.abs(p[s].y-p[h].y))*180/Math.PI;
 if(visible(p[11])&&visible(p[12]))out.shoulderTilt=Math.atan2(Math.abs(p[11].y-p[12].y),Math.abs(p[11].x-p[12].x))*180/Math.PI;
 return out;
}
class OneEuro {
 value:number|undefined;derivative=0;time:number|undefined;
 filter(x:number,t:number){if(this.time===undefined||t-this.time>1||t<=this.time){this.value=x;this.time=t;this.derivative=0;return x;}const dt=t-this.time;const alpha=(cutoff:number)=>1/(1+1/(2*Math.PI*cutoff*dt));this.derivative+=alpha(1)*((x-this.value!)/dt-this.derivative);this.value!+=alpha(1+.015*Math.abs(this.derivative))*(x-this.value!);this.time=t;return this.value!;}
}
export class MovementEngine {
 reps=0;hold=0;phase='ready';private start:number|null=null;private previous:number|null=null;private stageAt=0;private filters=new Map<string,OneEuro>();private violation=new Map<string,number>();private lastFlag=new Map<string,number>();
 constructor(public exercise:Exercise){}
 suspend(){this.previous=null;this.phase='ready';this.start=null;this.filters.clear();this.violation.clear();}
 update(points:Point[],time:number,width:number,height:number):Sample {
 const gap=this.previous===null?0:time-this.previous;this.previous=time;
 if(gap>1||gap<0){this.phase='ready';this.start=null;this.filters.clear();this.violation.clear();}
 const f=features(points,width,height);for(const [k,v]of Object.entries(f)){if(!this.filters.has(k))this.filters.set(k,new OneEuro());f[k]=this.filters.get(k)!.filter(v,time);}
 const needs=[...this.exercise.rules.map(r=>r.feature),...(this.exercise.feature?[this.exercise.feature]:[])];
 const tracked=needs.length?needs.every(k=>Number.isFinite(f[k])):[11,12,23,24].every(i=>visible(points[i]));
 const result=(score:number|null,cue:string,flags:Flag[]=[]):Sample=>({time,score,tracked,phase:this.phase,reps:this.reps,hold:this.hold,cue,features:f,flags});
 if(!tracked){this.phase='ready';this.start=null;this.violation.clear();this.filters.clear();return result(null,'Step into frame · keep required joints visible');}
 if(this.exercise.phase&&this.exercise.feature){const v=f[this.exercise.feature],{low,high}=this.exercise.phase;
 if(this.phase==='ready'&&v>high){this.phase='up';this.stageAt=time;}
 else if(this.phase==='up'&&v<low&&time-this.stageAt>.25){this.phase='down';this.stageAt=time;}
 else if(this.phase==='down'&&v>high&&time-this.stageAt>.25){this.reps++;this.phase='up';this.stageAt=time;}
 }
 let penalty=0;const flags:Flag[]=[];let cue='Keep a comfortable, controlled pace';
 for(const r of this.exercise.rules){const v=f[r.feature],delta=Math.max(r.min-v,v-r.max,0);penalty+=Math.min(40,delta*2);
 if(delta>0){if(!this.violation.has(r.feature))this.violation.set(r.feature,time);if(time-this.violation.get(r.feature)!>.6){cue=r.cue;if(time-(this.lastFlag.get(r.feature)??-10)>3){flags.push({...r,time,rep:this.reps+1,value:Math.round(v)});this.lastFlag.set(r.feature,time);}}}else this.violation.delete(r.feature);}
 const score=this.exercise.rules.length?Math.round(Math.max(0,100-penalty)):null;
 if(!this.exercise.phase&&gap>0&&gap<.5&&(score===null||score>=70))this.hold+=gap;
 if(!this.exercise.rules.length)cue='Rest comfortably · alignment is not scored for this pose';
 return result(score,cue,flags);
 }
}
export function breakdown(scores:number[]){if(scores.length<5)return null;const baseline=scores.slice(0,3).reduce((a,b)=>a+b,0)/3;for(let i=3;i<scores.length-1;i++)if(baseline-scores[i]>=15&&baseline-scores[i+1]>=15)return{rep:i+1,drop:Math.round(baseline-(scores[i]+scores[i+1])/2)};return null;}
