import { Router } from 'express';
import { AuthController } from '../controllers/implementation/authController.js';
import { AuthService } from '../services/implementation/authService.js';
import { AuthRepository } from '../repository/implementation/authRepository.js';

const router = Router();

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

// Endpoint for user registration
router.post('/register', authController.register);

// Endpoint for user login
router.post('/login', authController.login);

export default router;
