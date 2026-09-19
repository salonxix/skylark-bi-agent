import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it('should return a 200 OK status with service metadata', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      status: string;
      service: string;
      timestamp: string;
    };

    expect(body.status).toBe('ok');
    expect(body.service).toBe('skylark-bi-agent');
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  });
});
