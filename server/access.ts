import {randomBytes,timingSafeEqual} from 'node:crypto';
export type AppSession={expires:number;voice:boolean;requests:number;clientId:string};
export class AccessStore {
 sessions=new Map<string,AppSession>();private attempts=new Map<string,{count:number;expires:number}>();private day='';private daily=0;
 constructor(private now:()=>number=Date.now){}
 allow(ip:string){const now=this.now();let a=this.attempts.get(ip);if(!a||a.expires<now){a={count:0,expires:now+60000};this.attempts.set(ip,a);}return ++a.count<=12;}
 create(clientId:string){this.prune();if(this.sessions.size>=100)return null;const token=randomBytes(32).toString('hex');this.sessions.set(token,{expires:this.now()+15*60000,voice:false,requests:0,clientId});return token;}
 get(token:string){const session=this.sessions.get(token);return session&&session.expires>this.now()?session:null;}
 authorize(header?:string){const token=header?.replace(/^Bearer /,'');const session=token?this.get(token):null;if(!session||++session.requests>60)return null;return session;}
 consume(limit=Number(process.env.AI_DAILY_REQUEST_LIMIT??300)){const day=new Date(this.now()).toISOString().slice(0,10);if(this.day!==day){this.day=day;this.daily=0;}if(!Number.isFinite(limit)||limit<1||this.daily>=limit)return false;this.daily++;return true;}
 voiceCount(){return [...this.sessions.values()].filter(s=>s.voice&&s.expires>this.now()).length;}
 prune(){const now=this.now();for(const[k,v]of this.sessions)if(v.expires<now)this.sessions.delete(k);for(const[k,v]of this.attempts)if(v.expires<now)this.attempts.delete(k);}
}
export function validAccessCode(supplied:string,expected:string){const a=Buffer.from(supplied),b=Buffer.from(expected);return b.length>0&&a.length===b.length&&timingSafeEqual(a,b);}
