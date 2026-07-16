# LeetCode-85 可视化站点全面升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`
> Steps use checkbox (`- [ ]`) syntax.

**Goal:** 把现有单调栈可视化站点升级为多解法调试器风格可视化：代码面板做成 IDE debug 视图（语法高亮 + 当前行高亮 + 变量面板 + 调用栈 + 多语言切换）；顶部加【题目描述】弹窗并修复 GitHub 404（make public 84 仓库）；播放按钮居中；画布支持多解法、单调栈抽独立组件、渲染带方向箭头/示意线；workflow 支持代码变更即部署。

**Architecture:** 数据层先扩展 `AlgorithmStep`（加 `callStack`、`algorithmId`）→ 算法层把单调栈重构为 `monotonic-stack` 解法并新增 `brute-force`/`divide-conquer`/`dp` 三解法，经 `registry.ts` 统一 `AlgorithmSolver` 接口 → 代码数据层改为 `Record<AlgorithmId, Record<Language, CodeBlock>>` → UI 层：`DebugPanel`（变量+调用栈）挂到 `CodePanel`；`Header` 加题目描述弹窗；`ControlPanel` 按钮居中；`Canvas` 抽出 `StackVisualization`/`AnnotationsLayer` 子组件并真正渲染 `annotations`；`App` 加解法选择器，切换时重新生成 steps。这样分层是因为「类型契约」是所有 Task 的依赖根，先定类型再逐层实现可避免悬空引用。

**Tech Stack:** React 18.3, TypeScript 5.6, Vite 6, d3 7, prism-react-renderer 2.4.1（已装）, idb 8, GitHub CLI 2.x, GitHub Actions（actions/checkout@v4, setup-node@v4, configure-pages@v4, upload-pages-artifact@v3, deploy-pages@v4）

**Risks:**
- `AlgorithmStep` 类型扩展牵动 `largestRectangle.ts` 与全部消费组件 → 缓解：Task 1 新字段全部设为可选，旧逻辑不受影响，后续 Task 逐个填充
- 四个解法的 `generateSteps` 手写易错 → 缓解：每个解法独立 Task + `npm run build` 验证编译，单步 lint
- Canvas 抽组件可能破坏 d3 zoom 绑定 → 缓解：`StackVisualization` 用纯 DOM、`AnnotationsLayer` 嵌在主 `<g transform>` 内不另绑 zoom
- 84 仓库 make public 不可逆 → 缓解：用户已明确授权，仅作用于 84 仓库
- LeetCode 代码风格需自定义 prism theme → 缓解：复用 prism `themes.githubLight` 作为基底

---

### Task 1: 扩展 AlgorithmStep 类型 — 为调试视图与多解法奠基

**Depends on:** None
**Files:**
- Modify: `src/types/index.ts:1-69`（整个文件替换）

- [ ] **Step 1: 修改 types/index.ts — 新增 AlgorithmId、callStack、扩展 AlgorithmStep 与 CodeData**

为什么需要：现有 `AlgorithmStep.variables` 是扁平 Record 无法表达调用栈，且无解法标识。新增 `algorithmId`、`callStack`，并新增 `AlgorithmSolver`/`AlgorithmMeta` 类型供 registry 使用。新字段全部可选，保证旧代码不破。

```typescript
// src/types/index.ts（整文件替换）

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
  algorithmId?: AlgorithmId;
  codeLines: Record<Language, number[]>;
  stack: StackItem[];
  currentIndex: number;
  leftBoundary: number[];
  rightBoundary: number[];
  currentArea?: number;
  maxArea: number;
  highlightBars: number[];
  highlightRect?: {
    left: number;
    right: number;
    height: number;
  };
  variables: Record<string, string | number>;
  // 调用栈（调试视图）。可选，旧步骤无此字段时调用栈面板显示空
  callStack?: StackFrame[];
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
```

- [ ] **Step 2: 验证类型扩展不破坏编译 — tsc 应通过**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && npx tsc -b --noEmit 2>&1 | head -20`
Expected:
  - Exit code: 0
  - 无 error TS 输出（新字段全部可选，旧代码不破）

- [ ] **Step 3: 提交**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && git add src/types/index.ts && git commit -m "refactor(types): extend AlgorithmStep with callStack and multi-solver types"`

---

### Task 2: make public 84 仓库 + 增强 workflow 触发条件

**Depends on:** None
**Files:**
- Modify: GitHub 仓库 `fuck-algorithm/leetcode-84-largest-rectangle-in-histogram`（visibility private→public）
- Modify: `.github/workflows/deploy.yml:1-53`（加 pull_request 触发 + paths-ignore）
- Modify: `src/utils/github.ts:1-49`（确认指向 84，加注释说明为何用 84 而非 85）

- [ ] **Step 1: make public 84 仓库 — 修复 Header 里 GitHub 链接的 404**

为什么需要：`src/utils/github.ts` 写死指向 84 仓库（85 是从 84 fork 的模板，stars 计数归 84 母仓）。84 当前 private 导致链接 404、stars API 失败。

```bash
gh repo edit fuck-algorithm/leetcode-84-largest-rectangle-in-histogram --visibility public --accept-visibility-change-consequences
```

- [ ] **Step 2: 验证 84 仓库已 public — 确认未授权访问不再 404**

Run: `curl -s -o /dev/null -w "%{http_code}" https://api.github.com/repos/fuck-algorithm/leetcode-84-largest-rectangle-in-histogram`
Expected:
  - Output: `200`

- [ ] **Step 3: 修改 deploy.yml — 加 pull_request 触发（仅构建不部署）+ paths-ignore 避免文档改动无谓部署**

为什么需要：现有只 `push: [main]` 触发。"代码变更即部署"已满足，但 PR 阶段无法预览构建是否通过。加 `pull_request` 跑 build job 提前发现问题；`paths-ignore` 忽略 docs/md 改动。

文件: `.github/workflows/deploy.yml`（整文件替换）

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
    paths-ignore:
      - 'docs/**'
      - '*.md'
      - 'LICENSE'
  pull_request:
    paths-ignore:
      - 'docs/**'
      - '*.md'
      - 'LICENSE'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    # 仅 main 分支的 push 与手动触发才真正部署；PR 只构建不部署
    if: github.event_name == 'push' && github.ref == 'refs/heads/main' || github.event_name == 'workflow_dispatch'
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: 修改 utils/github.ts — 加注释说明为何 REPO_NAME 用 84**

为什么需要：避免后续维护者误改成 85。84 是母仓（stars 统计源），85 是 fork 的可视化仓。

文件: `src/utils/github.ts:1-9`（替换头部常量与注释区）

