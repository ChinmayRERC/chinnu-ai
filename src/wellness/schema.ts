import {z} from 'zod';
export const nutrientsSchema=z.object({kcal:z.number().min(0).max(1500),protein:z.number().min(0).max(100),carbs:z.number().min(0).max(100),fat:z.number().min(0).max(100),fiber:z.number().min(0).max(100),sodium:z.number().min(0).max(100000).optional(),calcium:z.number().min(0).max(100000).optional(),iron:z.number().min(0).max(10000).optional()});
export type Nutrients=z.infer<typeof nutrientsSchema>;
export const foodSchema=z.object({id:z.string().min(1).max(100),name:z.string().trim().min(1).max(100),per100g:nutrientsSchema,source:z.string().min(1).max(400),tags:z.array(z.string().max(30)).max(10),allergens:z.array(z.string().max(30)).max(15),favorite:z.boolean().optional(),barcode:z.string().regex(/^\d{8,14}$/).optional()});
export type Food=z.infer<typeof foodSchema>;
export const mealTypes=['Breakfast','Lunch','Dinner','Snack'] as const;
export const mealSchema=z.object({id:z.number().int().positive().optional(),date:z.string().datetime(),foodId:z.string().max(100),name:z.string().max(100),grams:z.number().positive().max(3000),meal:z.enum(mealTypes),nutrients:nutrientsSchema,source:z.string().max(400),note:z.string().max(500).default('')});
// A serving may exceed the per-100g bounds; validate aggregates separately.
export const loggedMealSchema=mealSchema.extend({nutrients:z.object({kcal:z.number().min(0).max(45000),protein:z.number().min(0).max(3000),carbs:z.number().min(0).max(3000),fat:z.number().min(0).max(3000),fiber:z.number().min(0).max(3000),sodium:z.number().min(0).max(3000000).optional(),calcium:z.number().min(0).max(3000000).optional(),iron:z.number().min(0).max(300000).optional()})});
export type Meal=z.infer<typeof loggedMealSchema>;
export const metricNames=['water','weight','sleep','steps','waist','activity','glucose'] as const;
export const units={water:'ml',weight:'kg',sleep:'hours',steps:'steps',waist:'cm',activity:'minutes',glucose:'mg/dL'} as const;
export const metricLimits:Record<typeof metricNames[number],[number,number]>={water:[1,5000],weight:[1,500],sleep:[0,24],steps:[0,100000],waist:[10,300],activity:[1,1440],glucose:[1,1000]};
export const metricInputSchema=z.object({kind:z.enum(metricNames),value:z.number().finite(),note:z.string().trim().max(500).default('')}).superRefine((x,ctx)=>{const [min,max]=metricLimits[x.kind];if(x.value<min||x.value>max)ctx.addIssue({code:z.ZodIssueCode.custom,path:['value'],message:`Enter ${min}–${max} ${units[x.kind]}.`});if(x.kind==='steps'&&!Number.isInteger(x.value))ctx.addIssue({code:z.ZodIssueCode.custom,path:['value'],message:'Steps must be a whole number.'});});
export type MetricKind=typeof metricNames[number];
export type Metric={id?:number;date:string;kind:MetricKind;value:number;unit:string;note:string;source:'manual'};
export const goalSchema=z.object({id:z.literal('goals'),water:z.number().min(0).max(5000),steps:z.number().min(0).max(30000),sleep:z.number().min(0).max(12),kcal:z.number().min(0).max(6000),protein:z.number().min(0).max(300),weight:z.number().min(0).max(500),diet:z.enum(['Any','Vegetarian','Vegan']),avoid:z.string().max(200)});
export type Goals=z.infer<typeof goalSchema>;
// Zero means no target. No automatic calorie deficit or hydration prescription.
export const defaultGoals:Goals={id:'goals',water:0,steps:0,sleep:0,kcal:0,protein:0,weight:0,diet:'Any',avoid:''};
export const reminderSchema=z.object({id:z.number().int().positive().optional(),title:z.string().trim().min(1).max(100),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),enabled:z.boolean(),kind:z.enum(['Water','Meal','Movement','Sleep','Check-in']),lastShown:z.string().optional(),nativeScheduled:z.boolean().optional()});
export type Reminder=z.infer<typeof reminderSchema>;
export type MealSlot={meal:typeof mealTypes[number];foodId:string;grams:number};
export const planSchema=z.object({id:z.number().int().positive().optional(),name:z.string().trim().min(1).max(100),kind:z.enum(['Meals','Workout','Yoga']),paused:z.boolean(),created:z.string().datetime(),notes:z.string().max(1000),items:z.array(z.object({exerciseId:z.string().max(30),sets:z.number().int().min(1).max(10),reps:z.number().int().min(1).max(50),seconds:z.number().int().min(5).max(300)})).max(15),meals:z.array(z.object({meal:z.enum(mealTypes),foodId:z.string().max(100),grams:z.number().positive().max(1000)})).max(20),completedDays:z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(1000).default([])});
export type Plan=z.infer<typeof planSchema>;
export type Fast={id?:number;start:string;end?:string;note:string};
