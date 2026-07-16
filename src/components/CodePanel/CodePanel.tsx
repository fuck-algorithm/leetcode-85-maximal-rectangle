import { useEffect, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Language, AlgorithmStep, AlgorithmId } from '../../types';
import { algorithmCodeData } from '../../algorithm/codeData';
import { saveLanguage, getLanguage } from '../../utils/storage';
import { DebugPanel } from './DebugPanel';
import styles from './CodePanel.module.css';

interface CodePanelProps {
  currentStep: AlgorithmStep | null;
  algorithmId: AlgorithmId;
}

const LANGUAGE_LABELS: Record<Language, string> = {
  java: 'Java',
  python: 'Python',
  golang: 'Go',
  javascript: 'JavaScript',
};

const PRISM_LANGUAGES: Record<Language, string> = {
  java: 'java',
  python: 'python',
  golang: 'go',
  javascript: 'javascript',
};

export function CodePanel({ currentStep, algorithmId }: CodePanelProps) {
  const [language, setLanguage] = useState<Language>('java');

  useEffect(() => {
    getLanguage().then(setLanguage);
  }, []);

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    await saveLanguage(lang);
  };

  const codeBlock = algorithmCodeData[algorithmId][language];
  const highlightLines = currentStep?.codeLines[language] || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>算法代码</span>
        <div className={styles.tabs}>
          {(Object.keys(LANGUAGE_LABELS) as Language[]).map(lang => (
            <button
              key={lang}
              className={`${styles.tab} ${language === lang ? styles.active : ''}`}
              onClick={() => handleLanguageChange(lang)}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.codeWrapper}>
        <Highlight
          theme={themes.vsDark}
          code={codeBlock.code}
          language={PRISM_LANGUAGES[language]}
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre className={styles.pre} style={style}>
              {tokens.map((line, i) => {
                const lineNum = i + 1;
                const isHighlighted = highlightLines.includes(lineNum);

                return (
                  <div
                    key={i}
                    {...getLineProps({ line })}
                    className={`${styles.line} ${isHighlighted ? styles.highlighted : ''}`}
                  >
                    <span className={styles.lineNumber}>{lineNum}</span>
                    <span className={styles.lineContent}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>

      <DebugPanel currentStep={currentStep} />
    </div>
  );
}
