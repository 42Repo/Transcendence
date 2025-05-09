"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialState = createInitialState;
const DefaultConf_1 = require("./DefaultConf");
function createInitialState() {
    return {
        table: {
            bounds: {
                width: DefaultConf_1.defaultConfig.table.width,
                depth: DefaultConf_1.defaultConfig.table.depth,
            }
        },
        ball: {
            posZ: DefaultConf_1.defaultConfig.ball.initialPosition.z,
            posY: DefaultConf_1.defaultConfig.ball.initialPosition.y,
            speed: .1,
            diameter: DefaultConf_1.defaultConfig.ball.diameter,
            dirZ: -1,
            dirY: 1,
            onWall: false,
        },
        paddles: [
            {
                id: '',
                playerName: '',
                posX: 0, posZ: 0,
                width: DefaultConf_1.defaultConfig.paddle.width,
                speed: .1
            },
            { id: '',
                playerName: '',
                posX: 0,
                posZ: 0,
                width: DefaultConf_1.defaultConfig.paddle.width,
                speed: .1
            }
        ],
        players: [
            {
                id: '',
                name: '',
                socket: null,
                score: 0,
                touchedBall: 0,
                missedBall: 0,
                touchedBallInRaw: 0,
                missedBallInRaw: 0,
                lastTouch: false
            },
            {
                id: '',
                name: '',
                socket: null,
                score: 0,
                touchedBall: 0,
                missedBall: 0,
                touchedBallInRaw: 0,
                missedBallInRaw: 0,
                lastTouch: false
            }
        ]
    };
}
