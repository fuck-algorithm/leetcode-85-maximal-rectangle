import { useState } from 'react';
import { validateInput, generateRandomHeights, PRESET_EXAMPLES } from '../../algorithm/largestRectangle';
import styles from './DataInput.module.css';

interface DataInputProps {
  onDataChange: (heights: number[]) => void;
  currentData: number[];
}

export function DataInput({ onDataChange, currentData }: DataInputProps) {
  const [inputValue, setInputValue] = useState(currentData.join(', '));
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const result = validateInput(value);
    setError(result.valid ? null : result.error || '输入无效');
  };

  const handleApply = () => {
    const result = validateInput(inputValue);
    if (result.valid) {
      onDataChange(result.heights);
      setError(null);
    } else {
      setError(result.error || '输入无效');
    }
  };

  const handlePreset = (heights: number[]) => {
    setInputValue(heights.join(', '));
    setError(null);
    onDataChange(heights);
  };

  const handleRandom = () => {
    const heights = generateRandomHeights();
    setInputValue(heights.join(', '));
    setError(null);
    onDataChange(heights);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className={styles.container} data-testid="data-input-bar">
      <div className={styles.inputRow}>
        <span className={styles.label}>heights =</span>
        <input
          type="text"
          className={styles.input}
          data-testid="algo-input"
          value={inputValue}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入数组，如: 2,1,5,6,2,3"
        />
        <button className={styles.applyBtn} onClick={handleApply}>
          应用
        </button>
        <button className={styles.randomBtn} data-testid="random-input-btn" onClick={handleRandom}>
          🎲 随机
        </button>
      </div>
      
      {error && <div className={styles.error} data-testid="input-error">{error}</div>}
      
      <div className={styles.presets}>
        <span className={styles.presetLabel}>示例：</span>
        {PRESET_EXAMPLES.map((example, index) => (
          <button
            key={index}
            data-testid={`sample-s${index + 1}`}
            className={`${styles.presetBtn} ${
              JSON.stringify(currentData) === JSON.stringify(example.value) ? styles.active : ''
            }`}
            onClick={() => handlePreset(example.value)}
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
}
