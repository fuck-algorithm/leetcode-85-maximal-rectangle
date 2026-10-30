import { useState, useEffect } from 'react';
import { getGitHubStars, GITHUB_REPO_URL } from '../../utils/github';
import { algorithmThought } from '../../algorithm/codeData';
import { AlgorithmId } from '../../types';
import { ProblemDescriptionModal } from './ProblemDescriptionModal';
import styles from './Header.module.css';

const LEETCODE_URL = 'https://leetcode.cn/problems/maximal-rectangle/';
const HOT100_URL = 'https://fuck-algorithm.github.io/leetcode-hot-100/';

interface HeaderProps {
  algorithmId: AlgorithmId;
}

export function Header({ algorithmId }: HeaderProps) {
  const [stars, setStars] = useState<number>(0);
  const [showProblem, setShowProblem] = useState(false);
  const [showThought, setShowThought] = useState(false);

  useEffect(() => {
    getGitHubStars().then(setStars);
  }, []);

  const thought = algorithmThought[algorithmId] || '';

  return (
    <header className={styles.header} data-testid="problem-header">
      <div className={styles.left}>
        <a
          href={HOT100_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.backLink}
          data-testid="hot100-link"
        >
          ← 返回 LeetCode Hot 100
        </a>
      </div>

      <div className={styles.center}>
        <a
          href={LEETCODE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.title}
          data-testid="problem-title-link"
        >
          85. 最大矩形
        </a>
      </div>

      <div className={styles.right}>
        <button
          className={styles.thoughtBtn}
          onClick={() => setShowProblem(true)}
        >
          📋 题目描述
        </button>
        <button
          className={styles.thoughtBtn}
          data-testid="thought-btn"
          onClick={() => setShowThought(true)}
        >
          💡 算法思路
        </button>

        <a
          href={GITHUB_REPO_URL}
          data-testid="github-badge"
          title="去 GitHub 仓库 Star 支持一下"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.github}
        >
          <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <span className={styles.starCount} data-testid="github-stars">⭐ {stars}</span>
        </a>
      </div>

      {showProblem && <ProblemDescriptionModal onClose={() => setShowProblem(false)} />}

      {showThought && (
        <div className={styles.modal} data-testid="thought-modal" onClick={() => setShowThought(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} data-testid="thought-modal-close" onClick={() => setShowThought(false)}>×</button>
            <div className={styles.thoughtContent}>
              {thought.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h2 key={i}>{line.slice(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i}>{line.slice(4)}</h3>;
                }
                if (line.startsWith('- ')) {
                  return <li key={i}>{line.slice(2)}</li>;
                }
                if (line.trim()) {
                  return <p key={i}>{line}</p>;
                }
                return null;
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
