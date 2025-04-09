import Joi from 'joi';
import AppError from '../utils/appError.js';

const groupSchema = Joi.object({
  group_id: Joi.string().optional(),
  sourceGroup_id: Joi.string().optional(),
  targetGroup_id: Joi.string().optional(),
  group_icon: Joi.string().optional(),
  group_title: Joi.string().optional(),
  items: Joi.array().optional(),
}).unknown();

const validateGroupDataTypes = (req, res, next) => {
  const { error } = groupSchema.validate(req.body);

  if (error) {
    throw new AppError(400, error.message);
  }

  next();
};

export { groupSchema, validateGroupDataTypes };
