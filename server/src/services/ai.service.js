import { generateJSON } from '../ai/providers.js';
import { userRepository } from '../repositories/user.repo.js';
import { boardRepository } from '../repositories/board.repo.js';
import { Forbidden, BadRequest } from '../utils/errors.js';
import { createLocalDiagram } from '../ai/localDiagram.js';

const ELEMENT_SCHEMA = `
  Each element has: id (string), type (one of: rectangle, ellipse, diamond, triangle, arrow, line, text, image, sticky), x, y (numbers), width, height (numbers), rotation (number, degrees), points (array of [x,y] for arrow/line), text (string), fill (hex color), stroke (hex color), strokeWidth (number), borderRadius (number), fontSize (number), fontWeight, fontFamily (string), locked (bool), backgroundColor, textAlign.
  Coordinates should form a top-down, left-to-right layout starting near x=0,y=0.
`;

const DIAGRAM_SYSTEM = (purpose) => `
  You are an expert diagram designer for VectorShare AI. Convert the user's request into a JSON object.
  Return ONLY JSON with shape: { "title": string, "description": string, "elements": [ ... ], "connections": [ { "from": elementId, "to": elementId, "label": string } ] }.
  ${ELEMENT_SCHEMA}
  Purpose: ${purpose}.
  Use a clean color palette: node fills #6366f1, #10b981, #f59e0b, #ef4444, #06b6d4, #8b5cf6; text #1f2937; lines #475569.
  Use rectangle nodes for components, diamond for decisions, arrow/line for connections, sticky for annotations.
  Output valid JSON only — no markdown fences.
`;

const MERMAID_SYSTEM = `
  You are a mermaid.js expert. Convert the user's request into a diagram.
  Return ONLY JSON with shape: { "mermaid": string, "explanation": string }.
  Choose the best diagram type (flowchart, sequenceDiagram, mindmap, erDiagram, classDiagram, gantt, journey, graph).
  Output valid JSON only — no markdown fences.
`;

const MINDMAP_SYSTEM = `
  You are a mind-mapping expert. Convert the user's topic into a mind map.
  Return ONLY JSON with shape: { "topic": string, "branches": [ { "label": string, "children": [ string ] } ] }.
  Make branches concise (max 3 words), 4-7 main branches, 2-4 children each.
  Output valid JSON only.
`;

const CODE_ARCH_SYSTEM = `
  You are a software architect. Analyze the provided code and produce an architecture diagram.
  Return ONLY JSON with shape: { "title": string, "layers": [ string ], "components": [ { "name": string, "layer": string, "description": string } ], "connections": [ { "from": string, "to": string, "label": string } ], "notes": [ string ] }.
  Identify services, controllers, data stores, external integrations, and flows.
  Output valid JSON only.
`;

const MEETING_SYSTEM = `
  You are a meeting summarizer. Analyze the transcript.
  Return ONLY JSON with shape: { "summary": string (150-200 words), "keyPoints": [ string ], "actionItems": [ { "task": string, "assignee": string, "due": string } ], "decisions": [ string ], "risks": [ string ] }.
  Output valid JSON only.
`;

export class AIService {
  async assertQuota(user) {
    const now = new Date();
    const reset = user.aiUsage?.resetAt ? new Date(user.aiUsage.resetAt) : new Date();
    if (reset < now) {
      await userRepository.updateById(user._id, {
        'aiUsage.requests': 0,
        'aiUsage.resetAt': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      return;
    }
    if (user.aiUsage?.requests >= user.aiUsage?.quota) {
      throw Forbidden('AI usage quota exceeded. Upgrade your plan.');
    }
  }

  async useQuota(userId) {
    return userRepository.incrementAiUsage(userId);
  }

  async diagramFromPrompt(userId, { prompt, type = 'flowchart' }) {
    const user = await userRepository.findById(userId);
    await this.assertQuota(user);
    let result;
    try {
      result = await generateJSON({
        system: DIAGRAM_SYSTEM(type),
        user: `Create a ${type} diagram. Request: ${prompt}`,
      });
    } catch {
      result = createLocalDiagram(prompt, type);
    }
    await this.useQuota(userId);
    return result;
  }

  async mermaidToDiagram(userId, { mermaid }) {
    const user = await userRepository.findById(userId);
    await this.assertQuota(user);
    let result;
    try {
      result = await generateJSON({
        system: MERMAID_SYSTEM,
        user: mermaid,
      });
    } catch {
      result = { mermaid, explanation: 'Mermaid code provided.' };
    }
    await this.useQuota(userId);
    return result;
  }

  async mindmap(userId, { topic }) {
    const user = await userRepository.findById(userId);
    await this.assertQuota(user);
    let result;
    try {
      result = await generateJSON({
        system: MINDMAP_SYSTEM,
        user: topic,
      });
    } catch {
      result = createLocalDiagram(topic, 'mindmap');
    }
    await this.useQuota(userId);
    return result;
  }

  async codeToArchitecture(userId, { code, language }) {
    const user = await userRepository.findById(userId);
    await this.assertQuota(user);
    let result;
    try {
      result = await generateJSON({
        system: CODE_ARCH_SYSTEM,
        user: `Language: ${language || 'unknown'}\n\n${code.slice(0, 20000)}`,
      });
    } catch {
      result = createLocalDiagram('Architecture Analysis', 'architecture');
    }
    await this.useQuota(userId);
    return result;
  }

  async meetingAssistant(userId, { transcript }) {
    const user = await userRepository.findById(userId);
    await this.assertQuota(user);
    let result;
    try {
      result = await generateJSON({
        system: MEETING_SYSTEM,
        user: transcript.slice(0, 30000),
      });
    } catch {
      result = {
        summary: 'AI summary unavailable — manual review required.',
        keyPoints: ['Unable to generate summary automatically.'],
        actionItems: [],
        decisions: [],
        risks: [],
      };
    }
    await this.useQuota(userId);
    return result;
  }

  async brainstormingNotes(userId, { topic }) {
    const user = await userRepository.findById(userId);
    await this.assertQuota(user);
    let result;
    try {
      result = await generateJSON({
        system: 'You are a brainstorming facilitator. Return ONLY JSON: { "ideas": [ { "title": string, "description": string } ] } — 8-12 creative, diverse ideas.',
        user: topic,
      });
    } catch {
      result = { ideas: [{ title: topic, description: 'Brainstorming ideas.' }] };
    }
    await this.useQuota(userId);
    return result;
  }

  async voiceToDiagram(userId, { text }) {
    return this.diagramFromPrompt(userId, { prompt: text, type: 'flowchart' });
  }

  async imageToDiagram(userId, file) {
    if (!file) throw BadRequest('No image uploaded');
    const user = await userRepository.findById(userId);
    await this.assertQuota(user);
    await this.useQuota(userId);
    return {
      note: 'Image uploaded. Use the local diagram editor to trace or let the client-side AI describe it.',
      image: file.path,
    };
  }

  async createBoardFromAI(userId, { name, type, result }) {
    const board = await boardRepository.create({
      name: name || result.title || 'AI Generated',
      type,
      owner: userId,
      collaborators: [{ user: userId, role: 'owner' }],
      elements: result.elements || [],
    });
    return board;
  }
}

export const aiService = new AIService();
