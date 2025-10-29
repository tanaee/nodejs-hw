import { Joi, celebrate, Segments } from 'celebrate';
import mongoose from 'mongoose';
import { TAGS } from '../constants/tags.js';

const isValidObjectId = (value, helpers) => {
  if (!mongoose.isValidObjectId(value)) {
    return helpers.error('Invalid id format!');
  }
  return value;
};

export const getAllNotesSchema = celebrate({
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(5).max(20).default(10),
    tag: Joi.string()
      .valid(...TAGS)
      .optional(),
    search: Joi.string().allow('').optional(),
  }),
});

export const noteIdSchema = celebrate({
  [Segments.PARAMS]: Joi.object({
    noteId: Joi.string().custom(isValidObjectId).required(),
  }),
});

export const createNoteSchema = celebrate({
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(1).required(),
    content: Joi.string().allow('').optional(),
    tag: Joi.string()
      .valid(...TAGS)
      .optional(),
  }),
});

export const updateNoteSchema = celebrate({
  [Segments.PARAMS]: Joi.object({
    noteId: Joi.string().custom(isValidObjectId).required(),
  }),
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(1).optional(),
    content: Joi.string().allow('').optional(),
    tag: Joi.string()
      .valid(...TAGS)
      .optional(),
  }).min(1),
});
