import type {Sample} from '../exercises/engine';
export type CoachingEvent={kind:'correction'|'tracking'|'encouragement';text:string;measurement?:{feature:string;value:number;min:number;max:number}};
/** Scheduling uses wall time; video timestamp resets must not flood speech. */
export class CoachingScheduler {
 private last=-Infinity;private lastKey='';private missingSince:number|null=null;private lastCorrection=-Infinity;
 next(sample:Sample,now:number):CoachingEvent|null{
  if(!sample.tracked){this.missingSince??=now;if(now-this.missingSince<2||now-this.last<8)return null;this.last=now;this.lastKey='tracking';return{kind:'tracking',text:'Pause your movement. I cannot see the required joints clearly. Adjust the phone so your body is in frame.'};}
  this.missingSince=null;
  const flag=sample.flags.find(f=>Number.isFinite(f.value));
  if(flag){const key=flag.feature;if(now-this.last<(key===this.lastKey?9:5))return null;this.last=now;this.lastKey=key;this.lastCorrection=now;return{kind:'correction',text:flag.cue,measurement:{feature:flag.feature,value:flag.value,min:flag.min,max:flag.max}};}
  if(sample.score!==null&&sample.score>=85&&now-this.last>20&&now-this.lastCorrection>5){this.last=now;this.lastKey='encouragement';return{kind:'encouragement',text:'Your measured alignment is within the current reference. Keep moving comfortably.'};}
  return null;
 }
 reset(){this.last=-Infinity;this.lastKey='';this.missingSince=null;this.lastCorrection=-Infinity;}
}
