import fs from 'fs';
import path from 'path';
import { RequestHandler } from 'express';
import Product from '../models/product';
import BadRequestError from '../errors/bad-request-error';
import NotFoundError from '../errors/not-found-error';
import { UPLOAD_PATH, UPLOAD_PATH_TEMP } from '../config';

type CreateProductBody = {
  title: string;
  image: {
    fileName: string;
    originalName: string;
  };
  category: string;
  description?: string;
  price?: number | null;
};

const moveImageIfNeeded = async (image?: CreateProductBody['image']) => {
  if (!image) return undefined;

  const tempPath = path.join(process.cwd(), 'src', 'public', UPLOAD_PATH_TEMP, path.basename(image.fileName));
  const finalPath = path.join(process.cwd(), 'src', 'public', UPLOAD_PATH, path.basename(image.fileName));

  try {
    await fs.promises.rename(tempPath, finalPath);
  } catch {
    // ignore if file missing
  }

  return {
    fileName: path.posix.join('/', UPLOAD_PATH, path.basename(image.fileName)),
    originalName: image.originalName,
  };
};

export const getProducts: RequestHandler = async (_req, res, next) => {
  try {
    const items = await Product.find({}).lean();

    res.send({
      items,
      total: items.length,
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct: RequestHandler = async (req, res, next) => {
  try {
    // request body is validated by celebrate middleware
    const body = req.body as CreateProductBody;
    const {
      title, image, category, description, price,
    } = body;

    const finalImage = await moveImageIfNeeded(image);

    const created = await Product.create({
      title,
      image: finalImage,
      category,
      description,
      price: price ?? null,
    });

    res.status(201).send(created);
  } catch (err: unknown) {
    next(err);
  }
};

export const updateProduct: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      throw new BadRequestError('Product id is required');
    }

    const body = req.body as Partial<CreateProductBody>;

    let finalImage = body.image;
    if (body.image) {
      const moved = await moveImageIfNeeded(body.image);
      if (moved) {
        finalImage = moved;
      }
    }

    const update: Record<string, unknown> = {};
    if (body.title !== undefined) update.title = body.title;
    if (finalImage !== undefined) update.image = finalImage;
    if (body.category !== undefined) update.category = body.category;
    if (body.description !== undefined) update.description = body.description;
    if (body.price !== undefined) update.price = body.price;

    const updated = await Product.findByIdAndUpdate(productId, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      throw new NotFoundError('Product not found');
    }

    res.send(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteProduct: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      throw new BadRequestError('Product id is required');
    }

    const deleted = await Product.findByIdAndDelete(productId);
    if (!deleted) {
      throw new NotFoundError('Product not found');
    }

    res.send(deleted);
  } catch (err) {
    next(err);
  }
};
