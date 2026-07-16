import { AlgorithmId, AlgorithmSolver, AlgorithmMeta } from '../types';
import { generateAlgorithmSteps, validateInput, generateRandomHeights, PRESET_EXAMPLES } from './largestRectangle';
import { generateBruteForceSteps } from './bruteForce';
import { generateDivideConquerSteps } from './divideConquer';
import { generateDpSteps } from './dp';

export { validateInput, generateRandomHeights, PRESET_EXAMPLES };

const SOLVERS: Record<AlgorithmId, AlgorithmSolver> = {
  'monotonic-stack': {
    meta: { id: 'monotonic-stack', name: '单调栈', complexity: 'O(n)', description: '维护单调递增栈一次遍历求左右边界' },
    generateSteps: generateAlgorithmSteps,
    validateInput,
  },
  'brute-force': {
    meta: { id: 'brute-force', name: '暴力法', complexity: 'O(n²)', description: '枚举每根柱子向左右扩展' },
    generateSteps: generateBruteForceSteps,
    validateInput,
  },
  'divide-conquer': {
    meta: { id: 'divide-conquer', name: '分治法', complexity: 'O(n log n)', description: '区间最矮柱切分递归' },
    generateSteps: generateDivideConquerSteps,
    validateInput,
  },
  'dp': {
    meta: { id: 'dp', name: '动态规划', complexity: 'O(n)', description: '数组记录左右边界' },
    generateSteps: generateDpSteps,
    validateInput,
  },
};

export const ALGORITHM_LIST: AlgorithmMeta[] = (Object.keys(SOLVERS) as AlgorithmId[]).map(id => SOLVERS[id].meta);

export function getSolver(id: AlgorithmId): AlgorithmSolver {
  return SOLVERS[id];
}
