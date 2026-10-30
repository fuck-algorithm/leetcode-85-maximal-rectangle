import { Prism } from 'prism-react-renderer';

type SupportedCodeLanguage = 'java' | 'python' | 'go' | 'javascript';

let loadingLanguages: Promise<void> | undefined;

export function loadAdditionalLanguages(): Promise<void> {
  if (!loadingLanguages) {
    (globalThis as typeof globalThis & { Prism?: typeof Prism }).Prism = Prism;
    loadingLanguages = Promise.all([
      import('prismjs/components/prism-java'),
      import('prismjs/components/prism-go'),
    ]).then(() => undefined);
  }
  return loadingLanguages;
}

export function tokenizeCode(code: string, language: SupportedCodeLanguage) {
  const grammar = Prism.languages[language];
  return grammar ? Prism.tokenize(code, grammar) : [code];
}
