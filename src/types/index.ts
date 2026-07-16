// 支持的编程语言
export type Language = 'java' | 'python' | 'golang' | 'javascript';

// 支持的解法
export type AlgorithmId = 'monotonic-stack' | 'brute-force' | 'divide-conquer' | 'dp';

// 栈帧（调试视图的调用栈）
export interface StackFrame {
  functionName: string;
  line: number;
  locals: Record<string, string | number>;
}

// 算法步骤类型
export interface AlgorithmStep {
  id: number;
  description: string;
  // 解法标识（可选，旧步骤无此字段时由消费方处理）
  algorithmId?: AlgorithmId;
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
  // 调用栈（调试视图）。可选，旧步骤无此字段时调用栈面板显示空
  callStack?: StackFrame[];
  // 动画标注
  annotations: Annotation[];
}

// 栈元素
export interface StackItem {
  index: number;
  height: number;
}

// 画布标注（箭头/示意线）
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

// 解法元信息
export interface AlgorithmMeta {
  id: AlgorithmId;
  name: string;
  complexity: string;
  description: string;
}

// 解法求解器统一接口
export interface AlgorithmSolver {
  meta: AlgorithmMeta;
  generateSteps: (heights: number[]) => AlgorithmStep[];
  validateInput: (input: string) => { valid: boolean; heights: number[]; error?: string };
}

// 各解法的代码集：Record<解法, Record<语言, CodeBlock>>
export type AlgorithmCodeData = Record<AlgorithmId, Record<Language, CodeBlock>>;
