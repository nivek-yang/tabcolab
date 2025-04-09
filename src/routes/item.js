import { Router } from 'express';
import { searchItemsInGroups, moveItem, deleteItem } from '../controllers/item.js';
import { validateItemDataTypes } from '../validations/item.js';
import { validateGroupDataTypes } from '../validations/group.js';

const router = Router();

router.get('/items/search', searchItemsInGroups);
router.patch('/:group_id/items/:item_id', validateGroupDataTypes, validateItemDataTypes, moveItem);
router.delete('/:group_id/items/:item_id', deleteItem);

export default router;
