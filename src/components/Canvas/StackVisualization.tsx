import { StackItem } from '../../types';
import styles from './StackVisualization.module.css';

interface Props {
  stack: StackItem[];
}

export function StackVisualization({ stack }: Props) {
  if (stack.length === 0) return null;
  return (
    <div className={styles.container}>
      <div className={styles.title}>单调栈（栈底→栈顶，递增）</div>
      <div className={styles.stack}>
        {stack.map((item, idx) => (
          <div key={idx} className={`${styles.item} ${idx === stack.length - 1 ? styles.top : ''}`}>
            <span className={styles.index}>idx={item.index}</span>
            <span className={styles.height}>h={item.height}</span>
            {idx === stack.length - 1 && <span className={styles.topTag}>栈顶</span>}
          </div>
        ))}
      </div>
      <div className={styles.bottom}>栈底</div>
      <div className={styles.hint}>高度单调递增，遇更矮柱则弹出栈顶</div>
    </div>
  );
}
