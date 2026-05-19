const Joi = require('joi');

/**
 * Bills Validation Schemas
 */

const createBillSchema = Joi.object({
  customer_id: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
  }),
  items: Joi.array()
    .items(
      Joi.object({
        particular_id: Joi.string().required(),
        quantity: Joi.number().positive().required(),
        rate: Joi.number().positive().required(),
        amount: Joi.number().positive().required(),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item is required',
    }),
  total_amount: Joi.number().positive().optional(),
  description: Joi.string().max(500).optional(),
  due_date: Joi.date().iso().optional(),
  notes: Joi.string().max(1000).optional(),
});

const updateBillSchema = Joi.object({
  customer_id: Joi.string().optional(),
  items: Joi.array()
    .items(
      Joi.object({
        particular_id: Joi.string().required(),
        quantity: Joi.number().positive().required(),
        rate: Joi.number().positive().required(),
        amount: Joi.number().positive().required(),
      })
    )
    .optional(),
  total_amount: Joi.number().positive().optional(),
  description: Joi.string().max(500).optional(),
  due_date: Joi.date().iso().optional(),
  notes: Joi.string().max(1000).optional(),
});

const syncMastersSchema = Joi.object({
  particulars: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        name: Joi.string().required(),
        hsn_code: Joi.string().optional(),
        sac_code: Joi.string().optional(),
        description: Joi.string().optional(),
        unit: Joi.string().optional(),
        tax_applicable: Joi.boolean().optional(),
        tax_rate: Joi.number().optional(),
      })
    )
    .required(),
});

/**
 * Validation middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = {};
      error.details.forEach(detail => {
        errors[detail.path.join('.')] = detail.message;
      });
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req.validatedData = value;
    next();
  };
};

module.exports = {
  createBillSchema,
  updateBillSchema,
  syncMastersSchema,
  validate,
};
