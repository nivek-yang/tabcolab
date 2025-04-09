import Joi from 'joi';
import AppError from '../utils/appError.js';

const itemSchema = Joi.object({
  item_id: Joi.string().optional(),
  targetItem_position: Joi.number().optional(),
  item_type: Joi.number().valid(0, 1, 2).optional(),
  browserTab_favIconURL: Joi.string().optional(),
  browserTab_title: Joi.string().optional(),
  browserTab_url: Joi.string().optional(),
  browserTab_id: Joi.number().optional(),
  browserTab_index: Joi.number().optional(),
  browserTab_active: Joi.boolean().optional(),
  browserTab_status: Joi.string().optional(),
  windowId: Joi.number().optional(),
  note_content: Joi.string().optional().allow(''),
  note_bgColor: Joi.string().optional(),
  doneStatus: Joi.boolean().optional(),
}).unknown();

const validateItemDataTypes = (req, res, next) => {
  const { error } = itemSchema.validate(req.body);

  if (error) {
    throw new AppError(400, error.message);
  }

  next();
};

export { itemSchema, validateItemDataTypes };
