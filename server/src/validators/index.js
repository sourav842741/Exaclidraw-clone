import Joi from 'joi';

export const createTeamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().max(500).allow(''),
});

export const updateTeamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().max(500),
  avatar: Joi.string().allow(''),
  settings: Joi.object({
    allowGuestLinks: Joi.boolean(),
    requireInvite: Joi.boolean(),
  }),
});

export const inviteSchema = Joi.object({
  emails: Joi.array().items(Joi.string().email()).min(1).max(50).required(),
  role: Joi.string().valid('admin', 'editor', 'viewer').default('editor'),
});

export const memberRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'editor', 'viewer').required(),
});

export const aiDiagramSchema = Joi.object({
  prompt: Joi.string().trim().min(3).max(2000).required(),
  type: Joi.string().allow(''),
});

export const mermaidSchema = Joi.object({
  mermaid: Joi.string().trim().min(5).required(),
});

export const mindmapSchema = Joi.object({
  topic: Joi.string().trim().min(2).max(500).required(),
});

export const codeSchema = Joi.object({
  code: Joi.string().min(10).max(20000).required(),
  language: Joi.string().allow(''),
});

export const transcriptSchema = Joi.object({
  transcript: Joi.string().min(20).max(30000).required(),
});

export const brainstormSchema = Joi.object({
  topic: Joi.string().trim().min(2).max(500).required(),
});

export const voiceSchema = Joi.object({
  text: Joi.string().trim().min(3).max(2000).required(),
});

export const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().max(1000).allow(''),
  team: Joi.string().allow(null),
  color: Joi.string().allow(''),
  startDate: Joi.date().allow(null),
  dueDate: Joi.date().allow(null),
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  description: Joi.string().max(1000),
  status: Joi.string().valid('planning', 'active', 'paused', 'done', 'archived'),
  color: Joi.string(),
  startDate: Joi.date().allow(null),
  dueDate: Joi.date().allow(null),
});

export const columnSchema = Joi.object({
  title: Joi.string().trim().min(1).max(60).required(),
  color: Joi.string().allow(''),
});

export const renameColumnSchema = Joi.object({
  title: Joi.string().trim().min(1).max(60),
  color: Joi.string().allow(''),
});

export const taskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300).required(),
  columnId: Joi.string().allow(''),
  description: Joi.string().max(5000).allow(''),
  labels: Joi.array().items(Joi.string().max(40)),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  dueDate: Joi.date().allow(null),
  assignee: Joi.string().allow(null),
});

export const moveTaskSchema = Joi.object({
  columnId: Joi.string().required(),
  order: Joi.number(),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300),
  description: Joi.string().max(5000),
  columnId: Joi.string(),
  labels: Joi.array().items(Joi.string().max(40)),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  dueDate: Joi.date().allow(null),
  assignee: Joi.string().allow(null),
  subtasks: Joi.object({
    id: Joi.string().required(),
    done: Joi.boolean().required(),
  }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80),
  settings: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'system'),
    defaultTool: Joi.string(),
    reduceMotion: Joi.boolean(),
  }),
});

export const passwordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(72).required(),
});

export const emailSchema = Joi.object({
  email: Joi.string().email().required(),
});
