import { AlgorithmStep, StackItem } from '../types';

// 生成算法执行步骤
export function generateAlgorithmSteps(heights: number[]): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const n = heights.length;
  
  if (n === 0) {
    steps.push({
      id: 0,
      algorithmId: 'monotonic-stack',
      description: '输入数组为空，最大面积为 0',
      codeLines: { java: [1], python: [1], golang: [1], javascript: [1] },
      stack: [],
      currentIndex: -1,
      leftBoundary: [],
      rightBoundary: [],
      maxArea: 0,
      highlightBars: [],
      variables: { n: 0, ans: 0 },
      annotations: [],
    });
    return steps;
  }

  const left: number[] = new Array(n).fill(-1);
  const right: number[] = new Array(n).fill(n);
  const stack: StackItem[] = [];
  let maxArea = 0;
  let stepId = 0;

  // 初始化步骤
  steps.push({
    id: stepId++,
    algorithmId: 'monotonic-stack',
    description: `初始化：数组长度 n = ${n}，创建左边界数组 left 和右边界数组 right，初始化单调栈`,
    codeLines: { java: [3, 4, 5], python: [2, 3], golang: [2, 3, 4], javascript: [2, 3, 4] },
    stack: [],
    currentIndex: -1,
    leftBoundary: [...left],
    rightBoundary: [...right],
    maxArea: 0,
    highlightBars: [],
    variables: { n, ans: 0 },
    annotations: [{
      id: 'init',
      type: 'text',
      x: 0,
      y: -30,
      text: '初始化数据结构',
      color: '#1890ff',
    }],
  });

  // 从左到右遍历，计算左边界和右边界
  for (let i = 0; i < n; i++) {
    const currentHeight = heights[i];
    
    // 开始处理当前柱子
    steps.push({
      id: stepId++,
    algorithmId: 'monotonic-stack',
      description: `遍历到索引 i = ${i}，当前柱子高度 heights[${i}] = ${currentHeight}`,
      codeLines: { java: [7], python: [5], golang: [6], javascript: [6] },
      stack: stack.map(s => ({ ...s })),
      currentIndex: i,
      leftBoundary: [...left],
      rightBoundary: [...right],
      maxArea,
      highlightBars: [i],
      variables: { i, 'heights[i]': currentHeight, n, ans: maxArea },
      annotations: [{
        id: `current-${i}`,
        type: 'text',
        x: i,
        y: -20,
        text: `当前: ${currentHeight}`,
        color: '#1890ff',
      }],
    });

    // 弹出栈中高度大于等于当前高度的元素
    while (stack.length > 0 && stack[stack.length - 1].height >= currentHeight) {
      const top = stack[stack.length - 1];
      
      steps.push({
        id: stepId++,
    algorithmId: 'monotonic-stack',
        description: `栈顶元素 heights[${top.index}] = ${top.height} >= ${currentHeight}，弹出栈顶，设置 right[${top.index}] = ${i}`,
        codeLines: { java: [8, 9, 10], python: [6, 7], golang: [7, 8, 9], javascript: [7, 8, 9] },
        stack: stack.map(s => ({ ...s })),
        currentIndex: i,
        leftBoundary: [...left],
        rightBoundary: [...right],
        maxArea,
        highlightBars: [i, top.index],
        variables: { 
          i, 
          'heights[i]': currentHeight,
          'stack.top': top.index,
          'heights[stack.top]': top.height,
          n, 
          ans: maxArea 
        },
        annotations: [
          {
            id: `pop-${top.index}`,
            type: 'text',
            x: top.index,
            y: -20,
            text: `弹出: ${top.height}`,
            color: '#ff4d4f',
          },
          {
            id: `right-${top.index}`,
            type: 'arrow',
            x: top.index,
            y: 0,
            fromX: top.index,
            fromY: 0,
            toX: i,
            toY: 0,
            text: `right[${top.index}]=${i}`,
            color: '#52c41a',
          },
        ],
      });

      right[top.index] = i;
      stack.pop();
    }

    // 设置左边界
    const leftBound = stack.length === 0 ? -1 : stack[stack.length - 1].index;
    left[i] = leftBound;

    steps.push({
      id: stepId++,
    algorithmId: 'monotonic-stack',
      description: leftBound === -1 
        ? `栈为空，left[${i}] = -1（左边没有更小的柱子）`
        : `栈顶索引为 ${leftBound}，设置 left[${i}] = ${leftBound}`,
      codeLines: { java: [11], python: [8], golang: [10], javascript: [10] },
      stack: stack.map(s => ({ ...s })),
      currentIndex: i,
      leftBoundary: [...left],
      rightBoundary: [...right],
      maxArea,
      highlightBars: leftBound === -1 ? [i] : [i, leftBound],
      variables: { 
        i, 
        'heights[i]': currentHeight,
        'left[i]': leftBound,
        n, 
        ans: maxArea 
      },
      annotations: leftBound !== -1 ? [{
        id: `left-${i}`,
        type: 'arrow',
        x: leftBound,
        y: 0,
        fromX: i,
        fromY: 0,
        toX: leftBound,
        toY: 0,
        text: `left[${i}]=${leftBound}`,
        color: '#faad14',
      }] : [],
    });

    // 将当前元素入栈
    stack.push({ index: i, height: currentHeight });

    steps.push({
      id: stepId++,
    algorithmId: 'monotonic-stack',
      description: `将索引 ${i}（高度 ${currentHeight}）入栈`,
      codeLines: { java: [12], python: [9], golang: [11], javascript: [11] },
      stack: stack.map(s => ({ ...s })),
      currentIndex: i,
      leftBoundary: [...left],
      rightBoundary: [...right],
      maxArea,
      highlightBars: [i],
      variables: { 
        i, 
        'heights[i]': currentHeight,
        'stack': `[${stack.map(s => s.index).join(', ')}]`,
        n, 
        ans: maxArea 
      },
      annotations: [{
        id: `push-${i}`,
        type: 'text',
        x: i,
        y: -20,
        text: `入栈`,
        color: '#52c41a',
      }],
    });
  }

  // 计算最大面积
  steps.push({
    id: stepId++,
    algorithmId: 'monotonic-stack',
    description: '遍历完成，开始计算每个柱子能形成的最大矩形面积',
    codeLines: { java: [14], python: [11], golang: [13], javascript: [13] },
    stack: [],
    currentIndex: -1,
    leftBoundary: [...left],
    rightBoundary: [...right],
    maxArea,
    highlightBars: [],
    variables: { 
      'left': `[${left.join(', ')}]`,
      'right': `[${right.join(', ')}]`,
      n, 
      ans: maxArea 
    },
    annotations: [],
  });

  for (let i = 0; i < n; i++) {
    const width = right[i] - left[i] - 1;
    const area = width * heights[i];
    const prevMaxArea = maxArea;
    maxArea = Math.max(maxArea, area);

    steps.push({
      id: stepId++,
    algorithmId: 'monotonic-stack',
      description: `计算柱子 ${i}：宽度 = right[${i}] - left[${i}] - 1 = ${right[i]} - ${left[i]} - 1 = ${width}，面积 = ${width} × ${heights[i]} = ${area}${area > prevMaxArea ? `，更新最大面积为 ${maxArea}` : ''}`,
      codeLines: { java: [15, 16], python: [12], golang: [14, 15], javascript: [14, 15] },
      stack: [],
      currentIndex: i,
      leftBoundary: [...left],
      rightBoundary: [...right],
      currentArea: area,
      maxArea,
      highlightBars: [i],
      highlightRect: {
        left: left[i] + 1,
        right: right[i] - 1,
        height: heights[i],
      },
      variables: { 
        i,
        'heights[i]': heights[i],
        'left[i]': left[i],
        'right[i]': right[i],
        width,
        area,
        ans: maxArea 
      },
      annotations: [{
        id: `area-${i}`,
        type: 'text',
        x: (left[i] + 1 + right[i] - 1) / 2,
        y: heights[i] / 2,
        text: `${area}`,
        color: area === maxArea ? '#52c41a' : '#666',
      }],
    });
  }

  // 最终结果
  steps.push({
    id: stepId++,
    algorithmId: 'monotonic-stack',
    description: `算法结束，最大矩形面积为 ${maxArea}`,
    codeLines: { java: [17], python: [13], golang: [16], javascript: [16] },
    stack: [],
    currentIndex: -1,
    leftBoundary: [...left],
    rightBoundary: [...right],
    maxArea,
    highlightBars: [],
    variables: { ans: maxArea },
    annotations: [{
      id: 'result',
      type: 'text',
      x: n / 2,
      y: -30,
      text: `最大面积: ${maxArea}`,
      color: '#52c41a',
    }],
  });

  return steps;
}

