import express from 'express';
import APIController from '../../controllers/api/apiController.js';

const router = express.Router();

router.get('/hi', APIController.hi);

export default router;