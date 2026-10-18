import {describe,it,expect} from 'vitest';
import {CoachingScheduler} from '../src/feedback/coaching';
import {backendURL,connectionHelp} from '../src/feedback/voice';
import type {Sample} from '../src/exercises/engine';
const sample:Sample={time:0,score:50,tracked:true,phase:'hold',reps:1,hold:0,cue:'Adjust',features:{knee:70},flags:[{time:0,rep:1,feature:'knee',value:70,min:90,max:150,cue:'Soften your knees',explanation:'Measured knee angle.'}]};
describe('continuous spoken coaching',()=>{
 it('repeats a sustained correction without flooding the speaker',()=>{const c=new CoachingScheduler();expect(c.next(sample,1)?.kind).toBe('correction');expect(c.next(sample,3)).toBeNull();expect(c.next(sample,11)?.text).toBe('Soften your knees');});
 it('asks for repositioning instead of correcting unreliable joints',()=>{const c=new CoachingScheduler();const lost={...sample,tracked:false,score:null};expect(c.next(lost,0)).toBeNull();expect(c.next(lost,3)?.kind).toBe('tracking');expect(c.next(lost,5)).toBeNull();});
 it('only encourages a measured high-quality sample',()=>{const c=new CoachingScheduler();expect(c.next({...sample,flags:[],score:null},0)).toBeNull();expect(c.next({...sample,flags:[],score:95},1)?.kind).toBe('encouragement');expect(c.next({...sample,flags:[],score:95},10)).toBeNull();});
});
describe('backend diagnostics',()=>{
 it('accepts only secure remote URLs or actual loopback hosts',()=>{expect(backendURL('http://localhost:10000/')).toBe('http://localhost:10000');expect(()=>backendURL('http://localhost.attacker.example')).toThrow();expect(()=>backendURL('http://example.com')).toThrow();expect(()=>backendURL('https://user:pass@example.com')).toThrow();});
 it('explains the USB dependency instead of a generic fetch failure',()=>{expect(connectionHelp('http://localhost:10000')).toContain('adb reverse');expect(connectionHelp('https://app.onrender.com')).toContain('Render');});
});
