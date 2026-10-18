import type {AgentAction,ActionResult} from '../agent/actions';
import {initializeWellness,logMetric,logFood,dailySummary,saveReminder,startFast,stopFast} from './service';
import {db} from '../storage/db';
export async function wellnessAction(action:AgentAction):Promise<ActionResult|null>{
 if(!['log_water','log_metric','search_foods','log_food','get_daily_summary','create_reminder','start_fast','stop_fast'].includes(action.action))return null;
 await initializeWellness();
 if(action.action==='log_water'){if(!action.amount)return{ok:false,message:'How many milliliters of water should I record?'};await logMetric({kind:'water',value:action.amount});return{ok:true,message:`Recorded ${action.amount} ml of water locally.`};}
 if(action.action==='log_metric'){if(!action.metric)return{ok:false,message:'Which measurement and value? Use kg for weight, hours for sleep, additional steps, cm for waist, minutes for activity or mg/dL for a glucose note.'};const row=await logMetric(action.metric);return{ok:true,message:`Recorded ${row.kind}: ${row.value} ${row.unit}. This is a manual log, not a connected sensor reading.`};}
 if(action.action==='search_foods'){if(!action.query)return{ok:false,message:'Which food should I search?'};const foods=(await db.foods.toArray()).filter(f=>f.name.toLowerCase().includes(action.query!.toLowerCase())).slice(0,8);return{ok:true,message:foods.length?`Found ${foods.length} foods. Ask for a portion in grams and a meal before logging.`:'No local food matched. Open Nutrition to create a custom label.',data:foods.map(f=>({id:f.id,name:f.name,per100g:f.per100g,source:f.source,allergens:f.allergens}))};}
 if(action.action==='log_food'){if(!action.foodId||!action.grams||!action.meal)return{ok:false,message:'I need an exact catalog food ID, portion in grams and Breakfast, Lunch, Dinner or Snack. Search the food catalog first.'};const row=await logFood(action.foodId,action.grams,action.meal);return{ok:true,message:`Logged ${row.grams} g of ${row.name} to ${row.meal.toLowerCase()}: approximately ${Math.round(row.nutrients.kcal)} kcal.`,data:{source:row.source}};}
 if(action.action==='get_daily_summary')return{ok:true,message:'Here are today’s recorded totals. Unlogged intake, steps and sleep are unknown, not assumed complete.',data:await dailySummary()};
 if(action.action==='create_reminder'){if(!action.reminder)return{ok:false,message:'What reminder message, type and daily 24-hour time should I use?'};await saveReminder({...action.reminder,enabled:true});return{ok:true,message:`Created ${action.reminder.time} in-app reminder: ${action.reminder.title}. Open Health → Reminders and tap Enable / refresh notifications for Android background delivery.`,requiresUserAction:true};}
 if(action.action==='start_fast'){await startFast();return{ok:true,message:'Started a neutral time-since-meal timer, without a fasting target. Eat when needed and stop if unwell.'};}
 await stopFast();return{ok:true,message:'Stopped the eating-break timer.'};
}
