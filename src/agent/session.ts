import {getBackendURL} from './config';
let cached:{base:string;token:string;expires:number}|undefined;let pending:Promise<string>|undefined;
export async function appSession(base=getBackendURL()){
 if(!base)throw new Error('The app backend is not available. Local features still work.');
 if(cached&&cached.base===base&&cached.expires>Date.now())return cached.token;
 if(pending)return pending;
 const request=(async()=>{
  let clientId=localStorage.getItem('chinnu-client-id');if(!clientId){clientId=crypto.randomUUID();localStorage.setItem('chinnu-client-id',clientId);}
  let response:Response;try{response=await fetch(`${base}/sessions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId}),signal:AbortSignal.timeout(65000)});}catch{throw new Error('The cloud service could not be reached. Check internet; a sleeping Render service may take about a minute to start.');}
  const data=await response.json();if(!response.ok)throw new Error(data.error??'App session unavailable.');if(typeof data.token!=='string')throw new Error('The app server returned an invalid session.');cached={base,token:data.token,expires:Date.now()+Math.min(Number(data.expiresIn??900)*1000,12*60000)};return data.token as string;
 })();pending=request;try{return await request;}finally{if(pending===request)pending=undefined;}
}
