import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';

interface RecordMatchBody {
  player1_id?: number | null;
  player2_id?: number | null;
  player1_guest_name?: string | null;
  player2_guest_name?: string | null;
  player1_score: number;
  player2_score: number;
  winner_id?: number | null;
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
    async (
      request: FastifyRequest<{ Body: RecordMatchBody }>,
      reply: FastifyReply
    ) => {
      const {
        player1_id,
        player2_id,
        player1_guest_name,
        player2_guest_name,
        player1_score,
        player2_score,
        winner_id,
        player1_touched_ball = 0,
        player1_missed_ball = 0,
        player1_touched_ball_in_row = 0,
        player1_missed_ball_in_row = 0,
        player2_touched_ball = 0,
        player2_missed_ball = 0,
        player2_touched_ball_in_row = 0,
        player2_missed_ball_in_row = 0,
      } = request.body;

      if (
        (player1_id === undefined && player1_guest_name === undefined) ||
        (player2_id === undefined && player2_guest_name === undefined) ||
        player1_score === undefined ||
        player2_score === undefined
      ) {
        return reply.status(400).send({
          success: false,
          message:
            'Missing required fields: player1_id or player1_guest_name, player2_id or player2_guest_name, player1_score, player2_score.',
        });
      }

      if (
        player1_id &&
        !player1_guest_name !== true &&
        player1_id === null &&
        !player1_guest_name
      ) {
        return reply.status(400).send({
          success: false,
          message:
            'Player 1 guest name is required if player1_id is null or not provided.',
        });
      }
      if (
        player2_id &&
        !player2_guest_name !== true &&
        player2_id === null &&
        !player2_guest_name
      ) {
        return reply.status(400).send({
          success: false,
          message:
            'Player 2 guest name is required if player2_id is null or not provided.',
        });
      }

      try {
        const checkUserStmt = fastify.db.prepare(
          'SELECT user_id FROM users WHERE user_id = ?'
        );

        if (player1_id && !checkUserStmt.get(player1_id)) {
          return reply.status(404).send({
            success: false,
            message: `Player 1 ID ${player1_id} not found.`,
          });
        }
        if (player2_id && !checkUserStmt.get(player2_id)) {
          return reply.status(404).send({
            success: false,
            message: `Player 2 ID ${player2_id} not found.`,
          });
        }
        if (winner_id && !checkUserStmt.get(winner_id)) {
          return reply.status(404).send({
            success: false,
            message: `Winner ID ${winner_id} not found.`,
          });
        }

        const finalP1Id = player1_id || null;
        const finalP2Id = player2_id || null;
        const finalP1GuestName = finalP1Id ? null : player1_guest_name;
        const finalP2GuestName = finalP2Id ? null : player2_guest_name;

        const insertStmt = fastify.db.prepare(
          `INSERT INTO game_matches (
            player1_id, player2_id, player1_guest_name, player2_guest_name,
            player1_score, player2_score, winner_id,
            player1_touched_ball, player1_missed_ball, player1_touched_ball_in_row, player1_missed_ball_in_row,
            player2_touched_ball, player2_missed_ball, player2_touched_ball_in_row, player2_missed_ball_in_row
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        const info = insertStmt.run(
          finalP1Id,
          finalP2Id,
          finalP1GuestName,
          finalP2GuestName,
          player1_score,
          player2_score,
          winner_id === undefined ? null : winner_id,
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
            message:
              'Invalid registered player ID(s) provided (FOREIGN KEY constraint failed).',
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
