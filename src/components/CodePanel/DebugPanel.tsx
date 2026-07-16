import { AlgorithmStep } from '../../types';
import styles from './DebugPanel.module.css';

interface DebugPanelProps {
  currentStep: AlgorithmStep | null;
}

export function DebugPanel({ currentStep }: DebugPanelProps) {
  const variables = currentStep?.variables || {};
  const callStack = currentStep?.callStack || [];
  const varEntries = Object.entries(variables);

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>变量</div>
        {varEntries.length === 0 ? (
          <div className={styles.empty}>（无变量）</div>
        ) : (
          <table className={styles.varTable}>
            <tbody>
              {varEntries.map(([key, value]) => (
                <tr key={key} className={styles.varRow}>
                  <td className={styles.varKey}>{key}</td>
                  <td className={styles.varValue}>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>调用栈</div>
        {callStack.length === 0 ? (
          <div className={styles.empty}>（空栈）</div>
        ) : (
          <div className={styles.stackList}>
            {callStack.map((frame, idx) => {
              const locals = Object.entries(frame.locals);
              return (
                <div key={idx} className={`${styles.frame} ${idx === 0 ? styles.frameTop : ''}`}>
                  <div className={styles.frameHeader}>
                    <span className={styles.frameName}>{frame.functionName}</span>
                    <span className={styles.frameLine}>:L{frame.line}</span>
                  </div>
                  {locals.length > 0 && (
                    <div className={styles.frameLocals}>
                      {locals.map(([k, v]) => (
                        <span key={k} className={styles.local}>
                          <span className={styles.localKey}>{k}</span>=<span className={styles.localVal}>{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
