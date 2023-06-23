import express from 'express';
import APIController from '../../controllers/api/apiController.js';

const router = express.Router();

router.get('/hi', APIController.hi);

router.post('/addMemo', APIController.addMemo);
router.post('/markMemo', APIController.markMemo);
router.post('/deleteMemo', APIController.deleteMemo);

export default router;