import type {CoachingEvent} from './coaching';
import {actionSchema,type ExecuteAction} from '../agent/actions';
import {appSession} from '../agent/session';
export function backendURL(value:string){
 let url:URL;try{url=new URL(value);}catch{throw new Error('Set your Render HTTPS backend URL in Settings first.');}
 const local=['localhost','127.0.0.1'].includes(url.hostname);
 if(url.protocol!=='https:'&&!(url.protocol==='http:'&&local))throw new Error('Use HTTPS for your backend. HTTP is allowed only for USB localhost testing.');
 if(url.username||url.password||url.search||url.hash)throw new Error('Use a backend URL without credentials, query or fragment.');
 return url.href.replace(/\/$/,'');
}
export function connectionHelp(url:string){return /https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url)
 ?'USB backend unreachable. Localhost works only while this phone is connected to your Mac and adb reverse tcp:10000 tcp:10000 is active. Reconnect USB or enter a deployed Render HTTPS URL in Settings. Automatic local spoken corrections still work.'
 :'Cannot reach the cloud backend. Check phone internet, the Render HTTPS URL and whether the service is running. Automatic local spoken corrections still work.';}
async function request(url:string,options:RequestInit){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),65000);try{return await fetch(url,{...options,signal:controller.signal});}finally{clearTimeout(timer);}}
export async function checkBackend(value:string){const url=backendURL(value);let response:Response;try{response=await request(`${url}/health`,{});}catch{throw new Error(connectionHelp(url));}if(!response.ok)throw new Error(`Backend health check returned HTTP ${response.status}.`);return await response.json() as {status:string;voiceConfigured:boolean};}
export class VoiceCoach {
 private socket?:WebSocket;private context?:AudioContext;private stream?:MediaStream;private node?:AudioWorkletNode;private source?:MediaStreamAudioSourceNode;private gain?:GainNode;private nextTime=0;private outputs:AudioBufferSourceNode[]=[];private version=0;private ready=false;private pendingUntil=0;
 constructor(private status:(value:string)=>void,private text:(value:string)=>void,private command:(value:string)=>void,private execute?:ExecuteAction){}
 get connected(){return this.ready&&this.socket?.readyState===WebSocket.OPEN;}
 get busy(){return this.outputs.length>0||Date.now()<this.pendingUntil;}
  async connect(value:string){
   const url=backendURL(value);
  this.disconnect();const version=this.version;this.status('Connecting');
  try{
   // Unlock audio synchronously from the button gesture, before awaiting network.
   this.context=new AudioContext({sampleRate:16000});await this.context.resume();
   const token=await appSession(url);
   if(this.version!==version)return;
   await this.context!.audioWorklet.addModule('/audio-worklet.js');
   const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
   if(this.version!==version){media.getTracks().forEach(t=>t.stop());return;}this.stream=media;
   const ws=new WebSocket(`${url.replace(/^http/,'ws')}/voice`);this.socket=ws;
   await new Promise<void>((resolve,reject)=>{
     let settled=false;const timeout=setTimeout(()=>{if(!settled){settled=true;reject(new Error('Voice setup timed out. Retry or use automatic local spoken coaching.'));}},20000);
    const fail=(message:string)=>{clearTimeout(timeout);if(!settled){settled=true;reject(new Error(message));}else{this.text(message);this.disconnect();}};
     ws.onopen=()=>ws.send(JSON.stringify({type:'auth',token}));
    ws.onmessage=e=>{if(this.version!==version)return;try{const msg=JSON.parse(e.data);
     if(msg.type==='ready'&&!this.ready){clearTimeout(timeout);this.ready=true;this.status('Listening');this.source=this.context!.createMediaStreamSource(this.stream!);this.node=new AudioWorkletNode(this.context!,'microphone');this.gain=this.context!.createGain();this.gain.gain.value=0;this.source.connect(this.node);this.node.connect(this.gain);this.gain.connect(this.context!.destination);
       this.node.port.onmessage=event=>{if(ws.readyState!==WebSocket.OPEN||ws.bufferedAmount>65536||this.busy)return;const values=event.data as Float32Array;const ratio=this.context!.sampleRate/16000;const pcm=new Int16Array(Math.floor(values.length/ratio));for(let i=0;i<pcm.length;i++)pcm[i]=Math.max(-1,Math.min(1,values[Math.floor(i*ratio)]))*32767;let binary='';for(const v of new Uint8Array(pcm.buffer))binary+=String.fromCharCode(v);ws.send(JSON.stringify({type:'audio',data:btoa(binary)}));};settled=true;resolve();
     }
     if(msg.type==='text')this.text(msg.text);
     if(msg.type==='transcript')this.text(`Heard: ${msg.text}`);
     if(msg.type==='notice')this.text(msg.text);
     if(msg.type==='processing')this.pendingUntil=Date.now()+65000;
     if(msg.type==='command')this.command(msg.command);
     if(msg.type==='tool'){
      const action=actionSchema.safeParse(msg.action);const execute=this.execute;
      void(async()=>{let result;try{result=action.success&&execute?await execute(action.data):{ok:false,message:'Unsupported or unavailable app action.'};}catch{result={ok:false,message:'App action failed.'};}if(this.version===version&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'toolResult',id:msg.id,result}));})();
     }
     if(msg.type==='audio')this.play(msg.data,msg.rate??24000);
     if(msg.type==='turnComplete')this.pendingUntil=0;
     if(msg.type==='interrupted'){this.stopOutput();this.pendingUntil=0;}
     if(msg.type==='error')fail(msg.error);
    }catch{fail('Could not process voice response. Local coaching is available.');}};
    ws.onerror=()=>fail(connectionHelp(url));ws.onclose=()=>fail('Cloud voice disconnected. Reconnect when ready; automatic local coaching continues.');
   });
  }catch(error){this.disconnect();throw error;}
 }
  private play(base64:string,rate:number){if(!this.context||this.nextTime-this.context.currentTime>30)return;const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));const pcm=new Int16Array(bytes.buffer);const buffer=this.context.createBuffer(1,pcm.length,rate);const channel=buffer.getChannelData(0);for(let i=0;i<pcm.length;i++)channel[i]=pcm[i]/32768;const source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.context.destination);this.nextTime=Math.max(this.context.currentTime,this.nextTime);source.start(this.nextTime);this.nextTime+=buffer.duration;this.outputs.push(source);source.onended=()=>{this.outputs=this.outputs.filter(s=>s!==source);};}
 private stopOutput(){for(const source of this.outputs)try{source.stop();}catch{}this.outputs=[];this.nextTime=0;}
 sendContext(value:unknown){if(this.connected)this.socket!.send(JSON.stringify({type:'context',value}));}
 sendAppState(value:unknown){if(this.connected)this.socket!.send(JSON.stringify({type:'appState',value}));}
  request(text:string){if(!this.connected)return false;this.socket!.send(JSON.stringify({type:'request',text:text.slice(0,1500)}));return true;}
  interrupt(){this.stopOutput();this.pendingUntil=0;if(this.connected)this.socket!.send(JSON.stringify({type:'interrupt'}));}
 coach(event:CoachingEvent){if(!this.connected||this.busy)return false;this.socket!.send(JSON.stringify({type:'coach',value:event}));this.pendingUntil=Date.now()+10000;return true;}
 disconnect(){this.version++;this.ready=false;this.pendingUntil=0;const ws=this.socket;this.socket=undefined;if(ws){ws.onclose=null;ws.onerror=null;ws.onmessage=null;ws.close();}this.node?.disconnect();this.source?.disconnect();this.gain?.disconnect();this.stream?.getTracks().forEach(t=>t.stop());this.stopOutput();void this.context?.close();this.context=undefined;this.stream=undefined;this.status('Disconnected');}
}
