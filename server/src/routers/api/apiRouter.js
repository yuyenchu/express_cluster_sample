import express from 'express';
import APIController from '../../controllers/api/apiController.js';

import { validateJWT } from '../../middlware/jwtAuth.js'

const router = express.Router();

router.get('/hi', APIController.hi);

router.use(validateJWT);
router.post('/addMemo', APIController.addMemo);
router.post('/markMemo', APIController.markMemo);
router.post('/deleteMemo', APIController.deleteMemo);

export default router;