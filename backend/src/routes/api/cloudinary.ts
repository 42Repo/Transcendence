import {
  FastifyRequest,
  FastifyReply,
  FastifyInstance,
} from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_SECRET_API_KEY!,
});

const streamUpload = (file: MultipartFile, user: string, num: number): Promise<UploadApiResponse> => {
  return new Promise<UploadApiResponse>((resolve, rejects) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `/transcendence/avatar/${user}`,
        public_id: `${user}${num}`,
      },
      (error, result) => {
        if (error)
          return rejects(error);
        resolve(result as UploadApiResponse);
      }
    );
    file.file.pipe(stream);
  });
};

const deleteAvatarFolder = async (user: string) => {
  await cloudinary.api.delete_resources_by_prefix(`transcendence/avatar/${user}/`);
  await cloudinary.api.delete_folder(`transcendence/avatar/${user}`);
};

export const cloudinaryRoutes = (fastify: FastifyInstance) => {
  fastify.post('/img/avatar', async (req: FastifyRequest, rep: FastifyReply) => {
    try {
      const parts = req.parts();
      const userName = req.query && (req.query as any).name;
      if (!userName) {
        return rep.status(400).send({ error: 'User name required' });
      }
      const files: string[] = [];
      let index: number = 0;
      for await (const part of parts) {
        const file: MultipartFile = part as MultipartFile;
        if (file.type === 'file') {
          const response = await streamUpload(file, userName, index);
          files.push(response.secure_url);
          index++;
        }
      }
      if (files.length === 0) {
        return rep.status(400).send('error: bad file type');
      } else {
        return rep.status(200).send({ message: 'file uploaded', urls: files });
      }
    } catch (err: any) {
      console.log(err);
    }
  });

  fastify.delete('/img/avatar/delete/:name', async (req: FastifyRequest, rep: FastifyReply) => {
    const name = req.params && (req.params as any).name;
    console.log(name);
    if (!name) {
      return rep.status(400).send({ error: 'Player name required' });
    }
    try {
      await deleteAvatarFolder(name);
      rep.status(200).send('File deleted success');
    } catch (error) {
      console.log(error);
      return rep.status(500).send({ error: 'Server can t handle request' });
    }
  });

  fastify.put('/img/avatar/update/:name', async (req: FastifyRequest, rep: FastifyReply) => {
    const name = req.params && (req.params as any).name;
    if (!name) {
      return rep.status(400).send('name is required');
    }
    try {
      const parts = req.parts();
      const uploadedFiles: string[] = [];
      let index = 0;

      await deleteAvatarFolder(name);

      for await (const part of parts) {
        const file = part as MultipartFile;
        if (file.type === 'file') {
          const response = await streamUpload(file, name, index++);
          uploadedFiles.push(response.secure_url);
        }
      }

      if (uploadedFiles.length === 0) {
        return rep.status(400).send({ error: 'No valid files uploaded' });
      }

      return rep.status(200).send({ message: 'Avatar updated', urls: uploadedFiles });
    } catch (error) {
      console.log(error);
      rep.status(500).send({ error: 'Server error' });
    }
  })
};
