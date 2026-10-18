// Run with node --env-file=.env scripts/render-deploy.mjs [status|create|deploy]
// Never prints credentials or Render environment-variable responses.
const base='https://api.render.com/v1';
const headers={Authorization:`Bearer ${process.env.RENDER_API_KEY}`,'Content-Type':'application/json'};
async function api(path,method='GET',body){const r=await fetch(`${base}/${path}`,{method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});const data=await r.json();if(!r.ok)throw new Error(`Render ${r.status}: ${JSON.stringify(data).slice(0,1600)}`);return data;}
if(!process.env.RENDER_API_KEY)throw new Error('Set RENDER_API_KEY privately in .env');
const mode=process.argv[2]??'status';
const owners=await api('owners?limit=20');const owner=owners.find(x=>x.owner.name==='chinnuai')?.owner??owners[0]?.owner;if(!owner)throw new Error('No accessible workspace');
const services=await api(`services?ownerId=${owner.id}&limit=100`);let service=services.find(x=>x.service.name==='chinnu-ai')?.service;
if(mode==='create'){
 if(service)console.log(JSON.stringify({existing:true,id:service.id,url:service.serviceDetails?.url}));
 else{
  if(!process.env.GEMINI_API_KEY||!process.env.APP_ACCESS_CODE)throw new Error('Gemini and application access code must be configured privately');
  const result=await api('services','POST',{type:'web_service',name:'chinnu-ai',ownerId:owner.id,repo:'https://github.com/ChinmayRERC/chinnu-ai',branch:'main',autoDeployTrigger:'off',envVars:[{key:'NODE_VERSION',value:'24.18.0'},{key:'GEMINI_API_KEY',value:process.env.GEMINI_API_KEY},{key:'APP_ACCESS_CODE',value:process.env.APP_ACCESS_CODE},{key:'GEMINI_LIVE_MODEL',value:process.env.GEMINI_LIVE_MODEL??'gemini-2.5-flash-native-audio-preview-12-2025'},{key:'GEMINI_TEXT_MODEL',value:process.env.GEMINI_TEXT_MODEL??'gemini-2.5-flash'}],serviceDetails:{runtime:'node',plan:'starter',region:'singapore',numInstances:1,healthCheckPath:'/health',envSpecificDetails:{buildCommand:'npm ci --include=dev && npm run build',startCommand:'npm run server'}}});
  console.log(JSON.stringify({id:result.service?.id,url:result.service?.serviceDetails?.url,deployId:result.deployId}));
 }
}else if(mode==='deploy'){
 if(!service)throw new Error('Service missing');const result=await api(`services/${service.id}/deploys`,'POST',{});console.log(JSON.stringify({id:service.id,deployId:result.id,status:result.status,url:service.serviceDetails?.url}));
}else if(mode==='status'){
 if(!service){console.log('No Chinnu service yet');process.exit(0);}const deploys=await api(`services/${service.id}/deploys?limit=3`);console.log(JSON.stringify({id:service.id,url:service.serviceDetails?.url,suspended:service.suspended,deploys:deploys.map(x=>({id:x.deploy?.id,status:x.deploy?.status,finishedAt:x.deploy?.finishedAt}))},null,2));
}else throw new Error('Unknown mode');
