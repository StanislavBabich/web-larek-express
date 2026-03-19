import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { UPLOAD_PATH } from '../config';

export interface IProductImage {
  fileName: string;
  originalName: string;
}

export interface IProduct {
  title: string;
  image: IProductImage;
  category: string;
  description?: string;
  price: number | null;
}

const productImageSchema = new mongoose.Schema<IProductImage>({
  fileName: {
    type: String,
    required: [true, 'Поле "image.fileName" должно быть заполнено'],
  },
  originalName: {
    type: String,
    required: [true, 'Поле "image.originalName" должно быть заполнено'],
  },
}, { _id: false });

const productSchema = new mongoose.Schema<IProduct>({
  title: {
    type: String,
    required: [true, 'Поле "title" должно быть заполнено'],
    unique: true,
    minlength: [2, 'Минимальная длина поля "title" - 2'],
    maxlength: [30, 'Максимальная длина поля "title" - 30'],
  },
  image: {
    type: productImageSchema,
    required: [true, 'Поле "image" должно быть заполнено'],
  },
  category: {
    type: String,
    required: [true, 'Поле "category" должно быть заполнено'],
  },
  description: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: false,
    default: null,
  },
}, {
  versionKey: false,
});

productSchema.post('findOneAndDelete', async (doc) => {
  if (!doc?.image?.fileName) return;

  const filePath = path.join(process.cwd(), 'src', 'public', UPLOAD_PATH, path.basename(doc.image.fileName));

  try {
    await fs.promises.unlink(filePath);
  } catch (_err) {
    await Promise.resolve(_err);
  }
});

export default mongoose.model<IProduct>('product', productSchema);
