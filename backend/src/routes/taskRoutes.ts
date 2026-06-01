import { Router } from 'express';
import taskController from '../controllers/taskController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Task routes
router.get('/jira', authenticate, taskController.getJiraTasks);
router.get('/stats', authenticate, taskController.getTaskStats);
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

export default router;