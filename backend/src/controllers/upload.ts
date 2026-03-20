import path from 'path';
import { RequestHandler } from 'express';
import { UPLOAD_PATH } from '../config';
import BadRequestError from '../errors/bad-request-error';

const uploadFile: RequestHandler = (req, res, next) => {
  try {
    if (!req.file) {
      next(new BadRequestError('File is required'));
      return;
    }

    const relativePath = path.posix.join('/', UPLOAD_PATH, req.file.filename);

    res.status(201).send({
      fileName: relativePath,
      originalName: req.file.originalname,
    });
  } catch (err) {
    next(err);
  }
};

export default uploadFile;
