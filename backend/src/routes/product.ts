import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '../controllers/products';
import { validateCreateProduct } from '../middlewares/request-validation';
import auth from '../middlewares/auth';

const router = Router();

router.get('/', getProducts);
router.post('/', validateCreateProduct, createProduct);
router.patch('/:productId', auth, updateProduct);
router.delete('/:productId', auth, deleteProduct);

export default router;
