import express, { type Request, type Response, type Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { uploadImage } from '@/common/middleware/upload';
import { uploadToS3 } from '@/common/services/s3';
import { ServiceResponse } from '@/common/models/serviceResponse';

export const uploadRouter: Router = express.Router();

uploadRouter.post(
  '/image',
  uploadImage.single('image'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      const response = ServiceResponse.failure(
        'No image file provided',
        null,
        StatusCodes.BAD_REQUEST,
      );
      res.status(response.statusCode).send(response);
      return;
    }

    try {
      const url = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        'user-photos',
        req.file.mimetype,
      );

      const response = ServiceResponse.success('Image uploaded', { url }, StatusCodes.CREATED);
      res.status(response.statusCode).send(response);
    } catch {
      const response = ServiceResponse.failure(
        'Failed to upload image',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
      res.status(response.statusCode).send(response);
    }
  },
);
