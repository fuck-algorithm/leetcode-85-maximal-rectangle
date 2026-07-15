# LeetCode 85 仓库公开化与 GitHub Pages 部署调通 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`
> Steps use checkbox (`- [ ]`) syntax.

**Goal:** 把 `fuck-algorithm/leetcode-85-maximal-rectangle` 仓库从 PRIVATE 改为 PUBLIC，推送可构建的项目代码，调通 GitHub Actions workflow，使 GitHub Pages 站点 `https://fuck-algorithm.github.io/leetcode-85-maximal-rectangle/` 成功部署并可访问。

**Architecture:** 仓库可见性 PRIVATE→PUBLIC（gh repo edit）→ 开启 Pages site 且 build_type=workflow（gh api POST /pages）→ clone 85 空仓库到独立本地目录 → 复制当前 84 项目全部源码作为脚手架 → 改 vite base 路径与 package name 以匹配 85 仓库名 → 推送 main 触发 deploy.yml → Actions 构建 dist 并 deploy-pages → 监控 workflow 直到成功 → 验证 Pages URL 返回 200 且根目录可访问。

**Tech Stack:** gh CLI 2.x（admin 权限，组织 fuck-algorithm），GitHub Actions（actions/checkout@v4, setup-node@v4, configure-pages@v4, upload-pages-artifact@v3, deploy-pages@v4），Vite 6，React 18，TypeScript 5.6，Node 20，d3 7。

**Risks:**
- `gh repo edit --visibility public` 对组织仓库需要 `--accept-visibility-change-consequences` 才能在非交互下执行 → 缓解：Task 1 Step 2 命令带该 flag
- 85 仓库已存在 1 个含 LICENSE 的初始 commit，clone 后直接在 working tree 上加文件再提交，LICENSE 保留，不会丢失
- vite `base` 若不改为 85 仓库名，Pages 部署后资源路径错位导致白屏 → 缓解：Task 2 强制改 base
- `npm ci` 要求 lockfile 存在且与 package.json 一致 → 缓解：本地 `package-lock.json` 与 `package.json` 已同步，连同复制
- 组织 Pages site 创建后首个 workflow 需等待数分钟 → 缓解：Task 3 用 Monitor 轮询直到 workflow 结论为 success
- 85 远端当前是 PRIVATE 且仅有 LICENSE；clone 用 gh 的 https 协议（token 已注入 git 凭据）无需额外配置

---

### Task 1: 85 仓库公开化并开启 Pages site

**Depends on:** None
**Files:**
- Modify: GitHub 仓库 `fuck-algorithm/leetcode-85-maximal-rectangle`（visibility PRIVATE → PUBLIC）
- Create: 该仓库的 Pages site（source = workflow, branch = main）

- [ ] **Step 1: 验证当前账号对 85 仓库具备 admin 权限 — 确认可改可见性可配 Pages**

```bash
gh repo view fuck-algorithm/leetcode-85-maximal-rectangle --json visibility,viewerCanAdminister,name
```

Expected:
  - Exit code: 0
  - Output contains: `"visibility":"PRIVATE"`
  - Output contains: `"viewerCanAdminister":true`
  - Output contains: `"name":"leetcode-85-maximal-rectangle"`

- [ ] **Step 2: 把 85 仓库可见性改为 public — 让未登录浏览器也能访问仓库主页（消除 404）**

```bash
gh repo edit fuck-algorithm/leetcode-85-maximal-rectangle --visibility public --accept-visibility-change-consequences
```

Expected:
  - Exit code: 0
  - 输出不含 "error" 或 "Warning: You are changing"
  - 后续 `gh repo view ... --json visibility` 返回 `"visibility":"PUBLIC"`

- [ ] **Step 3: 开启 85 仓库的 Pages site — build_type 设为 workflow，使 deploy.yml 成为部署来源**

```bash
gh api --method POST repos/fuck-algorithm/leetcode-85-maximal-rectangle/pages \
  -f build_type=workflow
```

Expected:
  - Exit code: 0
  - Output contains: `"build_type":"workflow"`
  - Output contains: `"html_url":"https://fuck-algorithm.github.io/leetcode-85-maximal-rectangle/"`
  - 输出不含 "Not Found" 或 "404"

- [ ] **Step 4: 验证 Pages site 已创建且配置正确**

