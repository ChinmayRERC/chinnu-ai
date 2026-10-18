import {FilesetResolver,PoseLandmarker} from '@mediapipe/tasks-vision';
import type {Point} from '../exercises/engine';
export interface PoseEstimator {estimate(frame:HTMLVideoElement,timestampMs:number):Point[];close():void;}
export async function createEstimator():Promise<PoseEstimator>{
 const vision=await FilesetResolver.forVisionTasks('/models/wasm');
 const create=(delegate:'GPU'|'CPU')=>PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'/models/pose_landmarker_lite.task',delegate},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.6,minPosePresenceConfidence:.6,minTrackingConfidence:.6,outputSegmentationMasks:false});
 let model:PoseLandmarker;try{model=await create('GPU');}catch{model=await create('CPU');}
 return{estimate:(frame,time)=>model.detectForVideo(frame,time).landmarks[0]??[],close:()=>model.close()};
}
const edges=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,29],[29,31],[28,30],[30,32]];
export function drawSkeleton(ctx:CanvasRenderingContext2D,points:Point[],width:number,height:number){ctx.strokeStyle='#c4f5ae';ctx.lineWidth=4;for(const[a,b]of edges){if((points[a]?.visibility??0)<.65||(points[b]?.visibility??0)<.65)continue;ctx.beginPath();ctx.moveTo(points[a].x*width,points[a].y*height);ctx.lineTo(points[b].x*width,points[b].y*height);ctx.stroke();}ctx.fillStyle='#e7f6f2';for(const p of points){if((p.visibility??0)<.65)continue;ctx.beginPath();ctx.arc(p.x*width,p.y*height,4,0,Math.PI*2);ctx.fill();}}
