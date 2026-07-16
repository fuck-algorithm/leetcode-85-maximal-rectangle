import { problemDescription } from '../../data/problemDescription';
import styles from './ProblemDescriptionModal.module.css';

interface Props {
  onClose: () => void;
}

export function ProblemDescriptionModal({ onClose }: Props) {
  const { number, title, difficulty, content, link } = problemDescription;
  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        <div className={styles.header}>
          <span className={styles.number}>{number}. {title}</span>
          <span className={styles.difficulty}>{difficulty}</span>
        </div>
        <a className={styles.link} href={link} target="_blank" rel="noopener noreferrer">LeetCode 原题 ↗</a>
        <div className={styles.content}>
          {content.split('\n').map((line, i) => (
            <p key={i} className={line.trim() ? '' : styles.empty}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
