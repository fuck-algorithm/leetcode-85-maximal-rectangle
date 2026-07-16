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
