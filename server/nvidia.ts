import * as grpc from '@grpc/grpc-js';
import {loadSync} from '@grpc/proto-loader';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('./protos/',import.meta.url));
const definitions=loadSync([join(root,'riva/proto/riva_tts.proto'),join(root,'riva/proto/riva_asr.proto')],{includeDirs:[root],keepCase:true,longs:Number,enums:String,defaults:true,oneofs:true});
const packages=grpc.loadPackageDefinition(definitions) as unknown as {nvidia:{riva:{tts:{RivaSpeechSynthesis:grpc.ServiceClientConstructor};asr:{RivaSpeechRecognition:grpc.ServiceClientConstructor}}}};
export const nvidiaConfig={
 host:process.env.NVIDIA_SPEECH_HOST??'grpc.nvcf.nvidia.com:443',
 ttsFunction:process.env.NVIDIA_TTS_FUNCTION_ID??'877104f7-e885-42b9-8de8-f6e4c6303969',
 asrFunction:process.env.NVIDIA_ASR_FUNCTION_ID??'d3fe9151-442b-4204-a70d-5fcc597fd610',
 language:process.env.NVIDIA_LANGUAGE??'en-US',
 voice:process.env.NVIDIA_VOICE??'Magpie-Multilingual.HI-IN.Aria',
 textModel:process.env.NVIDIA_TEXT_MODEL??'nvidia/nemotron-3.5-super-vl-120b-a12b'
};
type Config={model_config:{model_name:string;parameters:Record<string,string>}[]};
type Synthesis={audio:Buffer};
type Recognition={results:{alternatives:{transcript:string}[]}[]};
type Unary<T>=(input:object,meta:grpc.Metadata,options:grpc.CallOptions,callback:(error:grpc.ServiceError|null,result:T)=>void)=>grpc.ClientUnaryCall;
interface TTSClient extends grpc.Client {getRivaSynthesisConfig:Unary<Config>;synthesize:Unary<Synthesis>;synthesizeOnline:(meta:grpc.Metadata,options:grpc.CallOptions)=>grpc.ClientDuplexStream<object,Synthesis>;}
interface ASRClient extends grpc.Client {getRivaSpeechRecognitionConfig:Unary<Config>;recognize:Unary<Recognition>;}
const tts=new packages.nvidia.riva.tts.RivaSpeechSynthesis(nvidiaConfig.host,grpc.credentials.createSsl(),{'grpc.max_receive_message_length':8*1024*1024}) as unknown as TTSClient;
const asr=new packages.nvidia.riva.asr.RivaSpeechRecognition(nvidiaConfig.host,grpc.credentials.createSsl()) as unknown as ASRClient;
function metadata(kind:'tts'|'asr'){
 const key=process.env.NVIDIA_API_KEY??(kind==='tts'?process.env.NVIDIA_TTS_KEY:process.env.NVIDIA_ASR_KEY);
 if(!key)throw new Error(`NVIDIA ${kind.toUpperCase()} is not configured on the server.`);
 const meta=new grpc.Metadata();meta.set('authorization',`Bearer ${key}`);meta.set('function-id',kind==='tts'?nvidiaConfig.ttsFunction:nvidiaConfig.asrFunction);return meta;
}
export function nvidiaReady(){return !!(process.env.NVIDIA_TTS_KEY??process.env.NVIDIA_API_KEY)&&!!(process.env.NVIDIA_ASR_KEY??process.env.NVIDIA_API_KEY);}
function unary<T>(client:grpc.Client,method:Unary<T>,input:object,meta:grpc.Metadata,signal?:AbortSignal):Promise<T>{return new Promise((resolve,reject)=>{if(signal?.aborted){reject(new Error('Cancelled'));return;}const abort=()=>call.cancel();const call=method.call(client,input,meta,{deadline:Date.now()+25000},(error,result)=>{signal?.removeEventListener('abort',abort);if(error)reject(error);else resolve(result);});signal?.addEventListener('abort',abort,{once:true});});}
export async function listSpeechConfig(){return{tts:await unary(tts,tts.getRivaSynthesisConfig,{},metadata('tts')),asr:await unary(asr,asr.getRivaSpeechRecognitionConfig,{},metadata('asr'))};}
export async function synthesize(text:string,signal?:AbortSignal){const response=await unary(tts,tts.synthesize,{text:text.slice(0,700),language_code:nvidiaConfig.language,encoding:'LINEAR_PCM',sample_rate_hz:22050,...(nvidiaConfig.voice?{voice_name:nvidiaConfig.voice}:{})},metadata('tts'),signal);if(!response.audio?.length)throw new Error('NVIDIA speech returned empty audio.');return{pcm:response.audio,rate:22050};}
export function synthesizeStream(text:string,onAudio:(pcm:Buffer)=>void,signal?:AbortSignal){return new Promise<void>((resolve,reject)=>{if(signal?.aborted){reject(new Error('Cancelled'));return;}const call=tts.synthesizeOnline(metadata('tts'),{deadline:Date.now()+25000});let received=false,settled=false;const finish=(error?:Error)=>{if(settled)return;settled=true;signal?.removeEventListener('abort',abort);error?reject(error):received?resolve():reject(new Error('NVIDIA speech returned empty audio.'));};const abort=()=>{call.cancel();finish(new Error('Cancelled'));};signal?.addEventListener('abort',abort,{once:true});call.on('data',(result:Synthesis)=>{if(result.audio?.length){received=true;onAudio(result.audio);}});call.on('error',(error:Error)=>{if(signal?.aborted)finish(new Error('Cancelled'));else finish(error);});call.on('end',()=>finish());call.write({text:text.slice(0,700),language_code:nvidiaConfig.language,encoding:'LINEAR_PCM',sample_rate_hz:22050,...(nvidiaConfig.voice?{voice_name:nvidiaConfig.voice}:{})});call.end();});}
export async function transcribe(pcm:Buffer,signal?:AbortSignal){if(pcm.length<3200||pcm.length>384000||pcm.length%2)throw new Error('Expected 0.1–12 seconds of mono PCM16 at 16 kHz.');const response=await unary(asr,asr.recognize,{config:{encoding:'LINEAR_PCM',sample_rate_hertz:16000,language_code:nvidiaConfig.language,max_alternatives:1,enable_automatic_punctuation:true,audio_channel_count:1},audio:pcm},metadata('asr'),signal);return response.results.map(r=>r.alternatives[0]?.transcript??'').join(' ').trim().slice(0,1500);}
export function closeSpeechClients(){tts.close();asr.close();}
