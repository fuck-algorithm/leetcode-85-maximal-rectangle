import { Language, CodeBlock, AlgorithmCodeData, AlgorithmId } from '../types';

// 单调栈解法代码
const monotonicStackCode: Record<Language, CodeBlock> = {
  java: { language: 'java', code: `public int largestRectangleArea(int[] heights) {
    int n = heights.length;
    int[] left = new int[n];
    int[] right = new int[n];
    Arrays.fill(right, n);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && heights[stack.peek()] >= heights[i]) {
            right[stack.peek()] = i;
            stack.pop();
        }
        left[i] = stack.isEmpty() ? -1 : stack.peek();
        stack.push(i);
    }
    int ans = 0;
    for (int i = 0; i < n; i++) {
        ans = Math.max(ans, (right[i] - left[i] - 1) * heights[i]);
    }
    return ans;
}`, lineCount: 17 },
  python: { language: 'python', code: `def largestRectangleArea(heights):
    n = len(heights)
    left, right = [-1]*n, [n]*n
    stack = []
    for i in range(n):
        while stack and heights[stack[-1]] >= heights[i]:
            right[stack[-1]] = i
            stack.pop()
        left[i] = stack[-1] if stack else -1
        stack.append(i)
    return max((right[i]-left[i]-1)*heights[i] for i in range(n)) if n else 0`, lineCount: 11 },
  golang: { language: 'golang', code: `func largestRectangleArea(heights []int) int {
    n := len(heights)
    left := make([]int, n)
    right := make([]int, n)
    for i := range right { right[i] = n }
    stack := []int{}
    for i := 0; i < n; i++ {
        for len(stack) > 0 && heights[stack[len(stack)-1]] >= heights[i] {
            right[stack[len(stack)-1]] = i
            stack = stack[:len(stack)-1]
        }
        if len(stack) == 0 { left[i] = -1 } else { left[i] = stack[len(stack)-1] }
        stack = append(stack, i)
    }
    ans := 0
    for i := 0; i < n; i++ {
        ans = max(ans, (right[i]-left[i]-1)*heights[i])
    }
    return ans
}`, lineCount: 16 },
  javascript: { language: 'javascript', code: `function largestRectangleArea(heights) {
    const n = heights.length;
    const left = new Array(n).fill(-1);
    const right = new Array(n).fill(n);
    const stack = [];
    for (let i = 0; i < n; i++) {
        while (stack.length && heights[stack[stack.length-1]] >= heights[i]) {
            right[stack[stack.length-1]] = i;
            stack.pop();
        }
        left[i] = stack.length ? stack[stack.length-1] : -1;
        stack.push(i);
    }
    let ans = 0;
    for (let i = 0; i < n; i++) {
        ans = Math.max(ans, (right[i] - left[i] - 1) * heights[i]);
    }
    return ans;
}`, lineCount: 16 },
};

// 暴力法代码
const bruteForceCode: Record<Language, CodeBlock> = {
  java: { language: 'java', code: `public int largestRectangleArea(int[] heights) {
    int n = heights.length;
    int ans = 0;
    for (int i = 0; i < n; i++) {
        int h = heights[i];
        int left = i;
        while (left > 0 && heights[left-1] >= h) left--;
        int right = i;
        while (right < n-1 && heights[right+1] >= h) right++;
        ans = Math.max(ans, (right-left+1)*h);
    }
    return ans;
}`, lineCount: 10 },
  python: { language: 'python', code: `def largestRectangleArea(heights):
    n = len(heights)
    ans = 0
    for i in range(n):
        h = heights[i]
        left = i
        while left > 0 and heights[left-1] >= h: left -= 1
        right = i
        while right < n-1 and heights[right+1] >= h: right += 1
        ans = max(ans, (right-left+1)*h)
    return ans`, lineCount: 8 },
  golang: { language: 'golang', code: `func largestRectangleArea(heights []int) int {
    n := len(heights)
    ans := 0
    for i := 0; i < n; i++ {
        h := heights[i]
        left := i
        for left > 0 && heights[left-1] >= h { left-- }
        right := i
        for right < n-1 && heights[right+1] >= h { right++ }
        ans = max(ans, (right-left+1)*h)
    }
    return ans
}`, lineCount: 10 },
  javascript: { language: 'javascript', code: `function largestRectangleArea(heights) {
    const n = heights.length;
    let ans = 0;
    for (let i = 0; i < n; i++) {
        const h = heights[i];
        let left = i;
        while (left > 0 && heights[left-1] >= h) left--;
        let right = i;
        while (right < n-1 && heights[right+1] >= h) right++;
        ans = Math.max(ans, (right-left+1)*h);
    }
    return ans;
}`, lineCount: 10 },
};

