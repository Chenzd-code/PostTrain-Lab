# PostTrain Lab

一个面向大模型后训练学习者的交互式中文学习平台，覆盖从 SFT、偏好对齐和推理强化学习，到 Agent、Agent Harness、Agentic RL、训练系统与模型交付的完整路线。

## 内容概览

- 12 个章节、64 节深度课程
- 106 道章节测验，支持按章节和知识类型抽题
- 110 道面试题，覆盖 17 个主题、9 种题型和 3 档难度
- KaTeX + MathML 公式渲染
- 算法对比与训练方案决策台
- Agent、Harness、Agentic RL 专题课程，其中 Harness 按三种时间尺度、九大组件和 13 个源码专题展开
- 支持 OpenAI-compatible API 的交互式学习导师
- 学习进度和题目收藏保存在浏览器本地

## 快速开始

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

打开终端输出的本地地址，默认通常为 `http://localhost:5173/`。

生产构建：

```bash
npm run build
npm run preview
```

## GitHub Pages

仓库已包含 `.github/workflows/deploy-pages.yml`。推送到 `main` 后，GitHub Actions 会自动构建并部署 `dist`。

首次使用时，在仓库中打开 `Settings → Pages`，将 `Build and deployment` 的 Source 设为 `GitHub Actions`。部署完成后可访问：

```text
https://chenzd-code.github.io/PostTrain-Lab/
```

## AI 学习导师

在网页的“AI 学习导师”页面中配置：

- OpenAI-compatible Base URL
- API Key
- 模型名称

API Key 只保存在当前标签页的 `sessionStorage` 中，关闭标签页后失效。公开部署时应通过服务端代理转发模型请求，不要在前端代码中保存密钥。

## 课程范围

课程覆盖 SFT 数据与训练、奖励模型、PPO/RLHF、DPO 家族、RLVR/GRPO、Agent 架构、工具与状态管理、Context Engineering、MCP、权限与沙箱、HITL、Tracing、Agent Evals、POMDP 与长程信用分配、异步 rollout、分布式训练、蒸馏、量化和上线回归。

Agent Harness 章节参考 [WTF is Agent Harness?](https://lulusiyuyu.github.io/WTFisHarness/) 的知识顺序重新编排，并以当前协议文档校准容易随实现版本变化的细节。

## 技术栈

- React
- TypeScript
- Vite
- KaTeX
- Lucide React

## 项目结构

```text
src/
  App.tsx
  styles.css
  data/
    course.ts
    advancedCourse.ts
    questions.ts
    advancedQuestions.ts
  types.ts
```

## License

当前仓库未声明开源许可证。未经仓库所有者许可，不应假定代码可以再分发或用于商业用途。
