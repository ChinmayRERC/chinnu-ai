import Dexie,{type Table} from 'dexie';
import type {Flag} from '../exercises/engine';
export type Profile={id:1;name:string;goal:string;experience:string;height:string;restrictions:string[];mobility:string;consent:boolean};
export type Rep={number:number;score:number|null;time:number};
export type Session={id?:number;exercise:string;name:string;date:string;duration:number;reps:Rep[];hold:number;score:number|null;coverage:number;flags:Flag[];demo?:boolean;stopped?:boolean};
export type Entry={id?:number;date:string;energy:number;soreness:number;sleep:number;mood:string;note:string};
class Store extends Dexie {profiles!:Table<Profile,number>;sessions!:Table<Session,number>;journal!:Table<Entry,number>;constructor(){super('chinnu-ai');this.version(1).stores({profiles:'id',sessions:'++id,date,exercise',journal:'++id,date'});}}
export const db=new Store();
export async function seedDemo(){if(await db.sessions.filter(s=>!!s.demo).count())return;await db.sessions.bulkAdd(Array.from({length:7},(_,i)=>({exercise:'squat',name:'Squat',date:new Date(Date.now()-(6-i)*86400000).toISOString(),duration:80,reps:Array.from({length:8},(_,j)=>({number:j+1,score:70+i*3,time:j*5})),hold:0,score:70+i*3,coverage:.92,flags:[],demo:true})));}
