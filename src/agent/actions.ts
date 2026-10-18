import {z} from 'zod';
export const agentActions=['navigate','open_exercise','show_guide','control_session','set_coaching','start_breathing','stop_breathing','log_checkin','get_progress','get_plan','show_latest_report','export_timeline','open_video_picker','open_camera','delete_data'] as const;
export const actionSchema=z.object({
 action:z.enum(agentActions),
 page:z.enum(['Today','Train','Progress','Journal','Settings']).optional(),
 exerciseId:z.enum(['squat','pushup','lunge','plank','curl','hinge','mountain','warrior','tree','chair','triangle','dog','cobra','child','breathing']).optional(),
 command:z.enum(['pause','resume','stop','pain']).optional(),
 enabled:z.boolean().optional(),
 checkin:z.object({energy:z.number().int().min(1).max(5),soreness:z.number().int().min(1).max(5),sleep:z.number().min(0).max(24),mood:z.enum(['Great','Okay','Low','Stressed']),note:z.string().max(2000).default('')}).optional()
}).strict();
export type AgentAction=z.infer<typeof actionSchema>;
export type ActionResult={ok:boolean;message:string;data?:unknown;requiresUserAction?:boolean};
export type ExecuteAction=(action:AgentAction)=>Promise<ActionResult>;
export const commandExamples=[
 'Show me how to do a squat', 'Open my progress', 'Start Mountain pose',
 'Pause my session', 'Resume', 'Stop, that hurts', 'Turn spoken coaching off',
 'Start a breathing timer', 'What should I do today?', 'Show my last report',
 'Open video analysis', 'Export my timeline',
 'Log a check-in: energy 3, soreness 2, sleep 7 hours, mood okay'
];
