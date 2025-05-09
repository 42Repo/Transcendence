import { GameObject } from './GameObject.ts';
import { StateManager } from './StateManager.ts';
import { MeshWriter } from 'meshwriter';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Path2, Curve3 } from '@babylonjs/core/Maths/math.path';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PolygonMeshBuilder } from '@babylonjs/core/Meshes/polygonMesh';
import { SolidParticleSystem } from '@babylonjs/core/Particles/solidParticleSystem';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CSG } from '@babylonjs/core';

const methodsObj = {
  Vector2,
  Vector3,
  Path2,
  Curve3,
  Color3,
  SolidParticleSystem,
  PolygonMeshBuilder,
  CSG,
  StandardMaterial,
  Mesh,
};
interface WriterValues {
  text: string;
  'font-family'?: string;
  anchor: string;
  'letter-height': number;
  'letter-thickness': number;
  color: string;
  alpha?: number;
  position: {
    x?: number;
    y?: number;
    z?: number;
  };
  colors?: {
    diffuse?: number;
    specular?: number;
    ambient?: number;
    emissive?: WriterValues['color'];
  };
}

export interface WriterDef {
  scale: number;
  writer: WriterValues;
}

export type WriterProps = WriterDef & WriterValues;
export class MyMeshWriter extends GameObject {
  public meshWriter: any;
  public text: any;

  constructor(game: StateManager, props: WriterDef) {
    super(game);
    const { scale, writer } = props;
    const {
      text,
      'font-family': fontFamily = 'cursive',
      anchor,
      'letter-height': letterHeight,
      'letter-thickness': letterThickness,
      color,
      alpha,
      position,
      colors,
    } = writer;
    this.meshWriter = (MeshWriter as any)(game.currentScene, {
      scale: scale,
      methods: methodsObj,
    });
    this.text = new this.meshWriter(text, {
      'font-family': fontFamily,
      anchor,
      'letter-height': letterHeight,
      'letter-thickness': letterThickness,
      color,
      alpha,
      position,
      colors,
    });
    this.mesh = this.text.getMesh();
  }
}
