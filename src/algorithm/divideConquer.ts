import { AlgorithmStep, StackFrame } from '../types';

// 分治法：区间内最矮柱决定面积，分左右两半递归取最大
export function generateDivideConquerSteps(heights: number[]): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepId = 0;
  let maxArea = 0;
  const n = heights.length;

  steps.push({
    id: stepId++, algorithmId: 'divide-conquer',
    description: `初始化：对整个区间 [0, ${n - 1}] 分治`,
    codeLines: { java: [1, 2], python: [1, 2], golang: [1, 2], javascript: [1, 2] },
    stack: [], currentIndex: -1, leftBoundary: [], rightBoundary: [],
    maxArea: 0, highlightBars: [],
    variables: { n, ans: 0 },
    callStack: [{ functionName: 'largestRectangleArea', line: 1, locals: { n, ans: 0 } }],
    annotations: [],
  });

  function solve(l: number, r: number) {
    if (l > r) return;
    // 找区间最矮柱
    let minIdx = l;
    for (let i = l + 1; i <= r; i++) {
      if (heights[i] < heights[minIdx]) minIdx = i;
    }
    const area = heights[minIdx] * (r - l + 1);
    maxArea = Math.max(maxArea, area);
    const frame: StackFrame = { functionName: `solve([${l},${r}])`, line: 4, locals: { l, r, minIdx, h: heights[minIdx], area, ans: maxArea } };
    steps.push({
      id: stepId++, algorithmId: 'divide-conquer',
      description: `区间 [${l},${r}] 最矮柱 idx=${minIdx} h=${heights[minIdx]}，面积=${area}（${heights[minIdx]}×${r - l + 1}）${area === maxArea ? '，更新最大' : ''}`,
      codeLines: { java: [4, 5, 6], python: [3, 4], golang: [4, 5, 6], javascript: [4, 5, 6] },
      stack: [], currentIndex: minIdx, leftBoundary: [l], rightBoundary: [r],
      currentArea: area, maxArea, highlightBars: [minIdx],
      highlightRect: { left: l, right: r, height: heights[minIdx] },
      variables: { l, r, minIdx, h: heights[minIdx], width: r - l + 1, area, ans: maxArea },
      callStack: [frame],
      annotations: [
        { id: `min-${l}-${r}`, type: 'arrow', x: minIdx, y: 0, fromX: l, fromY: 0, toX: r, toY: 0, text: `宽=${r - l + 1}`, color: '#52c41a' },
        { id: `h-${l}-${r}`, type: 'text', x: minIdx, y: heights[minIdx] + 1, text: `最矮 h=${heights[minIdx]}`, color: '#ff4d4f' },
      ],
    });
    // 递归左右
    solve(l, minIdx - 1);
    solve(minIdx + 1, r);
  }

  solve(0, n - 1);

  steps.push({
    id: stepId++, algorithmId: 'divide-conquer',
    description: `算法结束，最大矩形面积为 ${maxArea}`,
    codeLines: { java: [9], python: [7], golang: [9], javascript: [9] },
    stack: [], currentIndex: -1, leftBoundary: [], rightBoundary: [],
    maxArea, highlightBars: [], variables: { ans: maxArea },
    callStack: [{ functionName: 'largestRectangleArea', line: 9, locals: { ans: maxArea } }],
    annotations: [{ id: 'result', type: 'text', x: n / 2, y: -30, text: `最大面积: ${maxArea}`, color: '#52c41a' }],
  });
  return steps;
}
