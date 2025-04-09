import Joi from 'joi';
import { groupSchema } from './group.js';
import { itemSchema } from './item.js';
import { positionSchema } from './position.js';
import AppError from '../utils/appError.js';

const validateDataTypes = (req, res, next) => {
  const schemas = [groupSchema, itemSchema, positionSchema];

  for (const schema of schemas) {
    const { error } = schema.unknown().validate(req.body);
    if (error) {
      throw new AppError(400, error.message);
    }
  }

  next();
};

export default validateDataTypes;
