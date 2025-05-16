import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

function getTargetUserId(
  fastify: FastifyInstance,
  identifier: string | number
): number | null {
  let targetUser: { user_id: number } | undefined;
  if (typeof identifier === 'number') {
    const stmt = fastify.db.prepare(
      'SELECT user_id FROM users WHERE user_id = ?'
    );
    targetUser = stmt.get(identifier) as { user_id: number } | undefined;
  } else {
    const stmt = fastify.db.prepare(
      'SELECT user_id FROM users WHERE username = ? COLLATE NOCASE'
    );
    targetUser = stmt.get(identifier) as { user_id: number } | undefined;
  }
  return targetUser ? targetUser.user_id : null;
}

interface FriendshipRow {
  friendship_id: number;
  user_id_one: number;
  user_id_two: number;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  action_user_id: number;
  created_at: string;
  updated_at: string;
}

export default async function friendsRoutes(fastify: FastifyInstance) {
  const authHook = { onRequest: [fastify.authenticate] };

  fastify.post<{ Params: { targetIdentifier: string } }>(
    '/friends/request/:targetIdentifier',
    authHook,
    async (request, reply) => {
      const currentUserId = request.user.id;
      const { targetIdentifier } = request.params;

      const targetUserId = getTargetUserId(fastify, targetIdentifier);

      if (!targetUserId) {
        return reply
          .status(404)
          .send({ success: false, message: 'Target user not found.' });
      }

      if (currentUserId === targetUserId) {
        return reply.status(400).send({
          success: false,
          message: 'You cannot send a friend request to yourself.',
        });
      }

      const userOneId = Math.min(currentUserId, targetUserId);
      const userTwoId = Math.max(currentUserId, targetUserId);

      try {
        const existingFriendshipStmt = fastify.db.prepare(
          'SELECT * FROM friendships WHERE user_id_one = ? AND user_id_two = ?'
        );
        const existingFriendship = existingFriendshipStmt.get(
          userOneId,
          userTwoId
        ) as FriendshipRow | undefined;

        if (existingFriendship) {
          const { status, action_user_id } = existingFriendship;
          if (status === 'accepted') {
            return reply.status(409).send({
              success: false,
              message: 'You are already friends with this user.',
            });
          }
          if (status === 'pending') {
            if (action_user_id === currentUserId) {
              return reply.status(409).send({
                success: false,
                message: 'You have already sent a friend request to this user.',
              });
            } else {
              const updateStmt = fastify.db.prepare(
                "UPDATE friendships SET status = 'accepted', action_user_id = ? WHERE user_id_one = ? AND user_id_two = ?"
              );
              updateStmt.run(currentUserId, userOneId, userTwoId);
              return reply
                .status(200)
                .send({ success: true, message: 'Friendship accepted.' });
            }
          }
          if (status === 'blocked') {
            if (action_user_id === currentUserId) {
              return reply.status(403).send({
                success: false,
                message:
                  'You have blocked this user. Unblock them first to send a request.',
              });
            } else {
              return reply.status(403).send({
                success: false,
                message: 'This user has blocked you.',
              });
            }
          }

          const updateStmt = fastify.db.prepare(
            "UPDATE friendships SET status = 'pending', action_user_id = ? WHERE user_id_one = ? AND user_id_two = ?"
          );
          updateStmt.run(currentUserId, userOneId, userTwoId);
          return reply
            .status(201)
            .send({ success: true, message: 'Friend request sent.' });
        } else {
          const insertStmt = fastify.db.prepare(
            'INSERT INTO friendships (user_id_one, user_id_two, status, action_user_id) VALUES (?, ?, ?, ?)'
          );
          insertStmt.run(userOneId, userTwoId, 'pending', currentUserId);
          return reply
            .status(201)
            .send({ success: true, message: 'Friend request sent.' });
        }
      } catch (err) {
        request.log.error(err, 'Error processing friend request');
        return reply
          .status(500)
          .send({ success: false, message: 'Internal server error.' });
      }
    }
  );

  fastify.post<{ Params: { requesterId: string } }>(
    '/friends/accept/:requesterId',
    authHook,
    async (request, reply) => {
      const currentUserId = request.user.id;
      const requesterId = parseInt(request.params.requesterId, 10);

      if (isNaN(requesterId)) {
        return reply
          .status(400)
          .send({ success: false, message: 'Invalid requester ID.' });
      }
      if (currentUserId === requesterId) {
        return reply.status(400).send({
          success: false,
          message: 'Cannot accept a request from yourself.',
        });
      }

      const userOneId = Math.min(currentUserId, requesterId);
      const userTwoId = Math.max(currentUserId, requesterId);

      try {
        const stmt = fastify.db.prepare(
          'SELECT * FROM friendships WHERE user_id_one = ? AND user_id_two = ?'
        );
        const friendship = stmt.get(userOneId, userTwoId) as
          | FriendshipRow
          | undefined;

        if (
          !friendship ||
          friendship.status !== 'pending' ||
          friendship.action_user_id !== requesterId
        ) {
          return reply.status(404).send({
            success: false,
            message:
              'No pending friend request found from this user to accept.',
          });
        }

        const updateStmt = fastify.db.prepare(
          "UPDATE friendships SET status = 'accepted', action_user_id = ? WHERE user_id_one = ? AND user_id_two = ?"
        );
        updateStmt.run(currentUserId, userOneId, userTwoId);
        return reply
          .status(200)
          .send({ success: true, message: 'Friend request accepted.' });
      } catch (err) {
        request.log.error(err, 'Error accepting friend request');
        return reply
          .status(500)
          .send({ success: false, message: 'Internal server error.' });
      }
    }
  );

  fastify.post<{
    Params: { targetUserId: string };
    Body: { type: 'decline' | 'cancel' };
  }>('/friends/action/:targetUserId', authHook, async (request, reply) => {
    const currentUserId = request.user.id;
    const targetUserId = parseInt(request.params.targetUserId, 10);
    const actionType = request.body?.type;

    if (isNaN(targetUserId)) {
      return reply
        .status(400)
        .send({ success: false, message: 'Invalid target user ID.' });
    }
    if (!actionType || (actionType !== 'decline' && actionType !== 'cancel')) {
      return reply.status(400).send({
        success: false,
        message: "Invalid action type. Must be 'decline' or 'cancel'.",
      });
    }

    const userOneId = Math.min(currentUserId, targetUserId);
    const userTwoId = Math.max(currentUserId, targetUserId);

    try {
      const stmt = fastify.db.prepare(
        'SELECT * FROM friendships WHERE user_id_one = ? AND user_id_two = ? AND status = ?'
      );
      const friendship = stmt.get(userOneId, userTwoId, 'pending') as
        | FriendshipRow
        | undefined;

      if (!friendship) {
        return reply.status(404).send({
          success: false,
          message: 'No pending request found with this user.',
        });
      }

      let message = '';
      if (actionType === 'decline') {
        if (friendship.action_user_id !== targetUserId) {
          return reply.status(403).send({
            success: false,
            message:
              'Cannot decline: this request was not sent by the target user.',
          });
        }
        message = 'Friend request declined.';
      } else {
        if (friendship.action_user_id !== currentUserId) {
          return reply.status(403).send({
            success: false,
            message: 'Cannot cancel: this request was not sent by you.',
          });
        }
        message = 'Friend request cancelled.';
      }

      const updateStmt = fastify.db.prepare(
        "UPDATE friendships SET status = 'declined', action_user_id = ? WHERE user_id_one = ? AND user_id_two = ?"
      );
      updateStmt.run(currentUserId, userOneId, userTwoId);

      return reply.status(200).send({ success: true, message });
    } catch (err) {
      request.log.error(err, `Error ${actionType}ing friend request`);
      return reply
        .status(500)
        .send({ success: false, message: 'Internal server error.' });
    }
  });

  fastify.delete<{ Params: { friendId: string } }>(
    '/friends/:friendId',
    authHook,
    async (request, reply) => {
      const currentUserId = request.user.id;
      const friendId = parseInt(request.params.friendId, 10);

      if (isNaN(friendId)) {
        return reply
          .status(400)
          .send({ success: false, message: 'Invalid friend ID.' });
      }

      const userOneId = Math.min(currentUserId, friendId);
      const userTwoId = Math.max(currentUserId, friendId);

      try {
        const stmt = fastify.db.prepare(
          "DELETE FROM friendships WHERE user_id_one = ? AND user_id_two = ? AND status = 'accepted'"
        );
        const result = stmt.run(userOneId, userTwoId);

        if (result.changes === 0) {
          return reply.status(404).send({
            success: false,
            message: 'Friendship not found or not in accepted state.',
          });
        }
        return reply
          .status(200)
          .send({ success: true, message: 'Friend removed successfully.' });
      } catch (err) {
        request.log.error(err, 'Error removing friend');
        return reply
          .status(500)
          .send({ success: false, message: 'Internal server error.' });
      }
    }
  );

  fastify.get('/friends', authHook, async (request, reply) => {
    const currentUserId = request.user.id;
    try {
      const stmt = fastify.db.prepare(`
        SELECT
          f.status, f.action_user_id,
          CASE
            WHEN f.user_id_one = ? THEN u2.user_id
            ELSE u1.user_id
          END as friend_user_id,
          CASE
            WHEN f.user_id_one = ? THEN u2.username
            ELSE u1.username
          END as username,
          CASE
            WHEN f.user_id_one = ? THEN u2.avatar_url
            ELSE u1.avatar_url
          END as avatar_url,
          CASE
            WHEN f.user_id_one = ? THEN u2.status
            ELSE u1.status
          END as online_status
        FROM friendships f
        JOIN users u1 ON f.user_id_one = u1.user_id
        JOIN users u2 ON f.user_id_two = u2.user_id
        WHERE (f.user_id_one = ? OR f.user_id_two = ?) AND f.status = 'accepted'
      `);
      const friends = stmt.all(
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId
      );
      return reply.status(200).send({ success: true, friends });
    } catch (err) {
      request.log.error(err, 'Error fetching friends list');
      return reply
        .status(500)
        .send({ success: false, message: 'Internal server error.' });
    }
  });

  fastify.get('/friends/requests/pending', authHook, async (request, reply) => {
    const currentUserId = request.user.id;
    try {
      const stmt = fastify.db.prepare(`
        SELECT
          u.user_id as requester_user_id,
          u.username,
          u.avatar_url,
          u.status as online_status,
          f.created_at as request_date
        FROM friendships f
        JOIN users u ON f.action_user_id = u.user_id
        WHERE (f.user_id_one = ? OR f.user_id_two = ?)
          AND f.status = 'pending'
          AND f.action_user_id != ?
      `);
      const pendingRequests = stmt.all(
        currentUserId,
        currentUserId,
        currentUserId
      );
      return reply
        .status(200)
        .send({ success: true, requests: pendingRequests });
    } catch (err) {
      request.log.error(err, 'Error fetching pending friend requests');
      return reply
        .status(500)
        .send({ success: false, message: 'Internal server error.' });
    }
  });

  fastify.get('/friends/requests/sent', authHook, async (request, reply) => {
    const currentUserId = request.user.id;
    try {
      const stmt = fastify.db.prepare(`
        SELECT
          CASE
            WHEN f.user_id_one = ? THEN u2.user_id
            ELSE u1.user_id
          END as addressee_user_id,
          CASE
            WHEN f.user_id_one = ? THEN u2.username
            ELSE u1.username
          END as username,
          CASE
            WHEN f.user_id_one = ? THEN u2.avatar_url
            ELSE u1.avatar_url
          END as avatar_url,
          CASE
            WHEN f.user_id_one = ? THEN u2.status
            ELSE u1.status
          END as online_status,
          f.created_at as request_date
        FROM friendships f
        JOIN users u1 ON f.user_id_one = u1.user_id
        JOIN users u2 ON f.user_id_two = u2.user_id
        WHERE f.action_user_id = ? AND f.status = 'pending'
      `);
      const sentRequests = stmt.all(
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId
      );
      return reply.status(200).send({ success: true, requests: sentRequests });
    } catch (err) {
      request.log.error(err, 'Error fetching sent friend requests');
      return reply
        .status(500)
        .send({ success: false, message: 'Internal server error.' });
    }
  });

  fastify.log.info('Registered API routes for /friends');
}
