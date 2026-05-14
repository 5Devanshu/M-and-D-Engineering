const Joi = require('joi');

const createMaterialSchema = Joi.object({
  name: Joi.string().required().max(100).messages({
    'string.empty': 'Material name is required',
    'string.max': 'Material name must not exceed 100 characters',
  }),
  unit: Joi.string().required().valid('kgs', 'nos', 'ltrs', 'mtrs', 'pcs').messages({
    'string.empty': 'Unit is required',
    'any.only': 'Unit must be one of: kgs, nos, ltrs, mtrs, pcs',
  }),
  default_rate: Joi.number().positive().required().messages({
    'number.base': 'Default rate must be a number',
    'number.positive': 'Default rate must be positive',
  }),
  hsn_code: Joi.string().optional().max(8),
  gst_rate: Joi.number().optional().min(0).max(100),
});

const updateRateSchema = Joi.object({
  new_rate: Joi.number().positive().required().messages({
    'number.positive': 'New rate must be positive',
  }),
  effective_from: Joi.date().optional(),
  reason: Joi.string().optional().max(255),
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.body = value;
    next();
  };
};

module.exports = { createMaterialSchema, updateRateSchema, validate };