```bash
gh api repos/fuck-algorithm/leetcode-85-maximal-rectangle/pages
```

Expected:
  - Exit code: 0
  - Output contains: `"build_type":"workflow"`
  - Output contains: `"public":true`
  - 不再返回 404 Not Found

- [ ] **Step 5: 提交 Task 1 状态说明**

Task 1 不产生本地代码改动（仅操作 GitHub 远端设置），无需 git commit。记录结论：
- visibility: PUBLIC
- Pages site: 已开启，build_type=workflow

⏹️ Task 1 Complete

---

### Task 2: clone 85 空仓库到本地独立目录并改造成可构建的 85 项目

**Depends on:** None（与 Task 1 无代码依赖，但为避免在 PRIVATE 状态下操作混乱，逻辑上在 Task 1 之后执行）
**Files:**
- Create: `~/github/leetcode-85-maximal-rectangle/`（新本地工作区）
- Modify: `~/github/leetcode-85-maximal-rectangle/vite.config.ts`（base 路径）
- Modify: `~/github/leetcode-85-maximal-rectangle/package.json`（name）
- Modify: `~/github/leetcode-85-maximal-rectangle/index.html`（title）
- Modify: `~/github/leetcode-85-maximal-rectangle/README.md`（说明）
- Keep: `~/github/leetcode-85-maximal-rectangle/.github/workflows/deploy.yml`（沿用，已验证可用）
- Keep: `~/github/leetcode-85-maximal-rectangle/LICENSE`（来自初始 commit）

- [ ] **Step 1: clone 85 仓库到独立本地目录 — 不污染当前 84 工作区**

```bash
cd ~ && gh repo clone fuck-algorithm/leetcode-85-maximal-rectangle ~/github/leetcode-85-maximal-rectangle
```

Expected:
  - Exit code: 0
  - 目录 `~/github/leetcode-85-maximal-rectangle` 存在
  - 该目录下有 `LICENSE` 文件（来自初始 commit）
  - 该目录下有 `.git` 目录，remote origin 指向 85 仓库

- [ ] **Step 2: 复制当前 84 项目全部源码到 85 工作区 — 作为可构建脚手架，LICENSE 保留**

```bash
SRC=/home/cc11001100/github/fuck-algorithm/leetcode-84-largest-rectangle-in-histogram
DST=~/github/leetcode-85-maximal-rectangle
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='tsconfig.tsbuildinfo' "$SRC/" "$DST/"
```

Expected:
  - Exit code: 0
  - `~/github/leetcode-85-maximal-rectangle/package.json` 存在
  - `~/github/leetcode-85-maximal-rectangle/.github/workflows/deploy.yml` 存在
  - `~/github/leetcode-85-maximal-rectangle/src/` 目录与文件齐全
  - `~/github/leetcode-85-maximal-rectangle/package-lock.json` 存在（npm ci 必需）
  - `~/github/leetcode-85-maximal-rectangle/LICENSE` 仍在（未被覆盖，因 SRC 也有同名 LICENSE 内容一致）

- [ ] **Step 3: 修改 vite.config.ts 的 base 路径 — 匹配 85 仓库的 Pages URL 子路径，否则资源 404 白屏**
文件: `~/github/leetcode-85-maximal-rectangle/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/leetcode-85-maximal-rectangle/',
  server: {
    port: 54321
  }
})
```

- [ ] **Step 4: 修改 package.json 的 name 字段 — 与仓库名一致，避免名称混淆**
文件: `~/github/leetcode-85-maximal-rectangle/package.json`（仅改第 2 行 name）

```json
{
  "name": "leetcode-85-maximal-rectangle",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite --port 54321",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "d3": "^7.9.0",
    "idb": "^8.0.0",
    "prism-react-renderer": "^2.4.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.15.0",
    "@types/d3": "^7.4.3",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^9.15.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.14",
    "globals": "^15.12.0",
    "typescript": "~5.6.2",
    "typescript-eslint": "^8.15.0",
    "vite": "^6.0.1"
  }
}
```

- [ ] **Step 5: 修改 index.html 的 title — 体现 85 题语义**
文件: `~/github/leetcode-85-maximal-rectangle/index.html`

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>85. 最大矩形 - LeetCode 算法可视化</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: 修改 README.md — 标注为 85 仓库，脚手架来自 84 项目**
文件: `~/github/leetcode-85-maximal-rectangle/README.md`

