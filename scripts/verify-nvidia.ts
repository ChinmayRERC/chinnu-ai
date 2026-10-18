import {listSpeechConfig,synthesize,transcribe,closeSpeechClients} from '../server/nvidia';
try{
 const config=await listSpeechConfig();
 for(const [kind,value]of Object.entries(config))console.log(kind,JSON.stringify(value.model_config.map(c=>({model:c.model_name,language:c.parameters.language_code,voice:c.parameters.voice_name,subvoices:c.parameters.subvoices,type:c.parameters.type}))).slice(0,6500));
 const audio=await synthesize('Open my progress.');console.log('Magpie audio bytes',audio.pcm.length,'sample rate',audio.rate);
 // Deterministic downsampling of generated test speech, never microphone audio.
 const input=audio.pcm;const length=Math.floor(input.length/2*16000/audio.rate);const output=Buffer.alloc(length*2);for(let i=0;i<length;i++)output.writeInt16LE(input.readInt16LE(Math.floor(i*audio.rate/16000)*2),i*2);
 console.log('Parakeet synthetic speech transcript:',await transcribe(output));
}catch(error){let message=String(error instanceof Error?error.message:error);for(const key of ['NVIDIA_TTS_KEY','NVIDIA_ASR_KEY','NVIDIA_API_KEY'])if(process.env[key])message=message.replaceAll(process.env[key]!, '[REDACTED]');console.error(message);process.exitCode=1;}finally{closeSpeechClients();}
