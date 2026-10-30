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
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SPEED_STORAGE_KEY = 'playback-speed';

export function ControlPanel({
  currentStep,
  totalSteps,
  isPlaying,
  onStepChange,
  onPlayPause,
  onReset,
  speed,
  onSpeedChange,
}: ControlPanelProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const latestStepRef = useRef(currentStep);
  const onSpeedChangeRef = useRef(onSpeedChange);

  useEffect(() => {
    onSpeedChangeRef.current = onSpeedChange;
  }, [onSpeedChange]);

  // 加载保存的播放速度
  useEffect(() => {
    const savedSpeed = Number(localStorage.getItem(SPEED_STORAGE_KEY));
    if (SPEED_OPTIONS.includes(savedSpeed)) {
      onSpeedChangeRef.current(savedSpeed);
      return;
    }
    getPlaybackSpeed().then((speed) => {
      if (SPEED_OPTIONS.includes(speed)) onSpeedChangeRef.current(speed);
    });
  }, []);

  useEffect(() => {
    latestStepRef.current = currentStep;
  }, [currentStep]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setShowSpeedMenu(false);
          onPlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setShowSpeedMenu(false);
          if (latestStepRef.current > 0) onStepChange(latestStepRef.current - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setShowSpeedMenu(false);
          if (latestStepRef.current < totalSteps - 1) onStepChange(latestStepRef.current + 1);
          break;
        case 'KeyR':
          e.preventDefault();
          setShowSpeedMenu(false);
          onReset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, totalSteps, onStepChange, onPlayPause, onReset, setShowSpeedMenu]);

  // 处理速度变更
  const handleSpeedChange = async (newSpeed: number) => {
    onSpeedChange(newSpeed);
    localStorage.setItem(SPEED_STORAGE_KEY, String(newSpeed));
    await savePlaybackSpeed(newSpeed);
    setShowSpeedMenu(false);
  };

  // 进度条拖拽
  const updateProgress = useCallback((e: MouseEvent | React.MouseEvent) => {
    const progress = progressRef.current;
    if (!progress) return;
    
    const rect = progress.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const step = Math.round(percent * (totalSteps - 1));
    latestStepRef.current = step;
    onStepChange(step);
  }, [totalSteps, onStepChange]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) updateProgress(e);
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

  const handleProgressMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    updateProgress(e);
  }, [updateProgress]);

  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div className={styles.container} data-testid="playback-controls">
      <div className={styles.description}>
        <span className={styles.stepNum} data-testid="timeline-meta">Step {currentStep + 1}/{totalSteps}</span>
      </div>
      
      <div className={styles.controls} data-testid="controls-group">
        <button 
          className={styles.btn}
          data-testid="prev-step-btn"
          onClick={() => currentStep > 0 && onStepChange(currentStep - 1)}
          disabled={currentStep === 0}
          title="上一步"
        >
          ⏮ 上一步 <kbd>←</kbd>
        </button>
        
        <button 
          className={`${styles.btn} ${styles.playBtn}`}
          data-testid="play-pause-btn"
          onClick={onPlayPause}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'} <kbd>Space</kbd>
        </button>
        
        <button 
          className={styles.btn}
          data-testid="next-step-btn"
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
            data-testid="speed-menu-btn"
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
                  data-testid={`speed-${s}x`}
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
        data-testid="timeline-track"
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
