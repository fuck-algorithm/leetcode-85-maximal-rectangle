import { useEffect, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Language, AlgorithmStep } from '../../types';
import { algorithmCodes } from '../../algorithm/codeData';
import { saveLanguage, getLanguage } from '../../utils/storage';
import styles from './CodePanel.module.css';

interface CodePanelProps {
  currentStep: AlgorithmStep | null;
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

export function CodePanel({ currentStep }: CodePanelProps) {
  const [language, setLanguage] = useState<Language>('java');

  useEffect(() => {
    getLanguage().then(setLanguage);
  }, []);

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    await saveLanguage(lang);
  };

  const codeBlock = algorithmCodes[language];
  const highlightLines = currentStep?.codeLines[language] || [];
  const variables = currentStep?.variables || {};

  // 获取每行应该显示的变量
  const getLineVariables = (lineNum: number): string | null => {
    if (!highlightLines.includes(lineNum)) return null;
    
    const varEntries = Object.entries(variables);
    if (varEntries.length === 0) return null;
    
    // 只在高亮行的最后一行显示变量
    if (lineNum !== Math.max(...highlightLines)) return null;
    
    return varEntries
      .filter(([key]) => !key.includes('[') || key.includes('heights[i]') || key.includes('left[i]') || key.includes('right[i]'))
      .slice(0, 4)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
  };

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
          theme={themes.oneDark}
          code={codeBlock.code}
          language={PRISM_LANGUAGES[language]}
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre className={styles.pre} style={style}>
              {tokens.map((line, i) => {
                const lineNum = i + 1;
                const isHighlighted = highlightLines.includes(lineNum);
                const lineVars = getLineVariables(lineNum);
                
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
                    {lineVars && (
                      <span className={styles.lineVars}>
                        // {lineVars}
                      </span>
                    )}
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}