```typescript
// src/utils/github.ts（仅替换第 1-9 行的常量定义区）
import { getCache, setCache, getCacheEvenExpired } from './storage';

// 仓库指向 84（柱状图最大矩形）母仓：85 的可视化项目从 84 派生，
// GitHub stars 计数统一归 84 母仓，故此处用 84 而非 85。
// 84 仓库已于本计划 Task 2 改为 public，链接与 stars API 均可正常访问。
const REPO_OWNER = 'fuck-algorithm';
const REPO_NAME = 'leetcode-84-largest-rectangle-in-histogram';
const CACHE_KEY = 'github-stars';
const CACHE_TTL = 60 * 60 * 1000; // 1小时

export const GITHUB_REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
```

- [ ] **Step 5: 验证 workflow 语法与本地构建 — 确认 yml 合法、代码可编译**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && npx tsc -b --noEmit 2>&1 | head -10 && echo "---tsc done---" && npm run build 2>&1 | tail -5`
Expected:
  - Exit code: 0
  - 输出含 `built in`

- [ ] **Step 6: 提交**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && git add .github/workflows/deploy.yml src/utils/github.ts && git commit -m "ci: enhance workflow with PR build trigger and make 84 repo public"`

---

### Task 3: 新增三个解法生成器（暴力/分治/DP）

**Depends on:** Task 1
**Files:**
- Create: `src/algorithm/bruteForce.ts`
- Create: `src/algorithm/divideConquer.ts`
- Create: `src/algorithm/dp.ts`

- [ ] **Step 1: 创建 bruteForce.ts — 暴力法 O(n²)，枚举每对左右边界**

为什么需要：多解法演示的第一个解法，逻辑最直白，作为对照。

```typescript
// src/algorithm/bruteForce.ts
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
```

- [ ] **Step 2: 创建 divideConquer.ts — 分治法，找最小高度柱切分**

为什么需要：分治是第二经典解法，递归调用栈能很好展示 callStack 价值。

```typescript
// src/algorithm/divideConquer.ts
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

  function solve(l: number, r: number, depth: number) {
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
    solve(l, minIdx - 1, depth + 1);
    solve(minIdx + 1, r, depth + 1);
  }

  solve(0, n - 1, 0);

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
```

- [ ] **Step 3: 创建 dp.ts — 动态规划，预计算左右边界数组**

为什么需要：DP 解法是单调栈的数组化版本，与单调栈形成对比，展示「同样思路不同实现」。

```typescript
// src/algorithm/dp.ts
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
```

- [ ] **Step 4: 验证三解法编译 — tsc 无错误**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && npx tsc -b --noEmit 2>&1 | head -15`
Expected:
  - Exit code: 0
  - 无 error TS 输出

- [ ] **Step 5: 提交**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && git add src/algorithm/bruteForce.ts src/algorithm/divideConquer.ts src/algorithm/dp.ts && git commit -m "feat(algorithm): add brute-force, divide-conquer, dp solvers with steps"`

---

### Task 4: 重构 codeData 为多解法代码集 + 创建 registry 统一接口

**Depends on:** Task 1, Task 3
**Files:**
- Modify: `src/algorithm/largestRectangle.ts`（加 algorithmId 字段到所有 step）
- Modify: `src/algorithm/codeData.ts:1-122`（改为 AlgorithmCodeData 结构 + 四解法代码）
- Create: `src/algorithm/registry.ts`（AlgorithmSolver 注册表）

- [ ] **Step 1: 修改 largestRectangle.ts — 给所有 step 加 algorithmId='monotonic-stack'**

为什么需要：Task 1 新增的 `algorithmId` 字段，单调栈解法要填上，使所有解法 step 自带解法标识。

文件: `src/algorithm/largestRectangle.ts`（在每个 `steps.push({` 的对象里紧跟 `id` 后加 `algorithmId: 'monotonic-stack',`）。由于该文件有 8 处 `steps.push`，逐个改易错，用 `replace_all` 批量注入：将 `id: stepId++,` 替换为 `id: stepId++,\n    algorithmId: 'monotonic-stack',`（首处初始化的 `id: 0` 手动处理）。

对 `src/algorithm/largestRectangle.ts:10`（空数组分支）替换：

```typescript
      id: 0,
      algorithmId: 'monotonic-stack',
      description: '输入数组为空，最大面积为 0',
```

对其余 8 处 `id: stepId++,` 执行 replace_all：

```typescript
    id: stepId++,
    algorithmId: 'monotonic-stack',
```

- [ ] **Step 2: 修改 codeData.ts — 改为 Record<AlgorithmId, Record<Language, CodeBlock>> 并补全四解法代码**

为什么需要：CodePanel 要按 `algorithmId + language` 取代码，必须改成嵌套结构。

文件: `src/algorithm/codeData.ts`（整文件替换）