// 分治法代码
const divideConquerCode: Record<Language, CodeBlock> = {
  java: { language: 'java', code: `public int largestRectangleArea(int[] heights) {
    return solve(heights, 0, heights.length-1);
}
int solve(int[] h, int l, int r) {
    if (l > r) return 0;
    int minIdx = l;
    for (int i = l+1; i <= r; i++) if (h[i] < h[minIdx]) minIdx = i;
    int area = h[minIdx] * (r-l+1);
    return Math.max(area, Math.max(solve(h, l, minIdx-1), solve(h, minIdx+1, r)));
}`, lineCount: 10 },
  python: { language: 'python', code: `def largestRectangleArea(heights):
    def solve(l, r):
        if l > r: return 0
        m = l
        for i in range(l+1, r+1):
            if heights[i] < heights[m]: m = i
        area = heights[m] * (r-l+1)
        return max(area, solve(l, m-1), solve(m+1, r))
    return solve(0, len(heights)-1)`, lineCount: 8 },
  golang: { language: 'golang', code: `func largestRectangleArea(heights []int) int {
    var solve func(l, r int) int
    solve = func(l, r int) int {
        if l > r { return 0 }
        m := l
        for i := l+1; i <= r; i++ { if heights[i] < heights[m] { m = i } }
        area := heights[m] * (r-l+1)
        return max(area, max(solve(l, m-1), solve(m+1, r)))
    }
    return solve(0, len(heights)-1)
}`, lineCount: 9 },
  javascript: { language: 'javascript', code: `function largestRectangleArea(heights) {
    function solve(l, r) {
        if (l > r) return 0;
        let m = l;
        for (let i = l+1; i <= r; i++) if (heights[i] < heights[m]) m = i;
        const area = heights[m] * (r-l+1);
        return Math.max(area, solve(l, m-1), solve(m+1, r));
    }
    return solve(0, heights.length-1);
}`, lineCount: 9 },
};

// DP 法代码
const dpCode: Record<Language, CodeBlock> = {
  java: { language: 'java', code: `public int largestRectangleArea(int[] heights) {
    int n = heights.length;
    int[] left = new int[n], right = new int[n];
    for (int i = 0; i < n; i++) {
        int p = i-1;
        while (p >= 0 && heights[p] >= heights[i]) p = left[p];
        left[i] = p;
    }
    for (int i = n-1; i >= 0; i--) {
        int p = i+1;
        while (p < n && heights[p] >= heights[i]) p = right[p];
        right[i] = p;
    }
    int ans = 0;
    for (int i = 0; i < n; i++) ans = Math.max(ans, (right[i]-left[i]-1)*heights[i]);
    return ans;
}`, lineCount: 13 },
  python: { language: 'python', code: `def largestRectangleArea(heights):
    n = len(heights)
    left, right = [0]*n, [0]*n
    for i in range(n):
        p = i-1
        while p >= 0 and heights[p] >= heights[i]: p = left[p]
        left[i] = p
    for i in range(n-1, -1, -1):
        p = i+1
        while p < n and heights[p] >= heights[i]: p = right[p]
        right[i] = p
    return max((right[i]-left[i]-1)*heights[i] for i in range(n)) if n else 0`, lineCount: 11 },
  golang: { language: 'golang', code: `func largestRectangleArea(heights []int) int {
    n := len(heights)
    left, right := make([]int, n), make([]int, n)
    for i := 0; i < n; i++ {
        p := i-1
        for p >= 0 && heights[p] >= heights[i] { p = left[p] }
        left[i] = p
    }
    for i := n-1; i >= 0; i-- {
        p := i+1
        for p < n && heights[p] >= heights[i] { p = right[p] }
        right[i] = p
    }
    ans := 0
    for i := 0; i < n; i++ { ans = max(ans, (right[i]-left[i]-1)*heights[i]) }
    return ans
}`, lineCount: 13 },
  javascript: { language: 'javascript', code: `function largestRectangleArea(heights) {
    const n = heights.length;
    const left = new Array(n), right = new Array(n);
    for (let i = 0; i < n; i++) {
        let p = i-1;
        while (p >= 0 && heights[p] >= heights[i]) p = left[p];
        left[i] = p;
    }
    for (let i = n-1; i >= 0; i--) {
        let p = i+1;
        while (p < n && heights[p] >= heights[i]) p = right[p];
        right[i] = p;
    }
    let ans = 0;
    for (let i = 0; i < n; i++) ans = Math.max(ans, (right[i]-left[i]-1)*heights[i]);
    return ans;
}`, lineCount: 13 },
};

export const algorithmCodeData: AlgorithmCodeData = {
  'monotonic-stack': monotonicStackCode,
  'brute-force': bruteForceCode,
  'divide-conquer': divideConquerCode,
  'dp': dpCode,
};

export const algorithmThought: Record<AlgorithmId, string> = {
  'monotonic-stack': `## 单调栈解法
### 核心思想
维护单调递增栈，一次遍历同时求出每根柱子左右第一个更矮的位置，从而确定以每根柱子高度为高的最大矩形。
### 复杂度
时间 O(n) 空间 O(n)
### 关键点
- 栈中存的是下标，对应高度单调递增
- 遇到更矮柱子时弹出栈顶，弹出的柱子右边界即当前下标
- 当前柱子左边界即弹出后的新栈顶`,
  'brute-force': `## 暴力法
### 核心思想
枚举每根柱子作为矩形高度，向左右扩展直到遇到更矮的柱子，宽度 × 高度即得面积。
### 复杂度
时间 O(n²) 空间 O(1)
### 关键点
- 思路最直观，作为对照基准
- 最坏情况下每根柱子都要扫描整个数组`,
  'divide-conquer': `## 分治法
### 核心思想
区间内最矮柱决定该区间矩形面积，以最矮柱为界分左右两半递归取最大。
### 复杂度
平均 O(n log n)，最坏 O(n²)（数组已有序时）
### 关键点
- 递归调用栈是本解法的看点
- 可用线段树/笛卡尔树优化找最小值到 O(n log n)`,
  'dp': `## 动态规划
### 核心思想
用 left/right 数组记录每根柱子左右第一个更矮位置，通过 left[p] 跳跃加速（与单调栈思路同源，但用数组而非栈实现）。
### 复杂度
时间 O(n) 空间 O(n)
### 关键点
- left[i] 跳跃利用已计算的 left 值，避免重复扫描
- 与单调栈本质等价，实现形式不同`,
};
