import type {Food,Nutrients} from './schema';
// Original small starter catalog. Values are rounded examples, NOT a licensed
// HealthifyMe database or a clinical composition table. Users can edit labels.
const source='Chinnu starter estimate per 100 g; generic rounded example. Verify your actual product/recipe label.';
const rows:[string,string,number,number,number,number,number,string[],string[]][]=[
 ['rice','Cooked white rice',130,2.7,28,0.3,0.4,['Vegan','Grain'],[]],
 ['brown-rice','Cooked brown rice',123,2.7,25.6,1,1.6,['Vegan','Grain'],[]],
 ['oats','Dry rolled oats',379,13.2,67.7,6.5,10.1,['Vegan','Grain'],['May contain gluten']],
 ['banana','Banana',89,1.1,22.8,0.3,2.6,['Vegan','Fruit'],[]],
 ['apple','Apple with skin',52,0.3,13.8,0.2,2.4,['Vegan','Fruit'],[]],
 ['orange','Orange',47,0.9,11.8,0.1,2.4,['Vegan','Fruit'],[]],
 ['dal','Cooked lentils, plain',116,9,20.1,0.4,7.9,['Vegan','Legume'],[]],
 ['chickpea','Cooked chickpeas',164,8.9,27.4,2.6,7.6,['Vegan','Legume'],[]],
 ['rajma','Cooked kidney beans',127,8.7,22.8,0.5,6.4,['Vegan','Legume'],[]],
 ['paneer','Paneer, generic',265,18,3,20,0,['Vegetarian','Dairy'],['Milk']],
 ['tofu','Firm tofu',144,17,2.8,8.7,2.3,['Vegan','Protein'],['Soy']],
 ['egg','Boiled whole egg',155,12.6,1.1,10.6,0,['Protein'],['Egg']],
 ['chicken','Cooked chicken breast',165,31,0,3.6,0,['Protein'],[]],
 ['yogurt','Plain yogurt',61,3.5,4.7,3.3,0,['Vegetarian','Dairy'],['Milk']],
 ['milk','Whole milk',61,3.2,4.8,3.3,0,['Vegetarian','Dairy'],['Milk']],
 ['spinach','Raw spinach',23,2.9,3.6,0.4,2.2,['Vegan','Vegetable'],[]],
 ['carrot','Raw carrot',41,0.9,9.6,0.2,2.8,['Vegan','Vegetable'],[]],
 ['tomato','Tomato',18,0.9,3.9,0.2,1.2,['Vegan','Vegetable'],[]],
 ['cucumber','Cucumber',15,0.7,3.6,0.1,0.5,['Vegan','Vegetable'],[]],
 ['almond','Almonds',579,21.2,21.6,49.9,12.5,['Vegan','Nuts'],['Tree nuts']],
 ['peanut','Peanuts',567,25.8,16.1,49.2,8.5,['Vegan','Nuts'],['Peanuts']],
 ['roti','Whole-wheat roti, generic',297,9.7,46.4,7.5,6.5,['Vegan','Grain'],['Wheat']],
 ['idli','Idli, generic',146,4.5,28.8,1,1,['Vegan','Grain'],[]],
 ['dosa','Plain dosa, generic',168,4,29,4,1,['Vegan','Grain'],[]],
 ['oil','Vegetable oil',884,0,0,100,0,['Vegan','Oil'],[]],
 ['potato','Boiled potato',87,1.9,20.1,0.1,1.8,['Vegan','Vegetable'],[]]
];
export const starterFoods:Food[]=rows.map(([id,name,kcal,protein,carbs,fat,fiber,tags,allergens])=>({id,name,per100g:{kcal,protein,carbs,fat,fiber},source,tags,allergens}));
export type Recipe={id:string;name:string;minutes:number;ingredients:{foodId:string;grams:number}[];steps:string[];tags:string[]};
export const recipes:Recipe[]=[
 {id:'oat-bowl',name:'Banana oat bowl',minutes:10,ingredients:[{foodId:'oats',grams:40},{foodId:'milk',grams:150},{foodId:'banana',grams:80}],steps:['Heat oats and milk gently, adding water to your preferred consistency.','Simmer until the oats are cooked.','Top with sliced banana. Check ingredient labels for allergens.'],tags:['Vegetarian','Breakfast']},
 {id:'chickpea-salad',name:'Chickpea crunch bowl',minutes:10,ingredients:[{foodId:'chickpea',grams:120},{foodId:'cucumber',grams:100},{foodId:'tomato',grams:80}],steps:['Drain already-cooked chickpeas.','Chop washed vegetables.','Toss together and season to taste; log any dressing separately.'],tags:['Vegan','Lunch']},
 {id:'dal-rice',name:'Lentil and rice bowl',minutes:15,ingredients:[{foodId:'dal',grams:150},{foodId:'brown-rice',grams:150},{foodId:'spinach',grams:50}],steps:['Warm fully cooked lentils and rice.','Cook washed spinach until softened.','Serve together. Log added oil or accompaniments separately.'],tags:['Vegan','Dinner']},
 {id:'tofu-bowl',name:'Tofu vegetable plate',minutes:20,ingredients:[{foodId:'tofu',grams:120},{foodId:'carrot',grams:80},{foodId:'rice',grams:150},{foodId:'oil',grams:5}],steps:['Cut tofu and washed carrot into pieces.','Cook in a pan with the measured oil until heated through.','Serve with fully cooked rice.'],tags:['Vegan','Dinner']},
 {id:'yogurt-apple',name:'Apple yogurt snack',minutes:5,ingredients:[{foodId:'yogurt',grams:150},{foodId:'apple',grams:100},{foodId:'almond',grams:10}],steps:['Wash and chop the apple.','Combine with plain yogurt.','Add chopped almonds only if suitable for your allergies.'],tags:['Vegetarian','Snack']},
 {id:'egg-plate',name:'Egg and roti plate',minutes:15,ingredients:[{foodId:'egg',grams:100},{foodId:'roti',grams:60},{foodId:'tomato',grams:80}],steps:['Use fully cooked eggs.','Serve with roti and washed tomato.','Adjust portions for your preferences; this is not a prescribed diet.'],tags:['Breakfast']}
];
export function scaleNutrients(n:Nutrients,grams:number):Nutrients{return Object.fromEntries(Object.entries(n).map(([key,value])=>[key,Math.round(value*grams/100*100)/100])) as Nutrients;}
export function sumNutrients(values:Nutrients[]):Nutrients{const result:Nutrients={kcal:0,protein:0,carbs:0,fat:0,fiber:0};for(const n of values)for(const [key,value]of Object.entries(n))result[key as keyof Nutrients]=(result[key as keyof Nutrients]??0)+value;return result;}
export function localDay(date:string|Date=new Date()){const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function todayEntries<T extends {date:string}>(rows:T[],day=localDay()){return rows.filter(row=>localDay(row.date)===day);}
