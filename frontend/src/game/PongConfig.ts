import { Vector3 } from "@babylonjs/core";

export interface PongConfig {
  canvas: {
    width: number;
    height: number;
    border: string;
    borderRadius: string;
  };
  table: {
    width: number;
    depth: number;
    height: number;
    y: number;
    color?: { r: number; g: number; b: number };
  };
  paddle: {
    width: number;
    height: number;
    depth: number;
    rotation: number;
    positions: { left: Vector3; right: Vector3 };
    colors?: { left?: { r: number; g: number; b: number }; right?: { r: number; g: number; b: number } };
  };
  ball: {
    diameter: number;
    initialPosition: Vector3;
    color?: { r: number; g: number; b: number };
  };
  wall: {
    height: number;
    thickness: number;
    wallPositions: {
      left: { width : number, height : number, depth : number, position : Vector3 };
      right: { width : number, height : number, depth : number, position : Vector3 };
      front: { width : number, height : number, depth : number, position : Vector3 };
      back: { width : number, height : number, depth : number, position : Vector3 };
    };
    color?: { r: number; g: number; b: number };
    alpha?: number;
  };
  skybox: {
    meshName: string;
    path: string;
  };
  camera: {
    angles: { alpha: number; beta: number; radius: number };
    targetOffset: Vector3;
    followOffset?: Vector3;
  };
  light: {
    direction: Vector3;
    intensity?: number;
  };
  websocket: {
    url: string;
    protocols?: string | string[];
  };
}
