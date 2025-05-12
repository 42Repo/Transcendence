import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_SECRET_API_KEY!,
});

const getUserCloudinaryFolder = (userId: number) =>
  `transcendence/avatars/user_${userId}`;

const streamUpload = (
  file: MultipartFile,
  userId: number
): Promise<UploadApiResponse> => {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const folder = getUserCloudinaryFolder(userId);
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: 'avatar',
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Cloudinary upload result is undefined.'));
        }
      }
    );
    file.file.pipe(stream);
  });
};

const deleteUserAvatarFolder = async (userId: number) => {
  const folder = getUserCloudinaryFolder(userId);
  try {
    await cloudinary.api.delete_resources_by_prefix(folder + '/');
  } catch (error: any) {
    if (error.http_code !== 404) {
      console.warn(
        `Could not delete Cloudinary folder ${folder} or it was already empty:`,
        error.message
      );
    }
  }
};

export default function cloudinaryUserAvatarRoutes(fastify: FastifyInstance) {
  fastify.put(
    '/avatar',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || !user.id) {
          return reply
            .status(401)
            .send({ success: false, message: 'User not authenticated.' });
        }
        const userId = user.id;

        const data = await request.file();
        if (!data) {
          return reply
            .status(400)
            .send({ success: false, message: 'No file uploaded.' });
        }

        await deleteUserAvatarFolder(userId);

        const uploadResponse = await streamUpload(data, userId);

        if (!uploadResponse || !uploadResponse.secure_url) {
          return reply.status(500).send({
            success: false,
            message: 'Failed to upload avatar to Cloudinary.',
          });
        }

        return reply.status(200).send({
          success: true,
          message: 'Avatar updated successfully.',
          avatar_url: uploadResponse.secure_url,
        });
      } catch (err: any) {
        request.log.error(err, 'Error updating avatar');
        reply.status(500).send({
          success: false,
          message: 'Server error during avatar update.',
        });
      }
    }
  );

  fastify.delete(
    '/avatar',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user;
        if (!user || !user.id) {
          return reply
            .status(401)
            .send({ success: false, message: 'User not authenticated.' });
        }
        const userId = user.id;

        await deleteUserAvatarFolder(userId);

        return reply.status(200).send({
          success: true,
          message: 'Avatar deleted from Cloudinary successfully.',
        });
      } catch (err: any) {
        request.log.error(err, 'Error deleting avatar');
        reply.status(500).send({
          success: false,
          message: 'Server error during avatar deletion.',
        });
      }
    }
  );
  fastify.log.info(
    'Registered Cloudinary user avatar routes: PUT /avatar, DELETE /avatar'
  );
}
