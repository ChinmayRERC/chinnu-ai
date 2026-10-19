/** Coarse turn endpointing, not breathing/emotion detection or neural VAD. */
export class UtteranceBuffer {
 private chunks:Buffer[]=[];private preRoll:Buffer[]=[];private bytes=0;private voiced=0;private silent=0;private started=false;private noise=.004;
 reset(){this.chunks=[];this.preRoll=[];this.bytes=0;this.voiced=0;this.silent=0;this.started=false;}
 push(pcm:Buffer):Buffer|null{
  if(pcm.length%2||pcm.length>16000)throw new Error('Invalid PCM chunk.');
  let square=0;for(let i=0;i<pcm.length;i+=2)square+=(pcm.readInt16LE(i)/32768)**2;const rms=Math.sqrt(square/Math.max(1,pcm.length/2));
  const startLevel=Math.max(.009,this.noise*3),continueLevel=Math.max(.006,this.noise*1.7);
  if(!this.started){if(rms<startLevel)this.noise=this.noise*.96+rms*.04;this.preRoll.push(pcm);while(this.preRoll.reduce((n,c)=>n+c.length,0)>16000)this.preRoll.shift();if(rms<startLevel)return null;this.started=true;this.chunks.push(...this.preRoll);this.bytes=this.preRoll.reduce((n,c)=>n+c.length,0);this.preRoll=[];}
  if(rms>=continueLevel){this.voiced+=pcm.length;this.silent=0;}else this.silent+=pcm.length;
  if(this.chunks[this.chunks.length-1]!==pcm){this.chunks.push(pcm);this.bytes+=pcm.length;}
  if(this.bytes>=384000||this.silent>=25600){const result=this.voiced>=6400?Buffer.concat(this.chunks,Math.min(this.bytes,384000)):null;this.reset();return result;}
  return null;
 }
}
export function resamplePCM(pcm:Buffer,inputRate:number,outputRate=16000){const samples=Math.floor(pcm.length/2);const length=Math.floor(samples*outputRate/inputRate);const out=Buffer.alloc(length*2);for(let i=0;i<length;i++)out.writeInt16LE(pcm.readInt16LE(Math.min(samples-1,Math.floor(i*inputRate/outputRate))*2),i*2);return out;}
