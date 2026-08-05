import { env } from '../config/env.js';
import { InternalError } from '../utils/errors.js';

async function openaiGenerate(system, user) {
  const { OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: env.ai.openaiKey });
  const res = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return res.choices[0].message.content;
}

async function geminiGenerate(system, user) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(env.ai.geminiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  const result = await model.generateContent([system, user]);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}

export async function generate(prompt) {
  if (env.ai.provider === 'gemini' && env.ai.geminiKey) {
    return geminiGenerate(prompt.system, prompt.user);
  }
  if (env.ai.openaiKey) {
    return openaiGenerate(prompt.system, prompt.user);
  }
  throw InternalError('AI provider is not configured');
}

export async function generateJSON(prompt) {
  const raw = await generate(prompt);
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw InternalError('AI returned invalid JSON');
  }
}
