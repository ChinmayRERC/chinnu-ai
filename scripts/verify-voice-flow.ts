import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {WebSocket} from 'ws';
import {synthesize,transcribe,closeSpeechClients} from '../server/nvidia';
import {resamplePCM} from '../server/audio';
const supplied=process.argv[2];const base=supplied??'http://127.0.0.1:10096';
const child=supplied?null:spawn(process.execPath,['--import','tsx','server/index.ts'],{env:{...process.env,PORT:'10096'},stdio:'ignore'});
try{
 if(child){for(let i=0;i<30;i++){try{if((await fetch(`${base}/health`)).ok)break;}catch{}if(child.exitCode!==null)throw new Error('Test backend failed to start');await new Promise(r=>setTimeout(r,150));}}
 const auth=await fetch(`${base}/sessions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId:randomUUID()}),signal:AbortSignal.timeout(65000)});const credentials=await auth.json();if(!auth.ok)throw new Error(credentials.error??'Anonymous session failed');console.log('Automatic session:',auth.status,'no access code');
 const audio=await synthesize('Hey Chinnu, open my progress.');const pcm=resamplePCM(audio.pcm,audio.rate);const transcript=await transcribe(pcm);console.log('Synthetic wake-word transcript:',transcript);
 await new Promise<void>((resolve,reject)=>{
  const ws=new WebSocket(`${base.replace(/^http/,'ws')}/voice`);let sent=false,acted=false,audioBytes=0;const timeout=setTimeout(()=>finish(new Error('Voice pipeline timed out')),65000);let interval:ReturnType<typeof setInterval>|undefined;
  const finish=(error?:Error)=>{clearTimeout(timeout);if(interval)clearInterval(interval);ws.close();if(error)reject(error);else resolve();};
  ws.on('open',()=>ws.send(JSON.stringify({type:'auth',token:credentials.token})));
  ws.on('message',raw=>{const message=JSON.parse(raw.toString());
   if(['notice','error'].includes(message.type))console.log('Voice message:',message.type,message.text??message.error);
   if(message.type==='ready'){console.log('NVIDIA voice ready:',message.provider,message.mode);if(!sent){sent=true;ws.send(JSON.stringify({type:'request',text:transcript}));}}
   if(message.type==='transcript')console.log('Parakeet test transcript:',message.text);
   if(message.type==='tool'){if(message.action.action!=='navigate'||message.action.page!=='Progress'){finish(new Error('Unexpected action from test speech'));return;}acted=true;console.log('Actual ASR-driven tool:',JSON.stringify(message.action));ws.send(JSON.stringify({type:'toolResult',id:message.id,result:{ok:true,message:'Synthetic verification client opened Progress.'}}));}
   if(message.type==='audio'&&acted)audioBytes+=Buffer.from(message.data,'base64').length;
   if(message.type==='turnComplete'&&acted){if(audioBytes<1000){finish(new Error('No spoken action receipt'));return;}console.log('Magpie spoken receipt:',audioBytes,'PCM bytes');finish();}
   if(message.type==='error')finish(new Error(message.error));
  });ws.on('error',error=>finish(new Error(`Voice transport failed: ${error.message}`)));
 });
}catch(error){console.error(error instanceof Error?error.message:'Voice test failed');process.exitCode=1;}finally{child?.kill('SIGTERM');closeSpeechClients();}
