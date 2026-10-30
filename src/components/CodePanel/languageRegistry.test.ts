// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Prism } from 'prism-react-renderer';
import { loadAdditionalLanguages } from './languageRegistry';

describe('code language grammar', () => {
  it('provides Java grammar so Java syntax is tokenized instead of plain text', async () => {
    await loadAdditionalLanguages();
    expect(Prism.languages.java).toBeDefined();

    const tokens = Prism.tokenize('public int area = 6;', Prism.languages.java!);
    expect(tokens.some(token => typeof token !== 'string' && token.type === 'keyword')).toBe(true);
    expect(tokens.some(token => typeof token !== 'string' && token.type === 'number')).toBe(true);
  });
});
