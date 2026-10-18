// Operator-only: node --env-file=.env scripts/configure-nvidia-render.mjs
// PATCH individual keys; never replace unrelated variables or print values.
const service='srv-dbacm1vbtjjs73eldevg';
const key=process.env.NVIDIA_API_KEY??process.env.NVIDIA_TTS_KEY;
if(!key||!process.env.RENDER_API_KEY)throw new Error('Operator credentials missing from private environment.');
const variables={NVIDIA_API_KEY:key,PUBLIC_APP_SESSIONS:'true',TEXT_PROVIDER:'nvidia',AI_DAILY_REQUEST_LIMIT:'300',NVIDIA_TEXT_MODEL:'nvidia/nemotron-3.5-lightning-30b-a3b',NVIDIA_VISION_MODEL:'nvidia/nemotron-3.5-super-vl-120b-a12b',NVIDIA_LANGUAGE:'en-US',NVIDIA_VOICE:'Magpie-Multilingual.EN-US.Aria.Calm',NVIDIA_TTS_FUNCTION_ID:'877104f7-e885-42b9-8de8-f6e4c6303969',NVIDIA_ASR_FUNCTION_ID:'d3fe9151-442b-4204-a70d-5fcc597fd610'};
for(const [name,value]of Object.entries(variables)){
 const response=await fetch(`https://api.render.com/v1/services/${service}/env-vars/${name}`,{method:'PUT',headers:{Authorization:`Bearer ${process.env.RENDER_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({value}),signal:AbortSignal.timeout(15000)});
 if(!response.ok){await response.body?.cancel();throw new Error(`Could not update ${name} (HTTP ${response.status}).`);}await response.body?.cancel();console.log('Configured',name);
}
console.log('Server settings saved. A deployment is needed to activate them.');
