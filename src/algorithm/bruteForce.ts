import { AlgorithmStep } from '../types';

// 暴力法：对每个柱子作为高度，向左右扩展到第一个更矮的柱子
export function generateBruteForceSteps(heights: number[]): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const n = heights.length;
  let maxArea = 0;
  let stepId = 0;

  steps.push({
    id: stepId++,
    algorithmId: 'brute-force',
    description: `初始化：枚举每根柱子作为矩形高度，向左右扩展找最大宽度`,
    codeLines: { java: [1, 2], python: [1, 2], golang: [1, 2], javascript: [1, 2] },
    stack: [],
    currentIndex: -1,
    leftBoundary: [],
    rightBoundary: [],
    maxArea: 0,
    highlightBars: [],
    variables: { n, ans: 0 },
    callStack: [{ functionName: 'largestRectangleArea', line: 1, locals: { heights: `[${heights.join(',')}]`, n, ans: 0 } }],
    annotations: [],
  });

  if (n === 0) {
    steps.push({
      id: stepId++,
      algorithmId: 'brute-force',
      description: '数组为空，最大面积为 0',
      codeLines: { java: [3], python: [3], golang: [3], javascript: [3] },
      stack: [], currentIndex: -1, leftBoundary: [], rightBoundary: [],
      maxArea: 0, highlightBars: [], variables: { ans: 0 },
      callStack: [{ functionName: 'largestRectangleArea', line: 3, locals: { ans: 0 } }],
      annotations: [],
    });
    return steps;
  }

  for (let i = 0; i < n; i++) {
    const h = heights[i];
    // 向左扩展
    let left = i;
    while (left > 0 && heights[left - 1] >= h) {
      left--;
      steps.push({
        id: stepId++,
        algorithmId: 'brute-force',
        description: `i=${i} 高度 ${h} 向左扩展到 left=${left}（heights[${left - 1}]=${heights[left - 1]} >= ${h}）`,
        codeLines: { java: [5], python: [4], golang: [5], javascript: [5] },
        stack: [], currentIndex: i, leftBoundary: [left], rightBoundary: [],
        maxArea, highlightBars: [left, i],
        variables: { i, h, left, ans: maxArea },
        callStack: [{ functionName: 'largestRectangleArea', line: 5, locals: { i, h, left, ans: maxArea } }],
        annotations: [{
          id: `left-${i}-${left}`, type: 'arrow', x: left, y: 0,
          fromX: i, fromY: 0, toX: left, toY: 0,
          text: `左扩→${left}`, color: '#faad14',
        }],
      });
    }
    // 向右扩展
    let right = i;
    while (right < n - 1 && heights[right + 1] >= h) {
      right++;
      steps.push({
        id: stepId++,
        algorithmId: 'brute-force',
        description: `i=${i} 高度 ${h} 向右扩展到 right=${right}（heights[${right + 1}]=${heights[right + 1]} >= ${h}）`,
        codeLines: { java: [6], python: [5], golang: [6], javascript: [6] },
        stack: [], currentIndex: i, leftBoundary: [left], rightBoundary: [right],
        maxArea, highlightBars: [right, i],
        variables: { i, h, left, right, ans: maxArea },
        callStack: [{ functionName: 'largestRectangleArea', line: 6, locals: { i, h, left, right, ans: maxArea } }],
        annotations: [{
          id: `right-${i}-${right}`, type: 'arrow', x: right, y: 0,
          fromX: i, fromY: 0, toX: right, toY: 0,
          text: `右扩→${right}`, color: '#52c41a',
        }],
      });
    }
    const area = (right - left + 1) * h;
    maxArea = Math.max(maxArea, area);
    steps.push({
      id: stepId++,
      algorithmId: 'brute-force',
      description: `i=${i} 高度 ${h}：宽度=${right - left + 1}（${right}-${left}+1），面积=${area}${area === maxArea ? '，更新最大值' : ''}`,
      codeLines: { java: [7, 8], python: [6], golang: [7, 8], javascript: [7, 8] },
      stack: [], currentIndex: i, leftBoundary: [left], rightBoundary: [right],
      currentArea: area, maxArea, highlightBars: [i],
      highlightRect: { left, right, height: h },
      variables: { i, h, left, right, width: right - left + 1, area, ans: maxArea },
      callStack: [{ functionName: 'largestRectangleArea', line: 7, locals: { i, h, area, ans: maxArea } }],
      annotations: [{
        id: `area-${i}`, type: 'text', x: (left + right) / 2, y: h / 2,
        text: `${area}`, color: area === maxArea ? '#52c41a' : '#666',
      }],
    });
  }

  steps.push({
    id: stepId++,
    algorithmId: 'brute-force',
    description: `算法结束，最大矩形面积为 ${maxArea}`,
    codeLines: { java: [9], python: [7], golang: [9], javascript: [9] },
    stack: [], currentIndex: -1, leftBoundary: [], rightBoundary: [],
    maxArea, highlightBars: [], variables: { ans: maxArea },
    callStack: [{ functionName: 'largestRectangleArea', line: 9, locals: { ans: maxArea } }],
    annotations: [{ id: 'result', type: 'text', x: n / 2, y: -30, text: `最大面积: ${maxArea}`, color: '#52c41a' }],
  });
  return steps;
}
