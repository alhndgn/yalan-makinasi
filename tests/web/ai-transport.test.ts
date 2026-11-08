import { describe, it, expect } from 'vitest';
import { endpointFor, isNativeApp } from '../../src/web/src/lib/aiTransport.ts';

describe('AI taşıma katmanı', () => {
  it('native uygulamada sağlayıcıya doğrudan gider', () => {
    expect(endpointFor('https://opencode.ai/zen/go/v1', true)).toBe('https://opencode.ai/zen/go/v1/chat/completions');
  });

  it('web modunda kendi proxy’mizi kullanır', () => {
    expect(endpointFor('https://opencode.ai/zen/go/v1', false)).toBe('/api/ai/chat');
  });

  it('tarayıcıda native sayılmaz', () => {
    expect(isNativeApp()).toBe(false);
  });
});
