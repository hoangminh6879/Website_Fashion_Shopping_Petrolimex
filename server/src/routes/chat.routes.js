import express from 'express';
import { getMessages, getConversations, markAsRead } from '../controllers/chat.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // All chat routes need authentication

router.get('/conversations', getConversations);
router.get('/:otherUserId', getMessages);
router.put('/read/:otherUserId', markAsRead);

export default router;
