// src/lib/ai/getProvider.ts
import { AIProvider, OpenAIProvider, FallbackAIProvider } from '@/lib/ai/provider';

/**
 * Returns an AIProvider instance based on environment configuration.
 * If OPENAI_API_KEY is defined server‑side, the real OpenAIProvider is used.
 * Otherwise the deterministic FallbackAIProvider is used.
 */
export function getAIProvider(): AIProvider {
  return process.env.OPENAI_API_KEY ? new OpenAIProvider() : new FallbackAIProvider();
}