```markdown
# LeetCode 85 - 最大矩形 (Maximal Rectangle)

算法可视化项目。

在线访问：<https://fuck-algorithm.github.io/leetcode-85-maximal-rectangle/>

## 技术栈

- React 18 + TypeScript 5.6
- Vite 6
- D3 7

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```
```

- [ ] **Step 7: 本地安装依赖并构建验证 — 推送前确认 build 能产出 dist**
Run: `cd ~/github/leetcode-85-maximal-rectangle && npm install && npm run build`
Expected:
  - Exit code: 0
  - 输出不含 "error TS" 或 "ERR!"
  - 目录 `~/github/leetcode-85-maximal-rectangle/dist/` 存在
  - `~/github/leetcode-85-maximal-rectangle/dist/index.html` 存在

- [ ] **Step 8: 提交本地改造 — 将 85 化的项目脚手架作为一个 commit**
Run: `cd ~/github/leetcode-85-maximal-rectangle && git add -A && git commit -m "feat: 初始化 leetcode-85 项目脚手架并配置 GitHub Pages 部署"`

⏹️ Task 2 Complete

---

### Task 3: 推送代码触发 workflow 并监控部署直到 Pages 可访问

**Depends on:** Task 1, Task 2
**Files:**
- Push: `~/github/leetcode-85-maximal-rectangle` main 分支 → 85 远端

- [ ] **Step 1: 推送 main 分支到 85 远端 — 触发 deploy.yml 的 push 事件**
Run: `cd ~/github/leetcode-85-maximal-rectangle && git push -u origin main`
Expected:
  - Exit code: 0
  - 输出含 "To https://github.com/fuck-algorithm/leetcode-85-maximal-rectangle.git"
  - 输出含 "main -> main"

- [ ] **Step 2: 验证 workflow 已被触发 — 确认 "Deploy to GitHub Pages" run 开始**
Run: `gh run list --repo fuck-algorithm/leetcode-85-maximal-rectangle --limit 1`
Expected:
  - Exit code: 0
  - 输出含 "Deploy to GitHub Pages"
  - 输出含 workflow 名（name 列）

- [ ] **Step 3: 监控 workflow 直到结束 — 等待 build + deploy 两个 job 完成**
Run: `gh run watch --repo fuck-algorithm/leetcode-85-maximal-rectangle --exit-status $(gh run list --repo fuck-algorithm/leetcode-85-maximal-rectangle --limit 1 --json databaseId --jq '.[0].databaseId')`
Expected:
  - Exit code: 0
  - 最终 `gh run view` 显示 conclusion = success
  - 输出含 "completed" 且无 "failure"/"cancelled"

- [ ] **Step 4: 验证 Pages 站点根路径返回 200 — 确认部署成功对外可访问**
Run: `curl -sI -o /dev/null -w "%{http_code}" https://fuck-algorithm.github.io/leetcode-85-maximal-rectangle/`
Expected:
  - HTTP status: 200（或首次部署可能为 404，需等待约 30-60 秒后重试）
  - 若非 200，等待 30 秒重试，最多重试 5 次

- [ ] **Step 5: 验证站点资源（index.html 引用的 JS）可加载 — 确认 base 路径正确无白屏**
Run: `curl -s https://fuck-algorithm.github.io/leetcode-85-maximal-rectangle/ | grep -oE '/leetcode-85-maximal-rectangle/assets/[^"]+\.js' | head -1 | xargs -I{} curl -sI -o /dev/null -w "%{http_code}" https://fuck-algorithm.github.io{}`
Expected:
  - HTTP status: 200
  - 说明 index.html 引用的 JS 资源路径正确，不会白屏

- [ ] **Step 6: 更新仓库描述与 homepage — 让仓库主页直接展示 Pages URL**
Run: `gh repo edit fuck-algorithm/leetcode-85-maximal-rectangle --description "LeetCode 85 - 最大矩形 https://fuck-algorithm.github.io/leetcode-85-maximal-rectangle/" --homepage "https://fuck-algorithm.github.io/leetcode-85-maximal-rectangle/"`
Expected:
  - Exit code: 0
  - `gh repo view ... --json description,homepageUrl` 返回 homepageUrl 为 Pages URL

⏹️ Task 3 Complete
