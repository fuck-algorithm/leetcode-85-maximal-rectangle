import { Language, CodeBlock } from '../types';

export const algorithmCodes: Record<Language, CodeBlock> = {
  java: {
    language: 'java',
    code: `public int largestRectangleArea(int[] heights) {
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
}`,
    lineCount: 20,
  },
  python: {
    language: 'python',
    code: `def largestRectangleArea(heights: List[int]) -> int:
    n = len(heights)
    left, right = [-1] * n, [n] * n
    
    stack = []
    for i in range(n):
        while stack and heights[stack[-1]] >= heights[i]:
            right[stack[-1]] = i
            stack.pop()
        left[i] = stack[-1] if stack else -1
        stack.append(i)
    
    return max((right[i] - left[i] - 1) * heights[i] 
               for i in range(n)) if n else 0`,
    lineCount: 13,
  },
  golang: {
    language: 'golang',
    code: `func largestRectangleArea(heights []int) int {
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
}`,
    lineCount: 20,
  },
  javascript: {
    language: 'javascript',
    code: `function largestRectangleArea(heights) {
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
}`,
    lineCount: 19,
  },
};

export const algorithmThought = `## 单调栈解法思路

### 核心思想
对于每根柱子，找到它能向左右延伸的最大范围，即找到左右两侧第一个比它矮的柱子。

### 算法步骤
1. **初始化**：创建 left 和 right 数组记录每个柱子的左右边界
2. **单调栈遍历**：从左到右遍历，维护一个单调递增栈
   - 当前柱子比栈顶矮时，栈顶元素的右边界就是当前位置
   - 当前柱子的左边界就是栈顶元素（或-1）
3. **计算面积**：对每个柱子，面积 = (right[i] - left[i] - 1) × heights[i]

### 为什么用单调栈？
- 栈中元素高度单调递增
- 当遇到更矮的柱子时，栈顶元素找到了右边界
- 时间复杂度 O(n)，每个元素最多入栈出栈各一次

### 复杂度分析
- 时间复杂度：O(n)
- 空间复杂度：O(n)
`;
