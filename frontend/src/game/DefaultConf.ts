import { Vector3 } from "@babylonjs/core";
import { PongConfig } from "./PongConfig";

const table = {
  width: 8,
  depth: 4,
  height: .1,
  y: -0.3,
  color: { r: 0.1, g: 0.5, b: 0.3 },
};

const paddle = {
  width: 1,
  height: 0.3,
  depth: 0.2,
  rotation: Math.PI / 2,
  xOffset: table.width / 2 - 0.5 * 0.2,  
  colorLeft: { r: 1, g: 0, b: 0 },
  colorRight: { r: 0, g: 0, b: 1 },
};

const paddlePositions = {
  left: new Vector3(-paddle.xOffset, 0, 0),
  right: new Vector3( paddle.xOffset, 0, 0),
};

const wall = {
  height: 0.4,
  thickness: 0.1,
  color: { r: 1, g: 1, b: 1 },
  alpha: 0.3,
};

const createWallPositionsFromTable = (
  tableWidth: number,
  tableDepth: number,
  tableY: number,
  tableHeight: number,
  wallThickness: number,
  wallHeight: number
) => {
  const y = tableY + tableHeight / 2 + wallHeight / 2;

  return {
    left: {
      width: wallThickness,
      height: wallHeight,
      depth: tableDepth,
      position: new Vector3(-tableWidth / 2, y, 0),
    },
    right: {
      width: wallThickness,
      height: wallHeight,
      depth: tableDepth,
      position: new Vector3(tableWidth / 2, y, 0),
    },
    front: {
      width: tableWidth,
      height: wallHeight,
      depth: wallThickness,
      position: new Vector3(0, y, -tableDepth / 2),
    },
    back: {
      width: tableWidth,
      height: wallHeight,
      depth: wallThickness,
      position: new Vector3(0, y, tableDepth / 2),
    },
  };
}

const wallPositions = createWallPositionsFromTable(
  table.width,
  table.depth,
  table.y,
  table.height,
  wall.thickness,
  wall.height
);

export const defaultConfig: PongConfig = {
  canvas: {
    width: 700, height: 500,
    border: "0.2em solid purple",
    borderRadius: "10%",
  },

  table: {
    ...table,
  },

  paddle: {
    width:  paddle.width,
    height: paddle.height,
    depth:  paddle.depth,
    rotation: paddle.rotation,
    positions: paddlePositions,
    colors: {
      left:  paddle.colorLeft,
      right: paddle.colorRight,
    },
  },

  ball: {
    diameter: 0.3,
    initialPosition: new Vector3(0, -0.01, 0),
  },

  wall: {
    height : wall.height,
    thickness : wall.thickness,
    wallPositions,
    color:     wall.color,
    alpha:     wall.alpha,
  },

  skybox: {
    meshName: "Sphere__0",
    path: "../public/assets/img/DreamlikeLandscape.glb",
  },

  camera: {
    angles:       { alpha: Math.PI / 2, beta: Math.PI / 4, radius: 10 },
    targetOffset: Vector3.Zero(),
    followOffset: undefined, //new Vector3(0, 0.5, -3),
  },

  light: {
    direction: new Vector3(1, 1, 0),
  },

  websocket: {
    url:
      location.hostname === "localhost"
        ? "ws://localhost:4000/ws"
        : `wss://${location.host}/ws`,
  },
};
