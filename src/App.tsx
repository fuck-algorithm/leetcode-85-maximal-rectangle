import { useState, useEffect, useCallback, useRef } from 'react';
import { Header, DataInput, CodePanel, Canvas, ControlPanel, WeChatFloat } from './components';
import { getSolver, ALGORITHM_LIST, PRESET_EXAMPLES } from './algorithm/registry';
import { AlgorithmId, AlgorithmStep } from './types';
import styles from './App.module.css';

function App() {
  const [algorithmId, setAlgorithmId] = useState<AlgorithmId>('monotonic-stack');
  const [heights, setHeights] = useState<number[]>(PRESET_EXAMPLES[0].value);
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const playIntervalRef = useRef<number | null>(null);

  // 生成算法步骤（数据或解法变化时重新生成）
  useEffect(() => {
    const solver = getSolver(algorithmId);
    setSteps(solver.generateSteps(heights));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [heights, algorithmId]);

  // 自动播放
  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      playIntervalRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / speed);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, speed, steps.length, currentStep]);

  // 到达最后一步时停止播放
  useEffect(() => {
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
    }
  }, [currentStep, steps.length]);

  const handleDataChange = useCallback((newHeights: number[]) => {
    setHeights(newHeights);
  }, []);

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [currentStep, steps.length]);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  const handleAlgorithmChange = useCallback((id: AlgorithmId) => {
    setAlgorithmId(id);
  }, []);

  const currentStepData = steps[currentStep] || null;

  return (
    <div className={styles.app}>
      <Header algorithmId={algorithmId} />
      <DataInput onDataChange={handleDataChange} currentData={heights} />

      <div className={styles.solverBar}>
        {ALGORITHM_LIST.map(meta => (
          <button
            key={meta.id}
            className={`${styles.solverBtn} ${algorithmId === meta.id ? styles.solverActive : ''}`}
            onClick={() => handleAlgorithmChange(meta.id)}
            title={meta.description}
          >
            {meta.name} <span className={styles.complexity}>{meta.complexity}</span>
          </button>
        ))}
      </div>

      <div className={styles.main}>
        <div className={styles.leftPanel}>
          <CodePanel currentStep={currentStepData} algorithmId={algorithmId} />
        </div>

        <div className={styles.rightPanel}>
          <Canvas heights={heights} currentStep={currentStepData} />
        </div>
      </div>

      <ControlPanel
        currentStep={currentStep}
        totalSteps={steps.length}
        isPlaying={isPlaying}
        onStepChange={handleStepChange}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={handleSpeedChange}
        stepDescription={currentStepData?.description || ''}
      />

      <WeChatFloat />
    </div>
  );
}

export default App;
