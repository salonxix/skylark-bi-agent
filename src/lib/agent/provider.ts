import { AIProvider } from './types';

export interface AIProviderConfig {
  apiKey?: string;
  modelName?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;

export class DefaultAIProvider implements AIProvider {
  private apiKey: string;
  private modelName: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config?: AIProviderConfig) {
    this.apiKey = config?.apiKey ?? process.env.AI_API_KEY?.trim() ?? '';
    this.timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const isSkKey = this.apiKey.startsWith('sk-');

    if (config?.baseUrl || process.env.AI_BASE_URL) {
      this.baseUrl = config?.baseUrl ?? process.env.AI_BASE_URL?.trim() ?? '';
    } else if (isSkKey) {
      // Default to OpenAI-compatible endpoint when an sk- key is provided
      this.baseUrl = 'https://api.openai.com/v1';
    } else {
      this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    }

    if (config?.modelName || process.env.AI_MODEL) {
      this.modelName = config?.modelName ?? process.env.AI_MODEL?.trim() ?? '';
    } else if (isSkKey) {
      this.modelName = 'gpt-4o-mini';
    } else {
      this.modelName = 'gemini-1.5-flash';
    }
  }

  async generateJson<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const rawText = await this.generateText(prompt, systemPrompt, true);
    try {
      // Remove any markdown fencing if present: ```json ... ```
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      return JSON.parse(cleaned) as T;
    } catch (err) {
      throw new Error(`Failed to parse AI response as JSON: ${err instanceof Error ? err.message : 'Invalid JSON'}. Raw output was: ${rawText.slice(0, 100)}...`);
    }
  }

  async generateText(prompt: string, systemPrompt?: string, jsonMode = false): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Missing AI_API_KEY environment variable. Please configure it in .env.local');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // If using Gemini endpoint
      const isGemini = this.baseUrl.includes('googleapis.com');
      const url = isGemini
        ? `${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`
        : `${this.baseUrl.replace(/\/+$/, '')}/chat/completions`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      let body: unknown;

      if (isGemini) {
        body = {
          contents: [
            ...(systemPrompt ? [{ role: 'user', parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}` }] }] : []),
            { role: 'user', parts: [{ text: prompt }] },
          ],
          generationConfig: {
            temperature: 0.1,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
          },
        };
      } else {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        body = {
          model: this.modelName,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errDetails = '';
        try {
          const errJson = await res.json();
          errDetails = errJson?.error?.message || JSON.stringify(errJson);
        } catch {
          errDetails = await res.text().catch(() => '');
        }
        throw new Error(`AI Provider request failed with HTTP ${res.status} ${res.statusText}${errDetails ? `: ${errDetails}` : ''}`);
      }

      const data = await res.json();

      if (isGemini) {
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty response content received from Gemini model');
        return text;
      } else {
        const text = data?.choices?.[0]?.message?.content;
        if (!text) throw new Error('Empty response content received from AI provider');
        return text;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`AI Provider request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
