import { AlgorithmStep } from '../types';

// DP 法：用 left/right 数组记录每根柱子左右第一个更矮的位置（非栈实现）
export function generateDpSteps(heights: number[]): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const n = heights.length;
  const left = new Array(n).fill(-1);
  const right = new Array(n).fill(n);
  let maxArea = 0;
  let stepId = 0;

  steps.push({
    id: stepId++, algorithmId: 'dp',
    description: `初始化：DP 数组 left/right，逐个柱子向左/右找第一个更矮位置`,
    codeLines: { java: [1, 2, 3], python: [1, 2, 3], golang: [1, 2, 3], javascript: [1, 2, 3] },
    stack: [], currentIndex: -1, leftBoundary: [...left], rightBoundary: [...right],
    maxArea: 0, highlightBars: [], variables: { n, ans: 0 },
    callStack: [{ functionName: 'largestRectangleArea', line: 1, locals: { n, ans: 0 } }],
    annotations: [],
  });

  // 计算 left[]
  for (let i = 0; i < n; i++) {
    let p = i - 1;
    while (p >= 0 && heights[p] >= heights[i]) p = left[p];
    left[i] = p;
    steps.push({
      id: stepId++, algorithmId: 'dp',
      description: `计算 left[${i}]：从 ${i - 1} 向左跳，找到第一个更矮位置 p=${p}`,
      codeLines: { java: [5, 6], python: [4, 5], golang: [5, 6], javascript: [5, 6] },
      stack: [], currentIndex: i, leftBoundary: [...left], rightBoundary: [...right],
      maxArea, highlightBars: p >= 0 ? [i, p] : [i],
      variables: { i, p, 'left[i]': p, ans: maxArea },
      callStack: [{ functionName: 'largestRectangleArea', line: 5, locals: { i, p, 'left[i]': p, ans: maxArea } }],
      annotations: p >= 0 ? [{ id: `lp-${i}`, type: 'arrow', x: p, y: 0, fromX: i, fromY: 0, toX: p, toY: 0, text: `left[${i}]=${p}`, color: '#faad14' }] : [],
    });
  }
  // 计算 right[]
  for (let i = n - 1; i >= 0; i--) {
    let p = i + 1;
    while (p < n && heights[p] >= heights[i]) p = right[p];
    right[i] = p;
    steps.push({
      id: stepId++, algorithmId: 'dp',
      description: `计算 right[${i}]：从 ${i + 1} 向右跳，找到第一个更矮位置 p=${p}`,
      codeLines: { java: [8, 9], python: [7, 8], golang: [8, 9], javascript: [8, 9] },
      stack: [], currentIndex: i, leftBoundary: [...left], rightBoundary: [...right],
      maxArea, highlightBars: p < n ? [i, p] : [i],
      variables: { i, p, 'right[i]': p, ans: maxArea },
      callStack: [{ functionName: 'largestRectangleArea', line: 8, locals: { i, p, 'right[i]': p, ans: maxArea } }],
      annotations: p < n ? [{ id: `rp-${i}`, type: 'arrow', x: p, y: 0, fromX: i, fromY: 0, toX: p, toY: 0, text: `right[${i}]=${p}`, color: '#52c41a' }] : [],
    });
  }
  // 算面积
  for (let i = 0; i < n; i++) {
    const area = (right[i] - left[i] - 1) * heights[i];
    maxArea = Math.max(maxArea, area);
    steps.push({
      id: stepId++, algorithmId: 'dp',
      description: `i=${i}：宽=${right[i] - left[i] - 1}（${right[i]}-${left[i]}-1），面积=${area}${area === maxArea ? '，更新最大' : ''}`,
      codeLines: { java: [11, 12], python: [10], golang: [11, 12], javascript: [11, 12] },
      stack: [], currentIndex: i, leftBoundary: [...left], rightBoundary: [...right],
      currentArea: area, maxArea, highlightBars: [i],
      highlightRect: { left: left[i] + 1, right: right[i] - 1, height: heights[i] },
      variables: { i, 'left[i]': left[i], 'right[i]': right[i], width: right[i] - left[i] - 1, area, ans: maxArea },
      callStack: [{ functionName: 'largestRectangleArea', line: 11, locals: { i, area, ans: maxArea } }],
      annotations: [{ id: `area-${i}`, type: 'text', x: (left[i] + 1 + right[i] - 1) / 2, y: heights[i] / 2, text: `${area}`, color: area === maxArea ? '#52c41a' : '#666' }],
    });
  }
  steps.push({
    id: stepId++, algorithmId: 'dp',
    description: `算法结束，最大矩形面积为 ${maxArea}`,
    codeLines: { java: [13], python: [11], golang: [13], javascript: [13] },
    stack: [], currentIndex: -1, leftBoundary: [...left], rightBoundary: [...right],
    maxArea, highlightBars: [], variables: { ans: maxArea },
    callStack: [{ functionName: 'largestRectangleArea', line: 13, locals: { ans: maxArea } }],
    annotations: [{ id: 'result', type: 'text', x: n / 2, y: -30, text: `最大面积: ${maxArea}`, color: '#52c41a' }],
  });
  return steps;
}