// 验证输入数据
export function validateInput(input: string): { valid: boolean; heights: number[]; error?: string } {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { valid: false, heights: [], error: '请输入数据' };
  }

  // 支持多种格式：[1,2,3] 或 1,2,3 或 1 2 3
  let numbers: string[];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    numbers = trimmed.slice(1, -1).split(',');
  } else if (trimmed.includes(',')) {
    numbers = trimmed.split(',');
  } else {
    numbers = trimmed.split(/\s+/);
  }

  const heights: number[] = [];
  for (const num of numbers) {
    const n = parseInt(num.trim(), 10);
    if (isNaN(n)) {
      return { valid: false, heights: [], error: `无效的数字: ${num}` };
    }
    if (n < 0) {
      return { valid: false, heights: [], error: '高度不能为负数' };
    }
    if (n > 10000) {
      return { valid: false, heights: [], error: '高度不能超过 10000' };
    }
    heights.push(n);
  }

  if (heights.length === 0) {
    return { valid: false, heights: [], error: '请输入至少一个数字' };
  }

  if (heights.length > 100) {
    return { valid: false, heights: [], error: '数组长度不能超过 100（演示限制）' };
  }

  return { valid: true, heights };
}

// 生成随机数据
export function generateRandomHeights(): number[] {
  const length = Math.floor(Math.random() * 8) + 4; // 4-11个元素
  const heights: number[] = [];
  for (let i = 0; i < length; i++) {
    heights.push(Math.floor(Math.random() * 10) + 1); // 1-10
  }
  return heights;
}

// 预设示例
export const PRESET_EXAMPLES = [
  { label: '示例1', value: [2, 1, 5, 6, 2, 3] },
  { label: '示例2', value: [2, 4] },
  { label: '递增', value: [1, 2, 3, 4, 5] },
  { label: '递减', value: [5, 4, 3, 2, 1] },
  { label: '相等', value: [3, 3, 3, 3, 3] },
  { label: '单峰', value: [1, 3, 5, 7, 5, 3, 1] },
];
