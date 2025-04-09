import { Router } from 'express';
import { validateItemDataTypes } from '../validations/item.js';
import { addTab, updateTab, addNote, updateNote, updateTodo } from '../controllers/specItem.js';

const router = Router();

router.post('/:group_id/tabs', validateItemDataTypes, addTab);
router.patch('/:group_id/tabs/:item_id', validateItemDataTypes, updateTab);
router.post('/:group_id/notes', validateItemDataTypes, addNote);
router.patch('/:group_id/notes/:item_id', validateItemDataTypes, updateNote);
router.patch('/:group_id/todos/:item_id', validateItemDataTypes, updateTodo);

export default router;
