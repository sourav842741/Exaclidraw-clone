import Joi from 'joi';

const boardType = Joi.string().valid(
  'whiteboard', 'flowchart', 'architecture', 'mindmap', 'er',
  'sequence', 'wireframe', 'mockup', 'uml', 'network',
  'organization', 'api', 'database', 'decisiontree',
  'userjourney', 'sitemap', 'businessmodel', 'kanban',
  'slides', 'documentation', 'canvas',
);

export const createBoardSchema = Joi.object({
  name: Joi.string().trim().max(120).allow(''),
  type: boardType.default('whiteboard'),
  team: Joi.string().allow(null),
  description: Joi.string().max(500).allow(''),
});

export const updateBoardSchema = Joi.object({
  name: Joi.string().trim().max(120),
  description: Joi.string().max(500),
  type: boardType,
  background: Joi.string(),
  isPublic: Joi.boolean(),
  password: Joi.string().allow(''),
  settings: Joi.object({
    allowComments: Joi.boolean(),
    allowChat: Joi.boolean(),
    autoSave: Joi.boolean(),
  }),
  state: Joi.object({
    viewport: Joi.object(),
    gridEnabled: Joi.boolean(),
    snapToGrid: Joi.boolean(),
    darkMode: Joi.boolean(),
  }),
  thumbnail: Joi.string().allow(''),
});

export const saveElementsSchema = Joi.object({
  elements: Joi.array().default([]),
  state: Joi.object().allow(null),
  version: Joi.alternatives().try(Joi.number(), Joi.date()),
});

export const commentSchema = Joi.object({
  body: Joi.string().trim().max(5000).required(),
  x: Joi.number(),
  y: Joi.number(),
  elementId: Joi.string().allow(null),
});

export const replySchema = Joi.object({
  body: Joi.string().trim().max(5000).required(),
});

export const resolveSchema = Joi.object({
  resolved: Joi.boolean().required(),
});
