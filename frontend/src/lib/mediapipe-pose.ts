// @ts-ignore
import '../../node_modules/@mediapipe/pose/pose.js';

const g = typeof window !== 'undefined' ? window : globalThis;

export const Pose = (g as any).Pose;
export const POSE_CONNECTIONS = (g as any).POSE_CONNECTIONS;
export const POSE_LANDMARKS = (g as any).POSE_LANDMARKS;
export const POSE_LANDMARKS_LEFT = (g as any).POSE_LANDMARKS_LEFT;
export const POSE_LANDMARKS_RIGHT = (g as any).POSE_LANDMARKS_RIGHT;
export const POSE_LANDMARKS_NEUTRAL = (g as any).POSE_LANDMARKS_NEUTRAL;
export const VERSION = (g as any).VERSION;
