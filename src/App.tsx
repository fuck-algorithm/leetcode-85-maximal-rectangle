import { useState, useEffect, useCallback, useRef } from 'react';
import { Header, DataInput, CodePanel, Canvas, ControlPanel, WeChatFloat } from './components';
import { generateAlgorithmSteps, PRESET_EXAMPLES } from './algorithm/largestRectangle';
import { AlgorithmStep } from './types';
import styles from './App.module.css';

function App() {
  const [heights, setHeights] = useState<number[]>(PRESET_EXAMPLES[0].value);
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const playIntervalRef = useRef<number | null>(null);

  // 生成算法步骤
  useEffect(() => {
    const newSteps = generateAlgorithmSteps(heights);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [heights]);

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

  const currentStepData = steps[currentStep] || null;

  return (
    <div className={styles.app}>
      <Header />
      <DataInput onDataChange={handleDataChange} currentData={heights} />
      
      <div className={styles.main}>
        <div className={styles.leftPanel}>
          <CodePanel currentStep={currentStepData} />
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
