import { useEffect, useState, useCallback, useRef } from 'react';
import { savePlaybackSpeed, getPlaybackSpeed } from '../../utils/storage';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onStepChange: (step: number) => void;
  onPlayPause: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  stepDescription: string;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function ControlPanel({
  currentStep,
  totalSteps,
  isPlaying,
  onStepChange,
  onPlayPause,
  onReset,
  speed,
  onSpeedChange,
  stepDescription,
}: ControlPanelProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // 加载保存的播放速度
  useEffect(() => {
    getPlaybackSpeed().then(onSpeedChange);
  }, [onSpeedChange]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onPlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentStep > 0) onStepChange(currentStep - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentStep < totalSteps - 1) onStepChange(currentStep + 1);
          break;
        case 'KeyR':
          e.preventDefault();
          onReset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, totalSteps, onStepChange, onPlayPause, onReset]);

  // 处理速度变更
  const handleSpeedChange = async (newSpeed: number) => {
    onSpeedChange(newSpeed);
    await savePlaybackSpeed(newSpeed);
    setShowSpeedMenu(false);
  };

  // 进度条拖拽
  const handleProgressMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    updateProgress(e);
  }, []);

  const updateProgress = useCallback((e: MouseEvent | React.MouseEvent) => {
    const progress = progressRef.current;
    if (!progress) return;
    
    const rect = progress.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const step = Math.round(percent * (totalSteps - 1));
    onStepChange(step);
  }, [totalSteps, onStepChange]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        updateProgress(e);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [updateProgress]);

  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.description}>
        <span className={styles.stepNum}>步骤 {currentStep + 1}/{totalSteps}</span>
        <span className={styles.stepText}>{stepDescription}</span>
      </div>
      
      <div className={styles.controls}>
        <button 
          className={styles.btn}
          onClick={() => currentStep > 0 && onStepChange(currentStep - 1)}
          disabled={currentStep === 0}
          title="上一步"
        >
          ⏮ 上一步 <kbd>←</kbd>
        </button>
        
        <button 
          className={`${styles.btn} ${styles.playBtn}`}
          onClick={onPlayPause}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'} <kbd>Space</kbd>
        </button>
        
        <button 
          className={styles.btn}
          onClick={() => currentStep < totalSteps - 1 && onStepChange(currentStep + 1)}
          disabled={currentStep === totalSteps - 1}
          title="下一步"
        >
          下一步 ⏭ <kbd>→</kbd>
        </button>
        
        <button 
          className={styles.btn}
          onClick={onReset}
          title="重置"
        >
          ↺ 重置 <kbd>R</kbd>
        </button>
        
        <div className={styles.speedControl}>
          <button 
            className={styles.speedBtn}
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          >
            {speed}x ▾
          </button>
          
          {showSpeedMenu && (
            <div className={styles.speedMenu}>
              {SPEED_OPTIONS.map(s => (
                <button
                  key={s}
                  className={`${styles.speedOption} ${speed === s ? styles.active : ''}`}
                  onClick={() => handleSpeedChange(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div 
        className={styles.progressBar}
        ref={progressRef}
        onMouseDown={handleProgressMouseDown}
      >
        <div 
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
        <div 
          className={styles.progressHandle}
          style={{ left: `${progress}%` }}
        />
      </div>
    </div>
  );
}
