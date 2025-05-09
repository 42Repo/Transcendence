"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsEngine = void 0;
class PhysicsEngine {
    constructor(config) {
        this.config = config;
    }
    update(game) {
        this.moveBall(game.ball);
        this.handleCollisions(game);
    }
    moveBall(ball) {
        if (ball.onWall) {
            ball.dirZ *= -1;
            ball.onWall = false;
        }
        ball.posZ += ball.dirZ * ball.speed;
        ball.posY += ball.dirY * ball.speed;
    }
    handleCollisions(game) {
        const ball = game.ball;
        const bounds = game.table.bounds;
        const radius = this.config.ball.diameter / 2;
        const maxZ = bounds.depth / 2 - radius;
        if (ball.posZ > maxZ) {
            ball.posZ = maxZ;
            ball.onWall = true;
        }
        else if (ball.posZ < -maxZ) {
            ball.posZ = -maxZ;
            ball.onWall = true;
        }
    }
    handlePlayerInput(game, player, input) {
        const paddle = game.paddles.find((pad) => {
            return player.id === pad.id;
        });
        if (!paddle)
            return;
        switch (input.key) {
            case 'ArrowUp':
            case 'w':
            case 'KeyW':
                paddle.posZ -= paddle.speed;
                break;
            case 'ArrowDown':
            case 's':
            case 'KeyS':
                paddle.posZ += paddle.speed;
                break;
            default:
                return;
        }
        const maxBound = game.table.bounds.depth * .5 - paddle.width * .5;
        paddle.posZ = Math.sign(paddle.posZ) * Math.min(Math.abs(paddle.posZ), maxBound);
    }
}
exports.PhysicsEngine = PhysicsEngine;
