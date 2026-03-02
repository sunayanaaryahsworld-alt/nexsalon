import express from 'express';
import { getSystemMetrics } from '../controllers/systemController.js';

const router = express.Router();

router.get('/metrics', getSystemMetrics);

export default router; // Use this instead of module.exports