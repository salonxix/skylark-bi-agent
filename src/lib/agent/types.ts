import { BIResult, DataQualityReport } from '@/lib/bi/types';
import { z } from 'zod';
import { QuerySpecSchema, ClarificationRequestSchema } from './query-spec';

export type QuerySpec = z.infer<typeof QuerySpecSchema>;
export type ClarificationRequest = z.infer<typeof ClarificationRequestSchema>;

export type PlannerResult =
  | { type: 'query'; querySpec: QuerySpec }
  | { type: 'clarification'; clarification: ClarificationRequest };

export interface AgentSuccessResponse {
  success: true;
  answer?: string;
  querySpec?: QuerySpec;
  results?: BIResult[];
  dataQuality?: DataQualityReport[];
  clarification?: ClarificationRequest | null;
}

export interface AgentErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type AgentResponse = AgentSuccessResponse | AgentErrorResponse;

export interface AgentRequestPayload {
  message: string;
}

export interface AIProvider {
  generateJson<T>(prompt: string, systemPrompt?: string): Promise<T>;
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
}
