import { Router } from 'express';
import { validateRegisterandLoginDataTypes, validateUserInfoUpdateDataTypes } from '../validations/user.js';
import { register, login, getAllUsers, getUserInfo, updateUserInfo, deleteUser } from '../controllers/user.js';
import { authenticateJwt, authenticateAdmin } from '../middlewares/authenticate.js';

const router = Router();

// local auth
router.post('/users/register', validateRegisterandLoginDataTypes, register);
router.post('/users/login', validateRegisterandLoginDataTypes, login);

// JWT authentication middleware
router.use(authenticateJwt);

router.get('/users', authenticateAdmin, getAllUsers);
router.get('/user', getUserInfo);
router.patch('/user', validateUserInfoUpdateDataTypes, updateUserInfo);
router.delete('/user', deleteUser);

export default router;
