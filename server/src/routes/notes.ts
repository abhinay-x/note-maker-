import { Router } from 'express';
import { NotesController } from '../controllers/notesController';
import { authenticateToken } from '../middleware/auth';
import { validateNote } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken as any);

// Notes CRUD routes
router.get('/', (req, res) => NotesController.getNotes(req as any, res));
router.get('/:id', (req, res) => NotesController.getNoteById(req as any, res));
router.post('/', validateNote, (req, res) => NotesController.createNote(req as any, res));
router.put('/:id', validateNote, (req, res) => NotesController.updateNote(req as any, res));
router.delete('/:id', (req, res) => NotesController.deleteNote(req as any, res));

export default router;
