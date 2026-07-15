// 支持的编程语言
export type Language = 'java' | 'python' | 'golang' | 'javascript';

// 算法步骤类型
export interface AlgorithmStep {
  id: number;
  description: string;
  // 各语言对应的代码行号
  codeLines: Record<Language, number[]>;
  // 当前栈状态
  stack: StackItem[];
  // 当前处理的柱子索引
  currentIndex: number;
  // 左边界数组
  leftBoundary: number[];
  // 右边界数组
  rightBoundary: number[];
  // 当前计算的面积
  currentArea?: number;
  // 最大面积
  maxArea: number;
  // 高亮的柱子索引
  highlightBars: number[];
  // 高亮的矩形区域
  highlightRect?: {
    left: number;
    right: number;
    height: number;
  };
  // 变量状态
  variables: Record<string, string | number>;
  // 动画标注
  annotations: Annotation[];
}

// 栈元素
export interface StackItem {
  index: number;
  height: number;
}

// 画布标注
export interface Annotation {
  id: string;
  type: 'text' | 'arrow' | 'highlight';
  x: number;
  y: number;
  text?: string;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  color?: string;
}

// 播放状态
export interface PlaybackState {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  speed: number;
}

// 代码块
export interface CodeBlock {
  language: Language;
  code: string;
  lineCount: number;
}
