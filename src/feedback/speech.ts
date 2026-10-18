import {Capacitor,registerPlugin} from '@capacitor/core';
interface SpeechNative {speak(options:{text:string}):Promise<void>;stop():Promise<void>;}
const NativeSpeech=registerPlugin<SpeechNative>('ChinnuSpeech');
export async function speak(text:string){
 if(Capacitor.getPlatform()==='android'){await NativeSpeech.speak({text});return;}
 if(!('speechSynthesis'in window))throw new Error('Speech is not available in this browser. Use cloud voice or on-screen cues.');
 window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.rate=.95;window.speechSynthesis.speak(utterance);
}
export function stopSpeech(){if(Capacitor.getPlatform()==='android')void NativeSpeech.stop().catch(()=>{});else window.speechSynthesis?.cancel();}
