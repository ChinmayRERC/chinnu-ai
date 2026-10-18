import {z} from 'zod';
const messageSchema=z.object({content:z.string().nullable().optional(),tool_calls:z.array(z.object({id:z.string().optional(),type:z.string().optional(),function:z.object({name:z.string(),arguments:z.string()})})).optional()}).passthrough();
export type ModelMessage=z.infer<typeof messageSchema>;
export class ModelUnavailableError extends Error {constructor(){super('The decision models are busy. Please use the app controls or try again shortly.');this.name='ModelUnavailableError';}}
export function providerErrorText(text:string){return /^\s*(?:None|null|undefined)\s*$/i.test(text)||/\[ERROR:|processsingleitemagent|API request returned None|Agent failed\s*\(|API failed\s*\(|Function .{0,100}timed out after/i.test(text);}
export function parseModelPayload(payload:unknown):ModelMessage{
 const parsed=z.object({error:z.unknown().optional(),choices:z.array(z.object({message:messageSchema})).min(1)}).safeParse(payload);
 if(!parsed.success||parsed.data.error)throw new Error('Provider returned an invalid completion.');
 const message=parsed.data.choices[0].message;
 if(message.content&&providerErrorText(message.content))throw new Error('Provider returned an error instead of a completion.');
 if(!message.tool_calls?.length&&!message.content?.trim())throw new Error('Provider returned an empty completion.');return message;
}
type RequestOptions={tools?:unknown[];signal?:AbortSignal;maxTokens?:number;json?:boolean;validate?:(message:ModelMessage)=>void;onFallback?:()=>void};
type Config={key:string;primary:string;fallback:string;primaryMs?:number;fallbackMs?:number;fetch?:typeof fetch;report?:(result:{model:string;ok:boolean;elapsedMs:number})=>void};
/** At most two distinct models, never retry the same model or an aborted user job. */
export class DecisionModelClient {
 private fetcher:typeof fetch;
 constructor(private config:Config){this.fetcher=config.fetch??fetch;}
 async request(messages:unknown[],options:RequestOptions={}):Promise<ModelMessage>{
  if(!this.config.key)throw new ModelUnavailableError();
  const total=AbortSignal.timeout(19000);const candidates=[...new Set([this.config.primary,this.config.fallback].filter(Boolean))].slice(0,2);
  for(let i=0;i<candidates.length;i++){
   if(options.signal?.aborted)throw new DOMException('Cancelled','AbortError');if(total.aborted)break;
   if(i===1)options.onFallback?.();const model=candidates[i],started=Date.now();
   const requested=i===0?this.config.primaryMs??8000:this.config.fallbackMs??10000;const ms=Math.max(100,Math.min(12000,requested));
   const signals=[total,AbortSignal.timeout(ms),...(options.signal?[options.signal]:[])];
   try{
    const response=await this.fetcher('https://integrate.api.nvidia.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${this.config.key}`,'Content-Type':'application/json'},signal:AbortSignal.any(signals),body:JSON.stringify({model,messages,temperature:.1,stream:false,max_tokens:Math.min(options.maxTokens??512,1000),...(model.startsWith('nvidia/nemotron')?{chat_template_kwargs:{enable_thinking:false}}:{}),...(model.startsWith('openai/gpt-oss')?{reasoning_effort:'low'}:{}),...(options.tools?{tools:options.tools,tool_choice:'auto',parallel_tool_calls:false}:{}),...(options.json?{response_format:{type:'json_object'}}:{})})});
    if(!response.ok){await response.body?.cancel();throw new Error(`Provider HTTP ${response.status}`);}
    const message=parseModelPayload(await response.json());options.validate?.(message);
    this.config.report?.({model,ok:true,elapsedMs:Date.now()-started});return message;
   }catch{
    this.config.report?.({model,ok:false,elapsedMs:Date.now()-started});if(options.signal?.aborted)throw new DOMException('Cancelled','AbortError');
   }
  }
  throw new ModelUnavailableError();
 }
}