```typescript
// src/algorithm/codeData.ts
import { Language, CodeBlock, AlgorithmCodeData, AlgorithmId } from '../types';

// 单调栈解法代码
const monotonicStackCode: Record<Language, CodeBlock> = {
  java: { language: 'java', code: `public int largestRectangleArea(int[] heights) {\n    int n = heights.length;\n    int[] left = new int[n];\n    int[] right = new int[n];\n    Arrays.fill(right, n);\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (int i = 0; i < n; i++) {\n        while (!stack.isEmpty() && heights[stack.peek()] >= heights[i]) {\n            right[stack.peek()] = i;\n            stack.pop();\n        }\n        left[i] = stack.isEmpty() ? -1 : stack.peek();\n        stack.push(i);\n    }\n    int ans = 0;\n    for (int i = 0; i < n; i++) {\n        ans = Math.max(ans, (right[i] - left[i] - 1) * heights[i]);\n    }\n    return ans;\n}`, lineCount: 17 },
  python: { language: 'python', code: `def largestRectangleArea(heights):\n    n = len(heights)\n    left, right = [-1]*n, [n]*n\n    stack = []\n    for i in range(n):\n        while stack and heights[stack[-1]] >= heights[i]:\n            right[stack[-1]] = i\n            stack.pop()\n        left[i] = stack[-1] if stack else -1\n        stack.append(i)\n    return max((right[i]-left[i]-1)*heights[i] for i in range(n)) if n else 0`, lineCount: 11 },
  golang: { language: 'golang', code: `func largestRectangleArea(heights []int) int {\n    n := len(heights)\n    left := make([]int, n)\n    right := make([]int, n)\n    for i := range right { right[i] = n }\n    stack := []int{}\n    for i := 0; i < n; i++ {\n        for len(stack) > 0 && heights[stack[len(stack)-1]] >= heights[i] {\n            right[stack[len(stack)-1]] = i\n            stack = stack[:len(stack)-1]\n        }\n        if len(stack) == 0 { left[i] = -1 } else { left[i] = stack[len(stack)-1] }\n        stack = append(stack, i)\n    }\n    ans := 0\n    for i := 0; i < n; i++ {\n        ans = max(ans, (right[i]-left[i]-1)*heights[i])\n    }\n    return ans\n}`, lineCount: 16 },
  javascript: { language: 'javascript', code: `function largestRectangleArea(heights) {\n    const n = heights.length;\n    const left = new Array(n).fill(-1);\n    const right = new Array(n).fill(n);\n    const stack = [];\n    for (let i = 0; i < n; i++) {\n        while (stack.length && heights[stack[stack.length-1]] >= heights[i]) {\n            right[stack[stack.length-1]] = i;\n            stack.pop();\n        }\n        left[i] = stack.length ? stack[stack.length-1] : -1;\n        stack.push(i);\n    }\n    let ans = 0;\n    for (let i = 0; i < n; i++) {\n        ans = Math.max(ans, (right[i] - left[i] - 1) * heights[i]);\n    }\n    return ans;\n}`, lineCount: 16 },
};

// 暴力法代码
const bruteForceCode: Record<Language, CodeBlock> = {
  java: { language: 'java', code: `public int largestRectangleArea(int[] heights) {\n    int n = heights.length;\n    int ans = 0;\n    for (int i = 0; i < n; i++) {\n        int h = heights[i];\n        int left = i;\n        while (left > 0 && heights[left-1] >= h) left--;\n        int right = i;\n        while (right < n-1 && heights[right+1] >= h) right++;\n        ans = Math.max(ans, (right-left+1)*h);\n    }\n    return ans;\n}`, lineCount: 10 },
  python: { language: 'python', code: `def largestRectangleArea(heights):\n    n = len(heights)\n    ans = 0\n    for i in range(n):\n        h = heights[i]\n        left = i\n        while left > 0 and heights[left-1] >= h: left -= 1\n        right = i\n        while right < n-1 and heights[right+1] >= h: right += 1\n        ans = max(ans, (right-left+1)*h)\n    return ans`, lineCount: 8 },
  golang: { language: 'golang', code: `func largestRectangleArea(heights []int) int {\n    n := len(heights)\n    ans := 0\n    for i := 0; i < n; i++ {\n        h := heights[i]\n        left := i\n        for left > 0 && heights[left-1] >= h { left-- }\n        right := i\n        for right < n-1 && heights[right+1] >= h { right++ }\n        ans = max(ans, (right-left+1)*h)\n    }\n    return ans\n}`, lineCount: 10 },
  javascript: { language: 'javascript', code: `function largestRectangleArea(heights) {\n    const n = heights.length;\n    let ans = 0;\n    for (let i = 0; i < n; i++) {\n        const h = heights[i];\n        let left = i;\n        while (left > 0 && heights[left-1] >= h) left--;\n        let right = i;\n        while (right < n-1 && heights[right+1] >= h) right++;\n        ans = Math.max(ans, (right-left+1)*h);\n    }\n    return ans;\n}`, lineCount: 10 },
};

// 分治法代码
const divideConquerCode: Record<Language, CodeBlock> = {
  java: { language: 'java', code: `public int largestRectangleArea(int[] heights) {\n    return solve(heights, 0, heights.length-1);\n}\nint solve(int[] h, int l, int r) {\n    if (l > r) return 0;\n    int minIdx = l;\n    for (int i = l+1; i <= r; i++) if (h[i] < h[minIdx]) minIdx = i;\n    int area = h[minIdx] * (r-l+1);\n    return Math.max(area, Math.max(solve(h, l, minIdx-1), solve(h, minIdx+1, r)));\n}`, lineCount: 10 },
  python: { language: 'python', code: `def largestRectangleArea(heights):\n    def solve(l, r):\n        if l > r: return 0\n        m = l\n        for i in range(l+1, r+1):\n            if heights[i] < heights[m]: m = i\n        area = heights[m] * (r-l+1)\n        return max(area, solve(l, m-1), solve(m+1, r))\n    return solve(0, len(heights)-1)`, lineCount: 8 },
  golang: { language: 'golang', code: `func largestRectangleArea(heights []int) int {\n    var solve func(l, r int) int\n    solve = func(l, r int) int {\n        if l > r { return 0 }\n        m := l\n        for i := l+1; i <= r; i++ { if heights[i] < heights[m] { m = i } }\n        area := heights[m] * (r-l+1)\n        return max(area, max(solve(l, m-1), solve(m+1, r)))\n    }\n    return solve(0, len(heights)-1)\n}`, lineCount: 9 },
  javascript: { language: 'javascript', code: `function largestRectangleArea(heights) {\n    function solve(l, r) {\n        if (l > r) return 0;\n        let m = l;\n        for (let i = l+1; i <= r; i++) if (heights[i] < heights[m]) m = i;\n        const area = heights[m] * (r-l+1);\n        return Math.max(area, solve(l, m-1), solve(m+1, r));\n    }\n    return solve(0, heights.length-1);\n}`, lineCount: 9 },
};

// DP 法代码
const dpCode: Record<Language, CodeBlock> = {
  java: { language: 'java', code: `public int largestRectangleArea(int[] heights) {\n    int n = heights.length;\n    int[] left = new int[n], right = new int[n];\n    for (int i = 0; i < n; i++) {\n        int p = i-1;\n        while (p >= 0 && heights[p] >= heights[i]) p = left[p];\n        left[i] = p;\n    }\n    for (int i = n-1; i >= 0; i--) {\n        int p = i+1;\n        while (p < n && heights[p] >= heights[i]) p = right[p];\n        right[i] = p;\n    }\n    int ans = 0;\n    for (int i = 0; i < n; i++) ans = Math.max(ans, (right[i]-left[i]-1)*heights[i]);\n    return ans;\n}`, lineCount: 13 },
  python: { language: 'python', code: `def largestRectangleArea(heights):\n    n = len(heights)\n    left, right = [0]*n, [0]*n\n    for i in range(n):\n        p = i-1\n        while p >= 0 and heights[p] >= heights[i]: p = left[p]\n        left[i] = p\n    for i in range(n-1, -1, -1):\n        p = i+1\n        while p < n and heights[p] >= heights[i]: p = right[p]\n        right[i] = p\n    return max((right[i]-left[i]-1)*heights[i] for i in range(n)) if n else 0`, lineCount: 11 },
  golang: { language: 'golang', code: `func largestRectangleArea(heights []int) int {\n    n := len(heights)\n    left, right := make([]int, n), make([]int, n)\n    for i := 0; i < n; i++ {\n        p := i-1\n        for p >= 0 && heights[p] >= heights[i] { p = left[p] }\n        left[i] = p\n    }\n    for i := n-1; i >= 0; i-- {\n        p := i+1\n        for p < n && heights[p] >= heights[i] { p = right[p] }\n        right[i] = p\n    }\n    ans := 0\n    for i := 0; i < n; i++ { ans = max(ans, (right[i]-left[i]-1)*heights[i]) }\n    return ans\n}`, lineCount: 13 },
  javascript: { language: 'javascript', code: `function largestRectangleArea(heights) {\n    const n = heights.length;\n    const left = new Array(n), right = new Array(n);\n    for (let i = 0; i < n; i++) {\n        let p = i-1;\n        while (p >= 0 && heights[p] >= heights[i]) p = left[p];\n        left[i] = p;\n    }\n    for (let i = n-1; i >= 0; i--) {\n        let p = i+1;\n        while (p < n && heights[p] >= heights[i]) p = right[p];\n        right[i] = p;\n    }\n    let ans = 0;\n    for (let i = 0; i < n; i++) ans = Math.max(ans, (right[i]-left[i]-1)*heights[i]);\n    return ans;\n}`, lineCount: 13 },
};

export const algorithmCodeData: AlgorithmCodeData = {
  'monotonic-stack': monotonicStackCode,
  'brute-force': bruteForceCode,
  'divide-conquer': divideConquerCode,
  'dp': dpCode,
};

export const algorithmThought: Record<AlgorithmId, string> = {
  'monotonic-stack': `## 单调栈解法\n### 核心思想\n维护单调递增栈，O(n) 找每根柱子左右第一个更矮位置。\n### 复杂度\n时间 O(n) 空间 O(n)`,
  'brute-force': `## 暴力法\n### 核心思想\n枚举每根柱子作为高度，向左右扩展直到遇到更矮柱子。\n### 复杂度\n时间 O(n²) 空间 O(1)`,
  'divide-conquer': `## 分治法\n### 核心思想\n区间最矮柱决定面积，分左右递归取最大。\n### 复杂度\n平均 O(n log n) 最坏 O(n²)`,
  'dp': `## 动态规划\n### 核心思想\n用 left/right 数组记录每根柱子左右第一个更矮位置（非栈实现）。\n### 复杂度\n时间 O(n) 空间 O(n)`,
};
```

- [ ] **Step 3: 创建 registry.ts — 统一 AlgorithmSolver 注册表**

为什么需要：App 切换解法时不该 if/else，统一从 registry 取 solver。

```typescript
// src/algorithm/registry.ts
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
```

- [ ] **Step 4: 验证编译 — tsc 应通过（CodePanel 暂时仍 import 旧 algorithmCodes，会报错，预期内）**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && npx tsc -b --noEmit 2>&1 | head -20`
Expected:
  - 输出含 `algorithmCodes` 相关的 "已弃用/不存在" 错误（因为 CodePanel 还引用旧导出名）—— 这是预期的，Task 6 会修。只要没有其他错误即可继续。

