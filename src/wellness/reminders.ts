import {Capacitor} from '@capacitor/core';
import {LocalNotifications} from '@capacitor/local-notifications';
import {db} from '../storage/db';
export async function syncNotifications(){
 if(Capacitor.getPlatform()!=='android')throw new Error('Scheduled background reminders are available in the Android APK. On the web, reminders are shown while the app is open.');
 const permission=await LocalNotifications.requestPermissions();if(permission.display!=='granted')throw new Error('Notifications not allowed. You can still use in-app reminders.');
 const pending=await LocalNotifications.getPending();const owned=pending.notifications.filter(n=>n.id>=700000&&n.id<800000);if(owned.length)await LocalNotifications.cancel({notifications:owned.map(n=>({id:n.id}))});
 const reminders=await db.reminders.toArray();await db.reminders.toCollection().modify({nativeScheduled:false});
 const enabled=reminders.filter(r=>r.enabled&&r.id!==undefined);
 if(enabled.length){await LocalNotifications.schedule({notifications:enabled.map(r=>{const [hour,minute]=r.time.split(':').map(Number);return{id:700000+r.id!,title:'Chinnu AI · '+r.kind,body:r.title,isExactNotification:false,schedule:{on:{hour,minute},repeats:true,allowWhileIdle:false}};})});for(const r of enabled)await db.reminders.update(r.id!,{nativeScheduled:true});}
 return enabled.length;
}
export async function cancelReminder(id:number){if(Capacitor.getPlatform()==='android')await LocalNotifications.cancel({notifications:[{id:700000+id}]});await db.reminders.delete(id);}
export async function cancelAllNotifications(){if(Capacitor.getPlatform()!=='android')return;const pending=await LocalNotifications.getPending();const owned=pending.notifications.filter(n=>n.id>=700000&&n.id<800000);if(owned.length)await LocalNotifications.cancel({notifications:owned.map(n=>({id:n.id}))});}
