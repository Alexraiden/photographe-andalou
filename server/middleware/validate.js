import { body, param, validationResult } from 'express-validator';

export function checkValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters'),
  checkValidation,
];

export const validateCollection = [
  body('slug')
    .matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .withMessage('Slug must be lowercase alphanumeric with hyphens')
    .isLength({ max: 100 }),
  body('name_es').trim().isLength({ min: 1, max: 200 }),
  body('name_en').trim().isLength({ min: 1, max: 200 }),
  body('name_fr').trim().isLength({ min: 1, max: 200 }),
  body('description_es').optional().trim().isLength({ max: 1000 }),
  body('description_en').optional().trim().isLength({ max: 1000 }),
  body('description_fr').optional().trim().isLength({ max: 1000 }),
  body('layout').optional().isIn(['cinematic', 'grid', 'masonry', 'horizontal-scroll']),
  body('featured').optional().isBoolean(),
  body('sort_order').optional().isInt({ min: 0, max: 1000 }),
  body('location').optional().trim().isLength({ max: 200 }),
  body('year_range').optional().trim().isLength({ max: 20 }),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().trim().isLength({ max: 50 }),
  checkValidation,
];

export const validateCollectionUpdate = [
  body('slug')
    .optional()
    .matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .withMessage('Slug must be lowercase alphanumeric with hyphens')
    .isLength({ max: 100 }),
  body('name_es').optional().trim().isLength({ min: 1, max: 200 }),
  body('name_en').optional().trim().isLength({ min: 1, max: 200 }),
  body('name_fr').optional().trim().isLength({ min: 1, max: 200 }),
  body('description_es').optional().trim().isLength({ max: 1000 }),
  body('description_en').optional().trim().isLength({ max: 1000 }),
  body('description_fr').optional().trim().isLength({ max: 1000 }),
  body('layout').optional().isIn(['cinematic', 'grid', 'masonry', 'horizontal-scroll']),
  body('featured').optional().isBoolean(),
  body('sort_order').optional().isInt({ min: 0, max: 1000 }),
  body('location').optional().trim().isLength({ max: 200 }),
  body('year_range').optional().trim().isLength({ max: 20 }),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().trim().isLength({ max: 50 }),
  checkValidation,
];

export const validateImageMeta = [
  body('title_es').optional().trim().isLength({ max: 200 }),
  body('title_en').optional().trim().isLength({ max: 200 }),
  body('title_fr').optional().trim().isLength({ max: 200 }),
  body('description_es').optional().trim().isLength({ max: 500 }),
  body('description_en').optional().trim().isLength({ max: 500 }),
  body('description_fr').optional().trim().isLength({ max: 500 }),
  body('camera').optional().trim().isLength({ max: 100 }),
  body('lens').optional().trim().isLength({ max: 100 }),
  body('settings').optional().trim().isLength({ max: 100 }),
  body('location').optional().trim().isLength({ max: 200 }),
  body('photo_date').optional().isISO8601(),
  body('tags').optional().custom((v) => {
    if (typeof v === 'string') JSON.parse(v); // will throw if invalid
    return true;
  }),
  body('featured').optional().isBoolean(),
  checkValidation,
];

export const validateId = [
  param('id').matches(/^[a-z0-9]+(-[a-z0-9]+)*$/).isLength({ max: 100 }),
  checkValidation,
];
