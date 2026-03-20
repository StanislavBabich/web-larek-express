import { Router } from 'express';
import productRouter from './product';
import orderRouter from './order';
import authRouter from './auth';
import uploadRouter from './upload';
import NotFoundError from '../errors/not-found-error';

const router = Router();

router.use('/product', productRouter);
router.use('/order', orderRouter);
router.use('/auth', authRouter);
router.use('/upload', uploadRouter);

router.use(() => {
  throw new NotFoundError('Route not found');
});

export default router;
