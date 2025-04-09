import { Item } from '../models/item.js';
import errorResponse from '../utils/errorResponse.js';

const searchItemsInGroups = async (req, res, next) => {
  try {
    const { keyword, itemTypes } = req.query;
    const { user_id } = req.user;

    if (keyword === undefined || keyword === '') {
      return errorResponse(res, 400, 'Invalid Query Parameters');
    }

    const itemTypeOptions = itemTypes ? itemTypes.split(',').map(Number) : [0, 1, 2];
    const searchResults = await Item.searchItemsInGroups(keyword, itemTypeOptions, user_id);

    return res.status(200).json(searchResults);
  } catch (error) {
    next(error);
  }
};

const moveItem = async (req, res, next) => {
  try {
    const { group_id, item_id } = req.params;

    // Check that no extra fields in req.body
    const allowedFields = ['targetGroup_id', 'targetItem_position'];
    for (const key in req.body) {
      if (!allowedFields.includes(key)) {
        return errorResponse(res, 400, `${key} is not allowed in request body`);
      }
    }

    const { targetGroup_id, targetItem_position } = req.body;
    const { user_id } = req.user;

    if (targetGroup_id === undefined || targetItem_position === undefined) {
      return errorResponse(res, 400, 'Invalid request body');
    }

    const moveResult = await Item.moveItem(group_id, targetGroup_id, item_id, targetItem_position, user_id);
    if (moveResult.success) {
      return res.status(200).json({ status: 'success', message: moveResult.message, item_id });
    }
    return errorResponse(res, 400, moveResult.error);
  } catch (error) {
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const { group_id, item_id } = req.params;
    const { user_id } = req.user;
    const deletedItem = await Item.deleteItem(group_id, item_id, user_id);
    if (!deletedItem) {
      return errorResponse(res, 404, 'Group or item not found');
    }
    return res.status(204).header('X-Message', 'Item removed from group successfully').send();
  } catch (error) {
    next(error);
  }
};

export {
  moveItem,
  deleteItem,
  searchItemsInGroups,
};
