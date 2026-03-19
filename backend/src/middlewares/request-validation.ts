import { celebrate, Joi, Segments } from 'celebrate';

const objectId = Joi.string().hex().length(24);

export const validateCreateProduct = celebrate({
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(2).max(30).required(),
    image: Joi.object({
      fileName: Joi.string().required(),
      originalName: Joi.string().required(),
    }).required(),
    category: Joi.string().required(),
    description: Joi.string().optional(),
    price: Joi.number().allow(null).optional(),
  }).required(),
});

export const validateCreateOrder = celebrate({
  [Segments.BODY]: Joi.object({
    payment: Joi.string().valid('card', 'online', 'cash').required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
    total: Joi.alternatives().try(
      Joi.number(),
      Joi.string().pattern(/^-?\d+(\.\d+)?$/),
    ).required(),
    items: Joi.array().items(objectId.required()).min(1).required(),
  }).required(),
});

export const validateAuthLogin = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }).required(),
});

export const validateAuthRegister = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string().min(2).max(30).optional(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }).required(),
});
