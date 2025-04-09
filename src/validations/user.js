import Joi from 'joi';
import AppError from '../utils/appError.js';

const registerSchema = Joi.object({
  email: Joi.string().min(6).max(50).required()
    .email(),
  password: Joi.string().min(6).max(255).required(),
});

const updateSchema = Joi.object({
  email: Joi.string().min(6).max(50).email(),
  password: Joi.string().min(6).max(255),
}).or('email', 'password');

const validateRegisterandLoginDataTypes = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);

  if (error) {
    throw new AppError(400, error.message);
  }

  next();
};

const validateUserInfoUpdateDataTypes = (req, res, next) => {
  const { error } = updateSchema.validate(req.body);

  if (error) {
    throw new AppError(400, error.message);
  }

  next();
};

export { validateRegisterandLoginDataTypes, validateUserInfoUpdateDataTypes };
