import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';

interface RecordMatchBody {
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  winner_id?: number;
  player1_touched_ball?: number;
  player1_missed_ball?: number;
  player1_touched_ball_in_row?: number;
  player1_missed_ball_in_row?: number;
  player2_touched_ball?: number;
  player2_missed_ball?: number;
  player2_touched_ball_in_row?: number;
  player2_missed_ball_in_row?: number;
}

export default function matchesRoutes(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  fastify.post(
    '/matches',
    // TODO: Add schema validation for the body
    // TODO: Consider adding authentication/authorization for this endpoint if it's not purely internal
    async (
      request: FastifyRequest<{ Body: RecordMatchBody }>,
      reply: FastifyReply
    ) => {
      const {
        player1_id,
        player2_id,
        player1_score,
        player2_score,
        player1_touched_ball = 0,
        player1_missed_ball = 0,
        player1_touched_ball_in_row = 0,
        player1_missed_ball_in_row = 0,
        player2_touched_ball = 0,
        player2_missed_ball = 0,
        player2_touched_ball_in_row = 0,
        player2_missed_ball_in_row = 0,
      } = request.body;

      let { winner_id } = request.body;

      if (
        !player1_id ||
        !player2_id ||
        player1_score === undefined ||
        player2_score === undefined
      ) {
        return reply.status(400).send({
          success: false,
          message:
            'Missing required fields: player1_id, player2_id, player1_score, player2_score.',
        });
      }

      if (winner_id === undefined) {
        if (player1_score > player2_score) {
          winner_id = player1_id;
        } else if (player2_score > player1_score) {
          winner_id = player2_id;
        } else {
          winner_id = undefined; // Explicitly set to undefined for draw, DB will store NULL
        }
      }

      try {
        const checkUserStmt = fastify.db.prepare(
          'SELECT user_id FROM users WHERE user_id = ?'
        );
        const player1Exists = checkUserStmt.get(player1_id);
        const player2Exists = checkUserStmt.get(player2_id);

        if (!player1Exists || !player2Exists) {
          return reply.status(404).send({
            success: false,
            message: 'One or both player IDs not found.',
          });
        }
        if (winner_id && !checkUserStmt.get(winner_id)) {
          return reply
            .status(404)
            .send({ success: false, message: 'Winner ID not found.' });
        }

        const insertStmt = fastify.db.prepare(
          `INSERT INTO game_matches (
            player1_id, player2_id, player1_score, player2_score, winner_id,
            player1_touched_ball, player1_missed_ball, player1_touched_ball_in_row, player1_missed_ball_in_row,
            player2_touched_ball, player2_missed_ball, player2_touched_ball_in_row, player2_missed_ball_in_row
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        const info = insertStmt.run(
          player1_id,
          player2_id,
          player1_score,
          player2_score,
          winner_id,
          player1_touched_ball,
          player1_missed_ball,
          player1_touched_ball_in_row,
          player1_missed_ball_in_row,
          player2_touched_ball,
          player2_missed_ball,
          player2_touched_ball_in_row,
          player2_missed_ball_in_row
        );

        fastify.log.info(`Match recorded with ID: ${info.lastInsertRowid}`);
        return reply.status(201).send({
          success: true,
          message: 'Match recorded successfully.',
          match_id: info.lastInsertRowid,
        });
      } catch (err) {
        request.log.error(err, 'Error recording match');

        if (
          err instanceof Error &&
          err.message.includes('FOREIGN KEY constraint failed')
        ) {
          return reply.status(400).send({
            success: false,
            message: 'Invalid player ID(s) provided.',
          });
        }
        return reply.status(500).send({
          success: false,
          message: 'Internal Server Error during match recording.',
        });
      }
    }
  );
  fastify.log.info('Registered API routes: /matches');
}
