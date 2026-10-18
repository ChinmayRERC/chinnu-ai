import {db} from '../storage/db';
import {foodSchema,loggedMealSchema,metricInputSchema,units,goalSchema,defaultGoals,reminderSchema,planSchema,type Food,type MetricKind,type Meal,type MealSlot} from './schema';
import {starterFoods,scaleNutrients,sumNutrients,todayEntries,localDay} from './catalog';
import {library} from '../exercises/engine';
export async function initializeWellness(){await db.transaction('rw',db.foods,db.goals,async()=>{for(const f of starterFoods)if(!await db.foods.get(f.id))await db.foods.add(f);if(!await db.goals.get('goals'))await db.goals.put(defaultGoals);});}
export async function saveFood(input:unknown){const food=foodSchema.parse(input);await db.foods.put(food);return food;}
export async function logFood(foodId:string,grams:number,meal:Meal['meal'],date=new Date().toISOString(),note=''){
 const food=await db.foods.get(foodId);if(!food)throw new Error('Food not found. Create a custom food or search the catalog.');
 const entry=loggedMealSchema.parse({foodId,name:food.name,grams,meal,date,nutrients:scaleNutrients(food.per100g,grams),source:food.source,note});const id=await db.meals.add(entry);return{...entry,id};
}
export async function updateMeal(id:number,grams:number,meal:Meal['meal']){const old=await db.meals.get(id);if(!old)throw new Error('Meal log no longer exists.');const per100g=Object.fromEntries(Object.entries(old.nutrients).map(([k,v])=>[k,v*100/old.grams])) as Food['per100g'];await db.meals.put(loggedMealSchema.parse({...old,grams,meal,nutrients:scaleNutrients(per100g,grams)}));}
export async function logMetric(input:unknown,date=new Date().toISOString()){const parsed=metricInputSchema.parse(input);if(!Number.isFinite(Date.parse(date)))throw new Error('Invalid date.');const row={...parsed,date,unit:units[parsed.kind],source:'manual' as const};const id=await db.metrics.add(row);return{...row,id};}
export async function saveGoals(input:unknown){const value=goalSchema.parse(input);await db.goals.put(value);return value;}
export async function saveReminder(input:unknown){const value=reminderSchema.parse(input);const id=await db.reminders.put({...value,nativeScheduled:false});return{...value,id};}
export async function savePlan(input:unknown){const plan=planSchema.parse(input);const profile=await db.profiles.get(1);const conservative=!!profile&&(profile.mobility==='Limited'||profile.restrictions.length>0);
 if(plan.kind==='Meals'&&plan.meals.length===0)throw new Error('Choose at least one meal.');
 if(plan.kind!=='Meals'&&plan.items.length===0)throw new Error('Choose at least one exercise.');
 for(const item of plan.items){const ex=library.find(e=>e.id===item.exerciseId);if(!ex)throw new Error('Unknown exercise.');if(conservative&&ex.restricted)throw new Error(`${ex.name} is unavailable in conservative mode.`);}
 for(const meal of plan.meals)if(!await db.foods.get(meal.foodId))throw new Error('A planned food no longer exists.');const id=await db.plans.put(plan);return{...plan,id};
}
export async function logMealPlan(slots:MealSlot[]){return db.transaction('rw',db.foods,db.meals,async()=>{for(const slot of slots)await logFood(slot.foodId,slot.grams,slot.meal);});}
export async function dailySummary(day=localDay()){
 const [meals,metrics,goals]=await Promise.all([db.meals.toArray(),db.metrics.toArray(),db.goals.get('goals')]);const dailyMeals=todayEntries(meals,day),dailyMetrics=todayEntries(metrics,day);const total=(kind:MetricKind)=>dailyMetrics.filter(m=>m.kind===kind).reduce((a,m)=>a+m.value,0);
 const latestWeight=metrics.filter(m=>m.kind==='weight').sort((a,b)=>b.date.localeCompare(a.date))[0];return{day,food:sumNutrients(dailyMeals.map(m=>m.nutrients)),meals:dailyMeals.length,water:total('water'),steps:total('steps'),sleep:total('sleep'),activity:total('activity'),latestWeight:latestWeight?.value??null,goals:goals??defaultGoals};
}
export async function startFast(){const profile=await db.profiles.get(1);if(!profile||profile.restrictions.length>0||profile.mobility==='Limited')throw new Error('Fasting timers are unavailable with flagged screening. Ask your clinician about appropriate eating routines.');if(await db.fasts.filter(f=>!f.end).count())throw new Error('An eating-break timer is already running.');return db.fasts.add({start:new Date().toISOString(),note:'User-started observational timer; no prescribed fasting target.'});}
export async function stopFast(){const active=await db.fasts.filter(f=>!f.end).first();if(!active?.id)throw new Error('No eating-break timer is running.');await db.fasts.update(active.id,{end:new Date().toISOString()});}
