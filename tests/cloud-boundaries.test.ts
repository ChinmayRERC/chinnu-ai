import {afterAll,describe,it,expect} from 'vitest';
import {AccessStore,validAccessCode} from '../server/access';
import {UtteranceBuffer,resamplePCM} from '../server/audio';
import {quickAction} from '../server/brain';
import {closeSpeechClients} from '../server/nvidia';
afterAll(()=>closeSpeechClients());
describe('anonymous app session protection',()=>{
 it('expires tokens, bounds requests and limits per-IP session creation',()=>{let now=1000;const store=new AccessStore(()=>now);const token=store.create('device')!;expect(token.length).toBe(64);expect(store.authorize(`Bearer ${token}`)?.clientId).toBe('device');for(let i=0;i<12;i++)expect(store.allow('ip')).toBe(true);expect(store.allow('ip')).toBe(false);now+=60001;expect(store.allow('ip')).toBe(true);now+=900000;expect(store.get(token)).toBeNull();});
 it('enforces a daily budget and resets on a new UTC day',()=>{let now=Date.UTC(2026,9,18);const store=new AccessStore(()=>now);expect(store.consume(2)).toBe(true);expect(store.consume(2)).toBe(true);expect(store.consume(2)).toBe(false);now+=86400000;expect(store.consume(2)).toBe(true);});
 it('does not treat a provider key as a browser access password',()=>{expect(validAccessCode('secret','secret')).toBe(true);expect(validAccessCode('wrong','secret')).toBe(false);expect(validAccessCode('','')).toBe(false);});
});
function sound(bytes=8000){const p=Buffer.alloc(bytes);for(let i=0;i<bytes;i+=2)p.writeInt16LE(6000,i);return p;}
describe('bounded short-utterance audio',()=>{
 it('does not send silence to ASR and ends after a sustained pause',()=>{const b=new UtteranceBuffer();expect(b.push(Buffer.alloc(8000))).toBeNull();expect(b.push(sound())).toBeNull();let output:Buffer|null=null;for(let i=0;i<4;i++)output=b.push(Buffer.alloc(8000));expect(output?.length).toBe(40000);expect(b.push(Buffer.alloc(8000))).toBeNull();});
 it('caps continuous microphone segments at twelve seconds',()=>{const b=new UtteranceBuffer();let output:Buffer|null=null;for(let i=0;i<48;i++)output=b.push(sound());expect(output?.length).toBe(384000);expect(()=>b.push(Buffer.alloc(3))).toThrow();});
 it('resamples generated PCM to the ASR sample rate',()=>{expect(resamplePCM(Buffer.alloc(44100),22050).length).toBe(32000);});
});
describe('quick agent commands',()=>{
 it('maps explicit app commands without hallucinating quantities',()=>{expect(quickAction('Open my progress.')).toEqual({action:'navigate',page:'Progress'});expect(quickAction('Log 250 milliliters of water')).toEqual({action:'log_water',amount:250});expect(quickAction('Log some water')).toBeNull();expect(quickAction('Show me how to do a squat')).toEqual({action:'show_guide',exerciseId:'squat'});});
 it('does not match negated or unrelated stop/pain phrases',()=>{expect(quickAction("Don’t stop")).toBeNull();expect(quickAction("I don’t feel pain")).toBeNull();expect(quickAction('stop reading my messages')).toBeNull();expect(quickAction('Stop, that hurts')).toEqual({action:'control_session',command:'pain'});});
});
