import { Router } from 'express';
import { getGroups, createGroup, updateGroup, deleteGroup } from '../controllers/group.js';
import { validateGroupDataTypes } from '../validations/group.js';
import { validateItemDataTypes } from '../validations/item.js';
import { validatePositionDataTypes } from '../validations/position.js';
import validateDataTypes from '../validations/data.js';

const router = Router();

router.get('/', getGroups);
router.post('/', validateDataTypes, createGroup);
router.patch('/:group_id', validateDataTypes, updateGroup);
router.delete('/:group_id', deleteGroup);

export default router;