- [ ] **Step 5: 提交**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && git add src/algorithm/largestRectangle.ts src/algorithm/codeData.ts src/algorithm/registry.ts && git commit -m "refactor(algorithm): multi-solver codeData and registry, tag monotonic-stack steps"`

---

### Task 5: 创建 DebugPanel 组件 — 变量面板 + 调用栈面板

**Depends on:** Task 1
**Files:**
- Create: `src/components/CodePanel/DebugPanel.tsx`
- Create: `src/components/CodePanel/DebugPanel.module.css`

- [ ] **Step 1: 创建 DebugPanel.tsx — 渲染当前 step 的 variables 与 callStack**

为什么需要：用户要求「展示变量最新值」和「观察调用栈」。独立组件便于复用与测试。

```typescript
// src/components/CodePanel/DebugPanel.tsx
import { AlgorithmStep } from '../../types';
import styles from './DebugPanel.module.css';

interface DebugPanelProps {
  currentStep: AlgorithmStep | null;
}

export function DebugPanel({ currentStep }: DebugPanelProps) {
  const variables = currentStep?.variables || {};
  const callStack = currentStep?.callStack || [];
  const varEntries = Object.entries(variables);

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>变量</div>
        {varEntries.length === 0 ? (
          <div className={styles.empty}>（无变量）</div>
        ) : (
          <table className={styles.varTable}>
            <tbody>
              {varEntries.map(([key, value]) => (
                <tr key={key} className={styles.varRow}>
                  <td className={styles.varKey}>{key}</td>
                  <td className={styles.varValue}>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>调用栈</div>
        {callStack.length === 0 ? (
          <div className={styles.empty}>（空栈）</div>
        ) : (
          <div className={styles.stackList}>
            {callStack.map((frame, idx) => {
              const locals = Object.entries(frame.locals);
              return (
                <div key={idx} className={`${styles.frame} ${idx === 0 ? styles.frameTop : ''}`}>
                  <div className={styles.frameHeader}>
                    <span className={styles.frameName}>{frame.functionName}</span>
                    <span className={styles.frameLine}>:L{frame.line}</span>
                  </div>
                  {locals.length > 0 && (
                    <div className={styles.frameLocals}>
                      {locals.map(([k, v]) => (
                        <span key={k} className={styles.local}>
                          <span className={styles.localKey}>{k}</span>=<span className={styles.localVal}>{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 DebugPanel.module.css — 调试视图样式（LeetCode 浅色风）**

为什么需要：DebugPanel 引用 styles，缺失会编译报错。用浅色卡片风格匹配代码区。

```css
.container {
  border-top: 1px solid var(--border-color);
  background: #fafafa;
  font-size: 12px;
}

.section {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
}

.section:last-child {
  border-bottom: none;
}

.sectionTitle {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.empty {
  color: #999;
  font-size: 11px;
  font-style: italic;
}

.varTable {
  width: 100%;
  border-collapse: collapse;
}

.varRow {
  border-bottom: 1px solid #f0f0f0;
}

.varKey {
  color: var(--primary-color);
  font-family: 'SFMono-Regular', Consolas, monospace;
  padding: 3px 6px 3px 0;
  width: 45%;
  vertical-align: top;
}

.varValue {
  color: var(--text-color);
  font-family: 'SFMono-Regular', Consolas, monospace;
  padding: 3px 0;
}

.stackList {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.frame {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 6px 8px;
}

.frameTop {
  border-color: var(--primary-color);
  background: #e6f7ff;
}

.frameHeader {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.frameName {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-weight: 600;
  color: var(--text-color);
  font-size: 11px;
}

.frameLine {
  color: var(--text-secondary);
  font-size: 10px;
}

.frameLocals {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
}

.local {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
  color: var(--text-secondary);
}

.localKey {
  color: #c41d7f;
}

.localVal {
  color: #003a70;
  font-weight: 600;
}
```

- [ ] **Step 3: 验证 DebugPanel 编译 — tsc 通过**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && npx tsc -b --noEmit 2>&1 | grep -i "DebugPanel" | head`
Expected:
  - 无 DebugPanel 相关错误输出（其他旧 CodePanel 错误仍存，预期内）

- [ ] **Step 4: 提交**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && git add src/components/CodePanel/DebugPanel.tsx src/components/CodePanel/DebugPanel.module.css && git commit -m "feat(ui): add DebugPanel for variables and call stack display"`

---

### Task 6: 重构 CodePanel — LeetCode 风格 + 挂载 DebugPanel + 接多解法代码

**Depends on:** Task 4, Task 5
**Files:**
- Modify: `src/components/CodePanel/CodePanel.tsx:1-115`（整文件替换）
- Modify: `src/components/CodePanel/CodePanel.module.css:1-末尾`（加 debug 区/行高亮样式）

- [ ] **Step 1: 修改 CodePanel.tsx — 接收 algorithmId、用 algorithmCodeData、挂 DebugPanel、移除 hacky getLineVariables**

为什么需要：用户要求「语法高亮、不混入前端样式代码、debug 行高亮、变量最新值、调用栈、多语言切换」。现有 CodePanel 用 `algorithmCodes`（旧名）+ hacky 变量过滤，需改为正经实现。

文件: `src/components/CodePanel/CodePanel.tsx`（整文件替换）

```typescript
// src/components/CodePanel/CodePanel.tsx
import { useEffect, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Language, AlgorithmStep, AlgorithmId } from '../../types';
import { algorithmCodeData } from '../../algorithm/codeData';
import { saveLanguage, getLanguage } from '../../utils/storage';
import { DebugPanel } from './DebugPanel';
import styles from './CodePanel.module.css';

interface CodePanelProps {
  currentStep: AlgorithmStep | null;
  algorithmId: AlgorithmId;
}

const LANGUAGE_LABELS: Record<Language, string> = {
  java: 'Java',
  python: 'Python',
  golang: 'Go',
  javascript: 'JavaScript',
};

const PRISM_LANGUAGES: Record<Language, string> = {
  java: 'java',
  python: 'python',
  golang: 'go',
  javascript: 'javascript',
};

export function CodePanel({ currentStep, algorithmId }: CodePanelProps) {
  const [language, setLanguage] = useState<Language>('java');

  useEffect(() => {
    getLanguage().then(setLanguage);
  }, []);

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    await saveLanguage(lang);
  };

  const codeBlock = algorithmCodeData[algorithmId][language];
  const highlightLines = currentStep?.codeLines[language] || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>算法代码</span>
        <div className={styles.tabs}>
          {(Object.keys(LANGUAGE_LABELS) as Language[]).map(lang => (
            <button
              key={lang}
              className={`${styles.tab} ${language === lang ? styles.active : ''}`}
              onClick={() => handleLanguageChange(lang)}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.codeWrapper}>
        <Highlight
          theme={themes.vsDark}
          code={codeBlock.code}
          language={PRISM_LANGUAGES[language]}
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre className={styles.pre} style={style}>
              {tokens.map((line, i) => {
                const lineNum = i + 1;
                const isHighlighted = highlightLines.includes(lineNum);
                return (
                  <div
                    key={i}
                    {...getLineProps({ line })}
                    className={`${styles.line} ${isHighlighted ? styles.highlighted : ''}`}
                  >
                    <span className={styles.lineNumber}>{lineNum}</span>
                    <span className={styles.lineContent}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>

      <DebugPanel currentStep={currentStep} />
    </div>
  );
}
```

- [ ] **Step 2: 修改 CodePanel.module.css — 调整为 LeetCode 风格（浅色行号栏 + 黄底高亮行）**

为什么需要：用户要 LeetCode/VSCode 风格。现有用 oneDark 深色，改 `themes.vsDark`（Step1 已用）配合深色行高亮；行高亮用黄底。

文件: `src/components/CodePanel/CodePanel.module.css`（整文件替换）

```css
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #252526;
  border-bottom: 1px solid #333;
}

.title {
  font-size: 13px;
  color: #cccccc;
  font-weight: 500;
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab {
  padding: 4px 10px;
  background: transparent;
  color: #969696;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s;
}

.tab:hover {
  background: #2d2d2d;
  color: #cccccc;
}

.tab.active {
  background: #0b6623;
  color: white;
}

.codeWrapper {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.pre {
  margin: 0;
  padding: 8px 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.line {
  display: flex;
  align-items: flex-start;
  padding: 0 8px;
}

.line:hover {
  background: rgba(255, 255, 255, 0.04);
}

.lineNumber {
  display: inline-block;
  width: 40px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 12px;
  color: #606060;
  user-select: none;
}

.lineContent {
  flex: 1;
  white-space: pre;
}

.highlighted {
  background: rgba(255, 213, 0, 0.15);
  border-left: 3px solid #ffd500;
  padding-left: 5px;
}
```

- [ ] **Step 3: 验证编译与构建 — tsc 通过、build 产出 dist**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && npx tsc -b --noEmit 2>&1 | head -15 && echo "---tsc---" && npm run build 2>&1 | tail -5`
Expected:
  - Exit code: 0
  - 无 error TS，输出含 `built in`

- [ ] **Step 4: 提交**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && git add src/components/CodePanel/CodePanel.tsx src/components/CodePanel/CodePanel.module.css && git commit -m "feat(ui): refactor CodePanel with multi-solver code, DebugPanel, LeetCode style"`

---

### Task 7: Header 增加题目描述弹窗 + 修复 GitHub 链接上下文

**Depends on:** Task 2
**Files:**
- Create: `src/data/problemDescription.ts`
- Create: `src/components/Header/ProblemDescriptionModal.tsx`
- Create: `src/components/Header/ProblemDescriptionModal.module.css`
- Modify: `src/components/Header/Header.tsx:1-89`（加按钮、接 Modal、改标题为 85）

- [ ] **Step 1: 创建 problemDescription.ts — 题目描述内容（LeetCode 85 原题）**

为什么需要：题目描述弹窗需要数据源。

```typescript
// src/data/problemDescription.ts
export const problemDescription = {
  number: 85,
  title: '最大矩形',
  difficulty: '困难' as const,
  content: `给定一个仅包含 0 和 1 、大小为 rows x cols 的二维二进制矩阵，找出只包含 1 的最大矩形，并返回其面积。

示例 1：
输入：matrix = [["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]
输出：6

示例 2：
输入：matrix = [["0"]]
输出：0

示例 3：
输入：matrix = [["1"]]
输出：1

提示：
- rows == matrix.length
- cols == matrix[0].length
- 1 <= row, cols <= 200
- matrix[i][j] 为 '0' 或 '1'

注意：本题可视化为「柱状图最大矩形」（LeetCode 84）—— 把每列连续的 1 看作柱高，逐行转化为 heights 数组后用单调栈求解。`,
  link: 'https://leetcode.cn/problems/maximal-rectangle/',
};
```

- [ ] **Step 2: 创建 ProblemDescriptionModal.tsx — 题目描述弹窗组件**

为什么需要：复用 Header 的 modal 模式，但内容独立。

```typescript
// src/components/Header/ProblemDescriptionModal.tsx
import { problemDescription } from '../../data/problemDescription';
import styles from './ProblemDescriptionModal.module.css';

interface Props {
  onClose: () => void;
}

export function ProblemDescriptionModal({ onClose }: Props) {
  const { number, title, difficulty, content, link } = problemDescription;
  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        <div className={styles.header}>
          <span className={styles.number}>{number}. {title}</span>
          <span className={styles.difficulty}>{difficulty}</span>
        </div>
        <a className={styles.link} href={link} target="_blank" rel="noopener noreferrer">LeetCode 原题 ↗</a>
        <div className={styles.content}>
          {content.split('\n').map((line, i) => (
            <p key={i} className={line.trim() ? '' : styles.empty}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 ProblemDescriptionModal.module.css — 弹窗样式**

为什么需要：Modal 组件引用 styles。

```css
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modalContent {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 640px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.closeBtn {
  position: absolute;
  top: 12px; right: 12px;
  width: 28px; height: 28px;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 18px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.closeBtn:hover { background: #e8e8e8; }

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.number {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.difficulty {
  font-size: 12px;
  color: #ff4d4f;
  background: #fff1f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.link {
  display: inline-block;
  font-size: 13px;
  color: var(--primary-color);
  margin-bottom: 16px;
}

.content p {
  margin: 6px 0;
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 14px;
  white-space: pre-wrap;
}

.content p.empty { margin: 4px 0; }
```

- [ ] **Step 4: 修改 Header.tsx — 加【题目描述】按钮、接 Modal、标题改为 85**

为什么需要：用户要求「算法思路前面增加题目描述」。现有标题写死 84（L37），且 GitHub 链接指向 84（已 Task2 转 public）。

文件: `src/components/Header/Header.tsx`（整文件替换）

```typescript
// src/components/Header/Header.tsx
import { useState, useEffect } from 'react';
import { getGitHubStars, GITHUB_REPO_URL } from '../../utils/github';
import { algorithmThought } from '../../algorithm/codeData';
import { ProblemDescriptionModal } from './ProblemDescriptionModal';
import styles from './Header.module.css';

const LEETCODE_URL = 'https://leetcode.cn/problems/maximal-rectangle/';
const HOT100_URL = 'https://fuck-algorithm.github.io/leetcode-hot-100/';

export function Header({ algorithmId }: { algorithmId: string }) {
  const [stars, setStars] = useState<number>(0);
  const [showProblem, setShowProblem] = useState(false);
  const [showThought, setShowThought] = useState(false);

  useEffect(() => {
    getGitHubStars().then(setStars);
  }, []);

  const thought = algorithmThought[algorithmId as keyof typeof algorithmThought] || '';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <a href={HOT100_URL} target="_blank" rel="noopener noreferrer" className={styles.backLink}>
          ← 返回 LeetCode Hot 100
        </a>
      </div>

      <div className={styles.center}>
        <a href={LEETCODE_URL} target="_blank" rel="noopener noreferrer" className={styles.title}>
          85. 最大矩形
        </a>
      </div>

      <div className={styles.right}>
        <button className={styles.thoughtBtn} onClick={() => setShowProblem(true)}>
          📋 题目描述
        </button>
        <button className={styles.thoughtBtn} onClick={() => setShowThought(true)}>
          💡 算法思路
        </button>
        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className={styles.github} title="点击去 GitHub 仓库 Star 支持一下">
          <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <span className={styles.starCount}>⭐ {stars}</span>
        </a>
      </div>

      {showProblem && <ProblemDescriptionModal onClose={() => setShowProblem(false)} />}

      {showThought && (
        <div className={styles.modal} onClick={() => setShowThought(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowThought(false)}>×</button>
            <div className={styles.thoughtContent}>
              {thought.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
                if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>;
                if (line.trim()) return <p key={i}>{line}</p>;
                return null;
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 5: 验证编译 — tsc 通过（App 未传 algorithmId 给 Header 会报错，Task 10 修）**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && npx tsc -b --noEmit 2>&1 | head -15`
Expected:
  - 可能含 Header 未传 prop 的错误（Task 10 修），无其他错误

- [ ] **Step 6: 提交**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && git add src/data/problemDescription.ts src/components/Header/ && git commit -m "feat(ui): add problem description modal and fix Header to leetcode-85"`

---

### Task 8: ControlPanel 播放按钮水平居中

**Depends on:** None
**Files:**
- Modify: `src/components/ControlPanel/ControlPanel.module.css:32-37,81-84`

- [ ] **Step 1: 修改 ControlPanel.module.css — 控制按钮区改为居中布局**

为什么需要：现有 `.controls` 是 flex 默认左对齐，`.speedControl` 用 `margin-left:auto` 把速度按钮推到最右，导致主控按钮偏左。改 `.controls` 为 `justify-content: center`，speed 区用绝对定位或独立居中行。

文件: `src/components/ControlPanel/ControlPanel.module.css:32-37`（替换 `.controls` 区）与 `:81-84`（替换 `.speedControl`）

```css
.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}
```

```css
.speedControl {
  position: relative;
}
```

- [ ] **Step 2: 验证构建 — build 通过（纯样式改动不影响编译）**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && npm run build 2>&1 | tail -4`
Expected:
  - Exit code: 0
  - 输出含 `built in`

- [ ] **Step 3: 提交**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && git add src/components/ControlPanel/ControlPanel.module.css && git commit -m "style(ui): center control panel buttons horizontally"`

---

### Task 9: Canvas 抽组件 + 渲染 annotations（带方向箭头/示意线）

**Depends on:** Task 1
**Files:**
- Create: `src/components/Canvas/StackVisualization.tsx`
- Create: `src/components/Canvas/StackVisualization.module.css`
- Create: `src/components/Canvas/AnnotationsLayer.tsx`
- Modify: `src/components/Canvas/Canvas.tsx:111-263`（抽组件 + 加 annotations 渲染）
- Modify: `src/components/Canvas/Canvas.module.css:47-100`（移除已抽出的 stack 样式）

- [ ] **Step 1: 创建 StackVisualization.tsx — 单调栈可视化独立组件**

为什么需要：用户要求「单调栈抽为单独前端组件、有单独演示效果」。从 Canvas.tsx:236-249 抽出，并加更清晰的栈底→栈顶方向标注。

```typescript
// src/components/Canvas/StackVisualization.tsx
import { StackItem } from '../../types';
import styles from './StackVisualization.module.css';

interface Props {
  stack: StackItem[];
}

export function StackVisualization({ stack }: Props) {
  if (stack.length === 0) return null;
  return (
    <div className={styles.container}>
      <div className={styles.title}>单调栈（栈底→栈顶，递增）</div>
      <div className={styles.stack}>
        {stack.map((item, idx) => (
          <div key={idx} className={`${styles.item} ${idx === stack.length - 1 ? styles.top : ''}`}>
            <span className={styles.index}>idx={item.index}</span>
            <span className={styles.height}>h={item.height}</span>
            {idx === stack.length - 1 && <span className={styles.topTag}>栈顶</span>}
          </div>
        ))}
      </div>
      <div className={styles.bottom}>栈底</div>
      <div className={styles.hint}>高度单调递增，遇更矮柱则弹出栈顶</div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 StackVisualization.module.css — 栈组件样式**

为什么需要：组件引用 styles。

```css
.container {
  position: absolute;
  right: 16px;
  bottom: 16px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px;
  min-width: 130px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-color);
}

.stack {
  display: flex;
  flex-direction: column-reverse;
  gap: 4px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 8px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  font-size: 11px;
  transition: all 0.2s;
}

.item.top {
  background: #fff3cd;
  border-color: #faad14;
  border-width: 2px;
}

.index { font-weight: 600; color: var(--primary-color); }
.height { color: var(--text-secondary); }
.topTag { color: #faad14; font-weight: 600; font-size: 9px; }

.bottom {
  font-size: 10px;
  color: #999;
  text-align: center;
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px dashed var(--border-color);
}

.hint {
  font-size: 9px;
  color: #bfbfbf;
  text-align: center;
  margin-top: 4px;
}
```

- [ ] **Step 3: 创建 AnnotationsLayer.tsx — 渲染 text/arrow/highlight 标注**

为什么需要：用户要求「带方向的箭头、示意线」。现有 Canvas.tsx 完全没渲染 `currentStep.annotations`（根因）。用 SVG group 渲染。

```typescript
// src/components/Canvas/AnnotationsLayer.tsx
import { Annotation } from '../../types';

interface Props {
  annotations: Annotation[];
  // 坐标转换：annotation 的 x/y 是「柱子索引/高度值」语义，需转成 SVG 像素
  toY: (heightValue: number) => number;
  barCenterX: (barIndex: number) => number;
}

export function AnnotationsLayer({ annotations, toY, barCenterX }: Props) {
  return (
    <>
      {annotations.map(a => {
        if (a.type === 'text') {
          return (
            <text key={a.id} x={barCenterX(a.x)} y={toY(a.y)} textAnchor="middle" fontSize={11} fill={a.color || '#666'} fontWeight="bold">
              {a.text}
            </text>
          );
        }
        if (a.type === 'arrow' && a.fromX !== undefined && a.toX !== undefined && a.fromY !== undefined && a.toY !== undefined) {
          const x1 = barCenterX(a.fromX);
          const x2 = barCenterX(a.toX);
          const y = toY(a.fromY) - 18; // 箭头画在柱顶上方
          const midX = (x1 + x2) / 2;
          return (
            <g key={a.id}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={a.color || '#666'} strokeWidth={2} markerEnd="url(#arrowhead)" />
              {a.text && (
                <text x={midX} y={y - 6} textAnchor="middle" fontSize={10} fill={a.color || '#666'} fontWeight="600">
                  {a.text}
                </text>
              )}
            </g>
          );
        }
        return null;
      })}
    </>
  );
}
```

- [ ] **Step 4: 修改 Canvas.tsx — 抽出栈/面积组件、加 AnnotationsLayer、加 arrow marker**

为什么需要：用户要求「抽组件 + 更多箭头示意线」。Canvas 当前把栈面板(L236-249)和面积(L252-261)揉在主组件里，抽到子组件后 Canvas 更清晰。

文件: `src/components/Canvas/Canvas.tsx`（整文件替换）

```typescript
// src/components/Canvas/Canvas.tsx
import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { AlgorithmStep } from '../../types';
import { StackVisualization } from './StackVisualization';
import { AnnotationsLayer } from './AnnotationsLayer';
import styles from './Canvas.module.css';

interface CanvasProps {
  heights: number[];
  currentStep: AlgorithmStep | null;
}

interface Transform { x: number; y: number; scale: number; }

export function Canvas({ heights, currentStep }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 3]).on('zoom', (event) => {
      setTransform({ x: event.transform.x, y: event.transform.y, scale: event.transform.k });
    });
    d3.select(svg).call(zoom);
    return () => { d3.select(svg).on('.zoom', null); };
  }, []);

  const resetView = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    d3.select(svg).transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  const margin = { top: 60, right: 40, bottom: 120, left: 40 };
  const chartWidth = dimensions.width - margin.left - margin.right;
  const chartHeight = dimensions.height - margin.top - margin.bottom;
  const maxHeight = Math.max(...heights, 1);
  const barWidth = Math.min(60, (chartWidth - (heights.length - 1) * 4) / heights.length);
  const totalBarsWidth = heights.length * barWidth + (heights.length - 1) * 4;
  const startX = (chartWidth - totalBarsWidth) / 2;
  const yScale = d3.scaleLinear().domain([0, maxHeight]).range([chartHeight, 0]);

  const barCenterX = (barIndex: number) => startX + barIndex * (barWidth + 4) + barWidth / 2;

  const getBarColor = (index: number): string => {
    if (!currentStep) return '#1890ff';
    if (currentStep.highlightRect) {
      const { left, right } = currentStep.highlightRect;
      if (index >= left && index <= right) return '#52c41a';
    }
    if (currentStep.highlightBars.includes(index)) return '#faad14';
    if (currentStep.stack.some(s => s.index === index)) return '#1890ff';
    return '#91caff';
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.toolbar}>
        <button className={styles.resetBtn} onClick={resetView}>重置视图</button>
        <span className={styles.hint}>拖拽平移 · 滚轮缩放</span>
      </div>

      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className={styles.svg}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={currentStep?.annotations.find(a => a.type === 'arrow')?.color || '#666'} />
          </marker>
        </defs>
        <g transform={`translate(${transform.x + margin.left}, ${transform.y + margin.top}) scale(${transform.scale})`}>
          {heights.map((height, index) => {
            const x = startX + index * (barWidth + 4);
            const y = yScale(height);
            const barHeight = chartHeight - y;
            return (
              <g key={index}>
                <rect x={x} y={y} width={barWidth} height={barHeight} fill={getBarColor(index)} stroke="#fff" strokeWidth={1} rx={2} />
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize={12} fill="#333">{height}</text>
                <text x={x + barWidth / 2} y={chartHeight + 20} textAnchor="middle" fontSize={11} fill="#666">{index}</text>
                {currentStep && currentStep.leftBoundary[index] !== undefined && (
                  <text x={x + barWidth / 2} y={chartHeight + 36} textAnchor="middle" fontSize={10} fill="#faad14">L:{currentStep.leftBoundary[index]}</text>
                )}
                {currentStep && currentStep.rightBoundary[index] !== undefined && currentStep.rightBoundary[index] !== heights.length && (
                  <text x={x + barWidth / 2} y={chartHeight + 50} textAnchor="middle" fontSize={10} fill="#52c41a">R:{currentStep.rightBoundary[index]}</text>
                )}
              </g>
            );
          })}

          {currentStep?.highlightRect && (
            <rect
              x={startX + currentStep.highlightRect.left * (barWidth + 4)}
              y={yScale(currentStep.highlightRect.height)}
              width={(currentStep.highlightRect.right - currentStep.highlightRect.left + 1) * (barWidth + 4) - 4}
              height={chartHeight - yScale(currentStep.highlightRect.height)}
              fill="rgba(82, 196, 26, 0.2)" stroke="#52c41a" strokeWidth={2} strokeDasharray="4,2"
            />
          )}

          {currentStep && currentStep.currentIndex >= 0 && currentStep.currentIndex < heights.length && (
            <g>
              <polygon
                points={`${barCenterX(currentStep.currentIndex) - 8},${chartHeight + 65} ${barCenterX(currentStep.currentIndex) + 8},${chartHeight + 65} ${barCenterX(currentStep.currentIndex)},${chartHeight + 55}`}
                fill="#ff4d4f"
              />
              <text x={barCenterX(currentStep.currentIndex)} y={chartHeight + 80} textAnchor="middle" fontSize={11} fill="#ff4d4f" fontWeight="bold">i</text>
            </g>
          )}

          {currentStep && (
            <AnnotationsLayer
              annotations={currentStep.annotations}
              toY={(h) => yScale(h)}
              barCenterX={barCenterX}
            />
          )}
        </g>
      </svg>

      <StackVisualization stack={currentStep?.stack || []} />

      {currentStep?.currentArea !== undefined && (
        <div className={styles.areaDisplay}>
          当前面积: <span className={styles.areaValue}>{currentStep.currentArea}</span>
          {currentStep.maxArea > 0 && <> | 最大面积: <span className={styles.maxAreaValue}>{currentStep.maxArea}</span></>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 修改 Canvas.module.css — 移除已抽出的 stack 样式（保留 areaDisplay）**

为什么需要：栈样式已移到 StackVisualization.module.css，主 CSS 不该残留。

文件: `src/components/Canvas/Canvas.module.css:47-100`（删除 `.stackPanel` 到 `.stackBottom` 整块，保留 `.areaDisplay` 等）

替换 `.stackPanel`...`.stackBottom` 整块为空（删除），保留其后的 `.areaDisplay`、`.areaValue`、`.maxAreaValue`。具体：删除第 47-100 行，保留第 102-124 行。

- [ ] **Step 6: 验证编译与构建 — tsc 通过、build 产出 dist**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && npx tsc -b --noEmit 2>&1 | head -15 && echo "---" && npm run build 2>&1 | tail -5`
Expected:
  - Exit code: 0
  - 无 error TS，输出含 `built in`

- [ ] **Step 7: 提交**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && git add src/components/Canvas/ && git commit -m "feat(ui): extract StackVisualization, add AnnotationsLayer with directional arrows"`

---

### Task 10: App 集成多解法选择器 + 贯通全链路

**Depends on:** Task 4, Task 6, Task 7, Task 9
**Files:**
- Modify: `src/App.tsx:1-111`（加 algorithmId state + 解法选择器 + 传 props 给 Header/CodePanel）
- Modify: `src/App.module.css`（加解法选择器样式）

- [ ] **Step 1: 修改 App.tsx — 加解法选择器、切换解法重生成 steps、传 algorithmId**

为什么需要：所有子组件改造完成（CodePanel 要 algorithmId、Header 要 algorithmId、Canvas 渲染 annotations），App 需提供解法 state 并把 registry 接入。

文件: `src/App.tsx`（整文件替换）

```typescript
// src/App.tsx
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

  useEffect(() => {
    const solver = getSolver(algorithmId);
    setSteps(solver.generateSteps(heights));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [heights, algorithmId]);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      playIntervalRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, 1500 / speed);
    }
    return () => { if (playIntervalRef.current) clearInterval(playIntervalRef.current); };
  }, [isPlaying, speed, steps.length, currentStep]);

  useEffect(() => {
    if (currentStep >= steps.length - 1) setIsPlaying(false);
  }, [currentStep, steps.length]);

  const handleDataChange = useCallback((newHeights: number[]) => setHeights(newHeights), []);
  const handleStepChange = useCallback((step: number) => setCurrentStep(step), []);
  const handlePlayPause = useCallback(() => {
    if (currentStep >= steps.length - 1) { setCurrentStep(0); setIsPlaying(true); }
    else setIsPlaying(prev => !prev);
  }, [currentStep, steps.length]);
  const handleReset = useCallback(() => { setCurrentStep(0); setIsPlaying(false); }, []);
  const handleSpeedChange = useCallback((newSpeed: number) => setSpeed(newSpeed), []);
  const handleAlgorithmChange = useCallback((id: AlgorithmId) => { setAlgorithmId(id); }, []);

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
        currentStep={currentStep} totalSteps={steps.length} isPlaying={isPlaying}
        onStepChange={handleStepChange} onPlayPause={handlePlayPause} onReset={handleReset}
        speed={speed} onSpeedChange={handleSpeedChange}
        stepDescription={currentStepData?.description || ''}
      />
      <WeChatFloat />
    </div>
  );
}

export default App;
```

- [ ] **Step 2: 修改 App.module.css — 加解法选择器栏样式**

为什么需要：App.tsx 引用了 `styles.solverBar/solverBtn/solverActive/complexity`，需定义。

文件: `src/App.module.css`（追加解法选择器样式到文件末尾）

```css
.solverBar {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  overflow-x: auto;
}

.solverBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #f5f5f5;
  color: var(--text-color);
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s;
}

.solverBtn:hover {
  background: #e8e8e8;
}

.solverActive {
  background: var(--primary-color);
  color: white;
}

.complexity {
  font-size: 11px;
  opacity: 0.8;
  font-family: 'SFMono-Regular', Consolas, monospace;
}
```

- [ ] **Step 3: 验证全量编译与构建 — tsc 零错误、build 产出 dist**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && npx tsc -b --noEmit 2>&1 | head -20 && echo "===tsc done===" && npm run build 2>&1 | tail -6`
Expected:
  - Exit code: 0
  - tsc 无任何 error TS
  - build 输出含 `built in` 与 `dist/index.html`

- [ ] **Step 4: 提交并推送触发部署**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && git add src/App.tsx src/App.module.css && git commit -m "feat(app): integrate multi-solver selector and wire all components" && git push origin main`
Expected:
  - Exit code: 0
  - push 输出含 `main -> main`

- [ ] **Step 5: 验证 workflow 部署成功 — 等 Actions 跑完，站点 200**

Run: `cd /home/cc11001100/github/fuck-algorithm/leetcode-85-maximal-rectangle && sleep 10 && gh run watch --exit-status $(gh run list --workflow=deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId') 2>&1 | tail -5`
Expected:
  - Exit code: 0
  - 输出含 success / completed

- [ ] **Step 6: 验证站点可访问 — 确认新版上线**

Run: `for i in 1 2 3 4 5 6; do code=$(curl -s -o /dev/null -w "%{http_code}" https://fuck-algorithm.github.io/leetcode-85-maximal-rectangle/); echo "attempt $i: $code"; [ "$code" = "200" ] && break; sleep 20; done; test "$code" = "200"`
Expected:
  - Exit code: 0
  - 输出含 `200`
