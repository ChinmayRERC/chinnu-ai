import {chromium} from 'playwright';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {synthesize,closeSpeechClients} from '../server/nvidia';
import {resamplePCM} from '../server/audio';
// Test-only fake microphone: locally generated speech, never a person's recording.
const output=resolve('test-results');mkdirSync(output,{recursive:true});
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 const speech=await synthesize('Open my progress.');const pcm=resamplePCM(speech.pcm,speech.rate);const audio=Buffer.concat([Buffer.alloc(6*32000),pcm,Buffer.alloc(8*32000)]);
 const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(audio.length+36,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(16000,24);header.writeUInt32LE(32000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(audio.length,40);
 const path=resolve(output,'synthetic-nvidia-test.wav');writeFileSync(path,Buffer.concat([header,audio]));
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-fake-device-for-media-stream',`--use-file-for-fake-audio-capture=${path}`,'--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({permissions:['microphone'],viewport:{width:390,height:844}});const page=await context.newPage();let received=0;
 page.on('websocket',socket=>socket.on('framereceived',frame=>{try{const msg=JSON.parse(String(frame.payload));if(msg.type==='audio')received+=Buffer.from(msg.data,'base64').length;if(msg.type==='transcript')console.log('Browser synthetic transcript:',msg.text);}catch{}}));
 await page.goto('https://chinnu-ai.onrender.com/?v=0.4',{waitUntil:'networkidle',timeout:65000});await page.getByPlaceholder('Your name').fill('Synthetic voice verification');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Find my flow'}).click();await page.getByRole('heading',{name:'Your pace. Your progress.'}).waitFor();
 await page.getByRole('button',{name:'Ask Chinnu',exact:true}).click();await page.locator('.agent-panel').getByRole('checkbox').check();await page.getByRole('button',{name:'Talk to Chinnu',exact:true}).click();
 await page.getByRole('heading',{name:'Small steps add up.'}).waitFor({timeout:65000});
 console.log('Actual browser AudioWorklet → NVIDIA ASR → app navigation: passed.');
 await page.getByRole('button',{name:'Disconnect',exact:true}).click();console.log('Cloud audio bytes delivered to browser:',received);console.log('Browser session used no API key or access code and no real microphone.');
}catch(error){console.error(error instanceof Error?error.message:'Browser voice test failed');process.exitCode=1;}finally{await browser?.close();closeSpeechClients();}
