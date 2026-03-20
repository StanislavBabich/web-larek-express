import { Router } from 'express';
import {
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  register,
} from '../controllers/auth';
import auth from '../middlewares/auth';
import {
  validateAuthLogin,
  validateAuthRegister,
} from '../middlewares/request-validation';

const router = Router();

router.post('/login', validateAuthLogin, login);
router.post('/register', validateAuthRegister, register);
router.get('/token', refreshAccessToken);
router.get('/logout', auth, logout);
router.get('/user', auth, getCurrentUser);

export default router;
