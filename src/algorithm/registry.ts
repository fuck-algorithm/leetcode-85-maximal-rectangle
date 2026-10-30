import { AlgorithmId, AlgorithmSolver, AlgorithmMeta, AlgorithmStep } from '../types';
import { generateAlgorithmSteps, validateInput, generateRandomHeights, PRESET_EXAMPLES } from './largestRectangle';
import { generateBruteForceSteps } from './bruteForce';
import { generateDivideConquerSteps } from './divideConquer';
import { generateDpSteps } from './dp';

export { validateInput, generateRandomHeights, PRESET_EXAMPLES };

function withTeachingMetadata(steps: AlgorithmStep[]): AlgorithmStep[] {
  return steps.map((step) => {
    const description = step.description;
    const operation = description.includes('弹出') ? 'pop'
      : description.includes('入栈') ? 'push'
        : description.includes('面积') ? 'compare'
          : description.includes('初始化') ? 'init'
            : description.includes('结束') || description.includes('为空') ? 'done' : 'read';
    return {
      ...step,
      operation,
      narration: step.narration || description,
      anchorIds: step.anchorIds?.length ? step.anchorIds : [`${step.algorithmId ?? 'algorithm'}-step-${step.id}`],
    };
  });
}

const SOLVERS: Record<AlgorithmId, AlgorithmSolver> = {
  'monotonic-stack': {
    meta: { id: 'monotonic-stack', name: '单调栈', complexity: 'O(n)', description: '维护单调递增栈一次遍历求左右边界' },
    generateSteps: heights => withTeachingMetadata(generateAlgorithmSteps(heights)),
    validateInput,
  },
  'brute-force': {
    meta: { id: 'brute-force', name: '暴力法', complexity: 'O(n²)', description: '枚举每根柱子向左右扩展' },
    generateSteps: heights => withTeachingMetadata(generateBruteForceSteps(heights)),
    validateInput,
  },
  'divide-conquer': {
    meta: { id: 'divide-conquer', name: '分治法', complexity: 'O(n log n)', description: '区间最矮柱切分递归' },
    generateSteps: heights => withTeachingMetadata(generateDivideConquerSteps(heights)),
    validateInput,
  },
  'dp': {
    meta: { id: 'dp', name: '动态规划', complexity: 'O(n)', description: '数组记录左右边界' },
    generateSteps: heights => withTeachingMetadata(generateDpSteps(heights)),
    validateInput,
  },
};

export const ALGORITHM_LIST: AlgorithmMeta[] = (Object.keys(SOLVERS) as AlgorithmId[]).map(id => SOLVERS[id].meta);

export function getSolver(id: AlgorithmId): AlgorithmSolver {
  return SOLVERS[id];
}
