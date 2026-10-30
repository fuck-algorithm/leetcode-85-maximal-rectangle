# LeetCode 85 最大矩形动画规格

## 可观察状态与画面布局

- 主结构：输入高度数组 `[2,1,5,6,2,3]` 的柱形图，柱子使用 `bar-{index}` 稳定身份，按索引水平等距排列。
- 辅助结构：单调递增栈作为带方向、容量和空状态的独立容器；左右边界数组及当前最大面积由变量面板展示。
- 代码锚点：沿用各语言现有 `codeLines` 行映射。每步绑定稳定语义锚点（initialize、scan-current、resolve-right-boundary、assign-left-boundary、push-index、begin-area-scan、calculate-area、return-result）。
- 视口：逻辑坐标依柱索引与高度确定，不依赖随机布局；SVG 随容器尺寸自适应，支持缩放和平移。

## 步骤与焦点

| 算法事件 | operation | 焦点 | 讲解目标 |
| --- | --- | --- | --- |
| 初始化边界与栈 | init | 主数组/栈 | 说明每柱左右边界待求 |
| 读取当前柱 | read | 当前柱 i | 说明检查右边界的起点 |
| 弹出较高栈顶 | pop | 栈顶与当前柱 | 当前柱是被弹柱的右侧首个更矮边界 |
| 记录左边界 | move | 当前柱/左邻更矮柱 | 解释最近更矮柱或数组外边界 |
| 当前柱入栈 | push | 当前柱/栈 | 保留候选高度供后续确定右边界 |
| 开始计算面积 | init | 边界数组 | 从边界快照进入面积阶段 |
| 计算候选面积 | compare | 当前候选矩形 | 用宽×高更新最大值 |
| 返回最终结果 | done | 最大矩形 | 所有候选比较完毕 |

每帧最多一个 `current` 焦点；双柱比较最多两个候选。柱坐标按 `x = origin + index × pitch` 稳定计算，栈节点 ID 由柱索引确定，边界数组位置固定。全部帧包含唯一 operation、非重复 narration 与至少一个 anchor；步骤 ID 唯一。

## 状态、动效与无障碍

- 节点身份为柱索引，规则 `bar-{index}`；栈项身份由柱索引确定。坐标为 `x = origin + index × pitch`。
- 主色使用青绿（已确认）、琥珀（当前比较）、浅灰绿（未处理/访问）；红色只表示弹出/警示，不使用紫色。
- D3 zoom 负责画布镜头交互；柱节点使用稳定索引 key 在 React keyed join 中复用，更新颜色/高度时执行 CSS 过渡，不按帧卸载重建整张 SVG。
- 固定四色图例、操作徽标、步骤解说与面积指标常驻；`prefers-reduced-motion` 同步关闭 CSS 与 JS 过渡，内容状态仍正常更新。
- 单调栈以独立栈视图显示栈底→栈顶、顶端标记、容量与空栈提示；项目无队列结构。

## 验证记录

- `npm run test:coverage`：通过；lines 92.68%、functions 100%、branches 91.34%。
- `npm run test:e2e`：15/15 通过，覆盖 1920×1080 与 1366×768 布局、交互及二维码资源。
- E2E 失败时会保留截图、视频与 trace；本轮未录制 1x 全流程视频或 reduced-motion 截图，验收证据与结论见 `docs/ACCEPTANCE_REPORT.md`。