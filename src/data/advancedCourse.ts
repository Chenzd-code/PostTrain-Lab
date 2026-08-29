import type { Chapter, Lesson } from '../types'

export const sftAdvancedLessons: Lesson[] = [
  {
    id: 'sft-multiturn-tools', title: '多轮、工具调用与多模态 SFT', duration: 38, difficulty: '进阶',
    summary: '从普通问答扩展到多轮状态、函数调用轨迹和图文交错数据。',
    objectives: ['设计 tool-call SFT schema', '正确处理 tool observation 的 loss mask', '理解多轮 SFT 的 exposure bias'],
    sections: [
      { title: '训练模型生成什么，就只监督什么', paragraphs: ['工具型数据通常包含 system、user、assistant tool_call、tool result、assistant final answer。模型应学习产生 tool name、arguments 与最终回答；外部 tool result 是环境 observation，通常只作为条件，不应被模型预测。'], bullets: ['结构化参数先做 JSON/schema 验证再进入训练', '区分 parallel tool calls 与 sequential calls', '保留工具错误、重试和无结果样本，避免只见成功轨迹', '多模态样本还要对齐 image/video placeholder 与视觉 token'] },
      { title: '多轮行为克隆的分布偏移', paragraphs: ['训练时每一轮看到专家历史，推理时却看到模型自己的旧输出。早期小错误会改变后续 observation，这就是 sequence-level covariate shift。可用模型生成轨迹再人工/验证器纠正、DAgger 式迭代收集、拒绝采样或后续 Agentic RL 缩小差距。'], callout: { type: 'warning', title: '常见伪成功', text: '只在静态 transcript 上算 token loss 很低，不代表 agent loop 中工具选择可靠；必须在真实或可重置环境里跑闭环评测。' } },
      { title: 'Tool SFT 的指标', paragraphs: ['至少分开报告 tool selection accuracy、argument validity、execution success、recovery rate、final task success 和平均调用数。最终成功率相同的模型，可能在调用成本和安全性上差异巨大。'] },
    ], takeaway: '工具 SFT 的目标是模仿决策轨迹，而不只是生成看起来像 JSON 的文本。',
  },
  {
    id: 'sft-long-context', title: '长上下文、Packing 与有效 Token', duration: 34, difficulty: '硬核',
    summary: '理解 sequence packing、sample boundary、位置分布与长短样本混合。',
    objectives: ['计算有效 token 利用率', '识别 packing 的 attention 泄漏', '设计长度课程'],
    sections: [
      { title: 'GPU 吃的是 token，不是样本数', paragraphs: ['固定长度 padding 会浪费大量计算。Packing 把多个短样本拼进同一序列，提高有效 token 比例；但必须同时处理 position id、attention boundary、loss mask 和 EOS，否则不同样本会互相看见。'], formula: '\\eta_{\\mathrm{token}}=\\frac{N_{\\mathrm{nonpad,loss}}}{N_{\\mathrm{allocated}}}', formulaLabel: '有效监督 token 利用率', formulaNote: '建议同时报告 non-padding token 利用率与真正参与 loss 的 assistant token 利用率。' },
      { title: '长序列不是把 max_length 调大', paragraphs: ['模型是否能使用长上下文，取决于预训练位置分布、RoPE 扩展方式、长样本质量与“在长上下文中找到关键证据”的监督。只扩长度会增加显存和训练不稳定，不会自动获得长程推理。'], bullets: ['按长度分桶监控 loss 和梯度', '保留短样本防止短任务退化', '评测 needle、长文综合、跨段引用和干扰鲁棒性', '检查截断是否系统性切掉答案或 EOS'] },
      { title: 'Batch 的计量单位', paragraphs: ['跨不同 sequence length 比较实验时，应使用 tokens/update、loss tokens/update 和 optimizer steps，而不是只比较 batch size。梯度累积只改变何时更新，不会消除长序列的激活显存。'], callout: { type: 'industry', title: '吞吐账本', text: '同时记录 allocated tokens/s、non-pad tokens/s、loss tokens/s 与样本长度 P50/P95，才能看清 packing 是否真的提高效率。' } },
    ], takeaway: '长上下文 SFT 是数据长度分布、位置机制和系统效率的联合设计。',
  },
  {
    id: 'sft-repro', title: '训练配置、Checkpoint 与可复现性', duration: 28, difficulty: '进阶',
    summary: '把一次能跑通的实验升级成能解释、恢复和公平比较的训练资产。',
    objectives: ['保存完整恢复状态', '定义数据与模型 lineage', '避免 checkpoint cherry-pick'],
    sections: [
      { title: '可复现不只是固定 seed', paragraphs: ['需要记录 base model revision、tokenizer/template、数据快照与过滤代码、依赖/内核版本、并行策略、精度、优化器、随机状态和评测配置。分布式算子仍可能非确定，结果应以区间而非单点表达。'] },
      { title: '完整恢复状态', paragraphs: ['真正 resume 包含模型、优化器、scheduler、gradient scaler、RNG、data sampler cursor 和 global step。只加载权重是 warm start，会改变学习率和样本顺序。'] },
      { title: '选择 checkpoint 的规则要预先写', paragraphs: ['预先定义 primary metric、门禁指标、评测频率与早停规则。反复查看测试集挑 checkpoint 会把测试集变成训练信号。'], callout: { type: 'industry', title: '实验卡', text: '每次实验自动产出数据卡、配置 diff、训练曲线、评测置信区间、成本与已知失败，面试项目也应这样展示。' } },
    ], takeaway: '可复现性是后训练工程的基础设施，也是所有算法比较成立的前提。',
  },
]

export const preferenceAdvancedLessons: Lesson[] = [
  {
    id: 'preference-multiobjective', title: '多目标奖励、约束与 Pareto 边界', duration: 36, difficulty: '硬核',
    summary: '处理 helpfulness、correctness、safety、style 与 cost 之间不可消除的冲突。',
    objectives: ['区分标量化与约束优化', '解释 Lagrangian multiplier', '设计分维度门禁'],
    sections: [
      { title: '一个总 reward 会隐藏价值冲突', paragraphs: ['把多个 reward 线性相加简单，但权重会决定模型牺牲哪个目标；不同用户与任务的最优权重也不同。先画分维度指标和 Pareto frontier，再讨论聚合。'], formula: 'R(x,y)=\\sum_{k=1}^{K}w_k R_k(x,y),\\qquad w_k\\ge 0', formulaLabel: '多目标标量化', formulaNote: '不同 reward 的量纲、方差和校准必须先统一；否则最大数值的分量会支配梯度。' },
      { title: '把安全写成约束', paragraphs: ['对于不能用收益交换的硬边界，可写成约束优化：最大化帮助性，同时要求风险期望不超过预算。实际用 Lagrangian、拒绝采样、shield 或上线 guardrail 近似。'], formula: '\\max_{\\pi}\\ J_{\\mathrm{help}}(\\pi)\\quad\\text{s.t.}\\quad J_{\\mathrm{risk}}(\\pi)\\le c', formulaLabel: 'Constrained policy optimization view', formulaNote: '约束满足必须在独立风险集上验证；训练 reward 满足不代表真实风险满足。' },
      { title: '条件化偏好', paragraphs: ['把用户/场景偏好作为条件输入，可能比训练一个全局折中策略更合理。例如“简洁/详细”“保守/探索”可由显式控制变量表达，但安全底线不能交给任意用户覆盖。'] },
    ], takeaway: '现实对齐是多目标受约束优化，不是把所有价值压成一个未经校准的分数。',
  },
  {
    id: 'reward-uncertainty', title: '奖励不确定性、集成与校准', duration: 31, difficulty: '硬核',
    summary: '让训练系统知道奖励模型在哪些样本上不值得相信。',
    objectives: ['区分 aleatoric 与 epistemic uncertainty', '使用 ensemble 分歧', '设计 abstention 与人工回流'],
    sections: [
      { title: 'Reward point estimate 不够', paragraphs: ['同一个 reward 值可能来自高共识简单样本，也可能来自多个 RM 严重分歧的分布外样本。后者被策略优化时风险更高。可用多 seed/架构 ensemble、MC dropout 或 pairwise posterior 估计不确定性。'], formula: '\\bar r=\\frac{1}{M}\\sum_{m=1}^{M}r_m,\\qquad u_{\\mathrm{ens}}=\\frac{1}{M}\\sum_{m=1}^{M}(r_m-\\bar r)^2', formulaLabel: 'Reward ensemble mean 与 disagreement', formulaNote: 'ensemble 同源数据可能共享系统性偏差，因此低分歧也不等于绝对正确。' },
      { title: '不确定样本的三种处理', paragraphs: ['可以降低 reward 权重、拒绝用于策略更新，或送回人工/更强 judge 标注。哪一种取决于风险、流量和标注成本。'] },
      { title: '校准看概率而非 accuracy', paragraphs: ['对 pairwise RM，检查预测 chosen 概率与真实频率的 reliability diagram、ECE/Brier score，并按领域、长度差、安全类别切片。'] },
    ], takeaway: '奖励的不确定性应进入采样、训练权重和人工回流，而不是只留在离线报告里。',
  },
]

export const rlhfAdvancedLessons: Lesson[] = [
  {
    id: 'policy-gradient-family', title: 'REINFORCE、RLOO、ReMax 与 Actor–Critic', duration: 42, difficulty: '硬核',
    summary: '用 baseline 与信用分配方式统一理解在线 LLM RL 算法家族。',
    objectives: ['推导 score-function gradient', '比较 learned 与 sample baseline', '解释 leave-one-out 无偏性直觉'],
    sections: [
      { title: '策略梯度的共同骨架', paragraphs: ['对整段回答 y 的序列奖励 R，REINFORCE 用 log-derivative trick 把不可微采样转成可估计梯度。减去与当前动作无关的 baseline 不改变期望，却能显著降低方差。'], formula: '\\nabla_{\\theta}J(\\theta)=\\mathbb{E}_{y\\sim\\pi_{\\theta}(\\cdot\\mid x)}\\!\\left[(R(x,y)-b(x))\\nabla_{\\theta}\\log\\pi_{\\theta}(y\\mid x)\\right]', formulaLabel: 'Score-function policy gradient', formulaNote: '序列 log-probability 等于生成 token 的 log-probability 之和。baseline 不能依赖被评分动作本身，除非做正确的校正。' },
      { title: 'Baseline 决定系统形态', paragraphs: ['PPO/actor–critic 训练 value model；RLOO 用同 prompt 其他候选 reward 的 leave-one-out 均值；ReMax 用 greedy response 的 reward；GRPO 用组统计量。它们都在回答“这条样本比什么更好”。'] },
      { title: '算法名之外的稳定技巧', paragraphs: ['advantage whitening、reward normalization、KL placement、clip、gradient clipping、ratio granularity 和 sample reuse 对结果影响可能大于 estimator 名称。公平比较必须对齐这些实现细节。'], callout: { type: 'warning', title: '术语陷阱', text: 'LLM 语境中的“DPO”通常指 Direct Preference Optimization；传统多智能体 RL 中也有同名 Decentralized Policy Optimization，面试时先澄清。' } },
    ], takeaway: '现代 LLM RL 算法可以沿着 baseline、ratio 粒度、数据新鲜度和信用分配四条轴理解。',
  },
  {
    id: 'kl-estimation', title: 'KL 估计、熵与分布坍缩', duration: 35, difficulty: '硬核',
    summary: '理解采样 KL 估计器、负样本值、熵监控与 reference 约束的实现细节。',
    objectives: ['区分 forward/reverse KL', '解释 sampled KL 可为负', '诊断 entropy collapse'],
    sections: [
      { title: '训练日志里的 KL 是估计值', paragraphs: ['常见 token estimator 使用 log πθ(a|s)−log πref(a|s)，单个采样可为负，但在 πθ 下的期望是 KL(πθ||πref) 非负。不同 k1/k2/k3 estimator 有不同偏差与方差，不能把不同实现的数值直接比较。'], formula: '\\mathrm{KL}(\\pi_{\\theta}\\Vert\\pi_{\\mathrm{ref}})=\\mathbb{E}_{a\\sim\\pi_{\\theta}}\\!\\left[\\log\\frac{\\pi_{\\theta}(a\\mid s)}{\\pi_{\\mathrm{ref}}(a\\mid s)}\\right]', formulaLabel: 'Forward KL used in many RLHF objectives', formulaNote: '单个 log-ratio 可为负；非负性属于精确分布期望。padding、temperature 和 vocabulary mask 必须一致。' },
      { title: 'KL 与 entropy 不是一回事', paragraphs: ['KL 衡量相对 reference 的漂移；entropy 衡量当前策略自身的不确定性。策略可以 entropy 低但仍靠近低熵 reference，也可 entropy 高却显著偏离 reference。'] },
      { title: '分布坍缩的联动信号', paragraphs: ['观察 entropy、distinct-n、重复率、response length、KL、clip fraction、reward variance 和独立任务覆盖。单看 entropy 不能区分“学会确定答案”和“模式坍缩”。'] },
    ], takeaway: 'KL、entropy 和多样性是不同概念，必须与采样分布和任务正确率联读。',
  },
]

export const directPreferenceAdvancedLessons: Lesson[] = [
  {
    id: 'dpo-implementation', title: 'DPO 实现细节与隐蔽错误', duration: 37, difficulty: '硬核',
    summary: '从 sequence log-probability、reference cache 到 label noise 排查 DPO。',
    objectives: ['正确计算 response log-probability', '识别 reference mismatch', '监控 chosen/rejected margin'],
    sections: [
      { title: '四次 log-probability 从哪里来', paragraphs: ['每个 pair 需要 policy chosen/rejected 与 reference chosen/rejected 的回答 token log-probability。reference 可预计算缓存，但缓存必须绑定 tokenizer、template、truncation 和模型 revision。'] },
      { title: 'Prompt 与 response 边界', paragraphs: ['只累加 response token；chosen/rejected 必须共享完全相同的 prompt token。若分别 tokenize 后边界变化、BOS 重复或 truncation 不同，margin 会被格式噪声污染。'], formula: '\\log\\pi_{\\theta}(y\\mid x)=\\sum_{t=1}^{|y|}\\log\\pi_{\\theta}(y_t\\mid x,y_{<t})', formulaLabel: 'Sequence response log-probability', formulaNote: '是否除以 |y| 取决于算法定义；原始 DPO 通常使用求和，不能悄悄改成平均后仍声称同一目标。' },
      { title: '应该监控哪些量', paragraphs: ['chosen reward、rejected reward、reward margin、accuracy、policy/reference KL 代理、chosen/rejected 长度差与验证集 win-rate。训练 accuracy 接近 100% 可能意味着数据可分后继续过拟合。'] },
    ], takeaway: 'DPO 公式短，但 token 边界、reference 一致性和长度处理足以决定实验成败。',
  },
]

export const reasoningAdvancedLessons: Lesson[] = [
  {
    id: 'modern-rl-algorithms', title: 'DAPO、Dr.GRPO、GSPO 与 REINFORCE++', duration: 46, difficulty: '硬核',
    summary: '建立 2025–2026 推理 RL 算法谱系，理解它们修正的具体失败。',
    objectives: ['解释 GRPO 的长度偏差来源', '比较 token 与 sequence ratio', '理解 dynamic sampling'],
    sections: [
      { title: '不要把所有方法叫“GRPO 微调”', paragraphs: ['DAPO 强调 decoupled clipping、动态采样、token-level loss 与 overlong reward shaping；Dr.GRPO 去除组内标准差和长度相关归一化中的偏差来源；REINFORCE++ 将 PPO 稳定技巧用于无 critic 的 REINFORCE；GSPO 用 sequence-level importance ratio 与 clipping。每项修改针对不同 estimator 或系统问题。'] },
      { title: 'Token ratio 与 sequence ratio', paragraphs: ['GRPO/PPO 常对每个 token 计算 ratio；GSPO 从整段回答的平均 log-ratio 构造 sequence ratio，同一序列 token 共享裁剪决策。前者粒度细但易受极端 token 影响，后者和 outcome reward 粒度更一致但牺牲 token 级差异。'], formula: '\\rho_i^{\\mathrm{seq}}=\\exp\\!\\left(\\frac{1}{|y_i|}\\sum_{t=1}^{|y_i|}\\log\\frac{\\pi_{\\theta}(y_{i,t}\\mid s_{i,t})}{\\pi_{\\mathrm{old}}(y_{i,t}\\mid s_{i,t})}\\right)', formulaLabel: 'Sequence-level importance ratio（示意）', formulaNote: '具体实现与论文版本需核对；关键是 ratio 与 clipping 的粒度从 token 上升到 sequence。' },
      { title: '动态采样保持有效梯度', paragraphs: ['全对和全错 prompt 组没有相对信号。动态采样在 rollout 后过滤无方差组并继续补采，提升有效 batch，但会改变训练 prompt 分布，需保留采样权重或至少监控难度偏置。'], callout: { type: 'insight', title: '阅读新算法的方法', text: '先问它改变了 baseline、normalization、ratio、clip、loss aggregation、sampling 还是 reward shaping，再判断增益来自算法还是系统配方。' } },
    ], takeaway: '现代推理 RL 的核心争论是优势估计、ratio 粒度、长度偏差与有效采样，而不是缩写排名。',
  },
  {
    id: 'process-outcome-credit', title: 'ORM、PRM、Step/Turn Reward 与信用分配', duration: 38, difficulty: '硬核',
    summary: '从终局 0/1 奖励扩展到可校验中间过程，同时控制奖励投机。',
    objectives: ['比较 outcome 与 process supervision', '设计 step verifier', '理解 reward redistribution'],
    sections: [
      { title: 'Outcome reward 的优点与盲点', paragraphs: ['终局 verifier 便宜、客观且不强制某种思路，但正确答案可能来自错误过程，失败轨迹也可能包含关键正确步骤。长轨迹中把同一 outcome advantage 复制给所有 token，信用分配很粗。'] },
      { title: 'Process reward 不等于越密越好', paragraphs: ['PRM/step verifier 可以帮助搜索和训练，但局部“看起来合理”不一定导向正确终局；逐步 judge 还可能偏爱冗长格式。优先使用可执行局部状态变化、证明检查或单元测试等 grounded signal。'] },
      { title: '从 step 到 turn', paragraphs: ['在 Agent 中自然粒度是一次模型决策加工具执行。Turn-level reward 可评价工具选择、参数、observation 使用与进展，再与终局 success 组合。'], callout: { type: 'warning', title: '因果问题', text: '相关性评分不是因果贡献。对“关键一步”的判断应结合反事实重放、替换动作或环境状态，而不只靠 judge 解释。' } },
    ], takeaway: '更密的奖励能降方差，但只有和真实状态进展一致时才改善信用分配。',
  },
  {
    id: 'test-time-training-time', title: '训练时计算与测试时计算', duration: 31, difficulty: '进阶',
    summary: '比较长 CoT、自一致性、搜索、verifier rerank 与 RL 蒸馏的成本位置。',
    objectives: ['区分 pass@k 与 best-of-k', '建立 compute-matched 比较', '设计搜索轨迹蒸馏'],
    sections: [
      { title: '同样预算下比较', paragraphs: ['单次长回答、并行采样 k 条、自一致投票、树搜索和 verifier rerank 使用不同测试时计算。比较模型时应固定总生成 token、延迟或成本，否则“模型能力提升”可能只是采样更多。'] },
      { title: '搜索依赖 evaluator', paragraphs: ['Best-of-N 的上限取决于候选覆盖，实际收益还取决于 verifier 能否选中正确候选。报告 pass@N 与 verifier-selected accuracy 可以分离生成与选择能力。'] },
      { title: '把测试时计算蒸馏回策略', paragraphs: ['用强模型/搜索产生高质量轨迹，再经验证筛选做 SFT/DPO，可降低部署成本；但学生仍可能只学到轨迹表面，需要在新分布和有限 token 预算下评测。'] },
    ], takeaway: '推理提升要在等计算预算下归因，并分清候选生成、验证选择与策略内化。',
  },
]

export const evaluationAdvancedLessons: Lesson[] = [
  {
    id: 'causal-eval', title: '可归因评测、消融与数据污染审计', duration: 32, difficulty: '硬核',
    summary: '让增益能回答“为什么”，而不仅是“分数涨了”。',
    objectives: ['设计 factorial ablation', '控制 evaluator drift', '审计 contamination'],
    sections: [
      { title: '把配方拆成可检验假设', paragraphs: ['数据、base、算法、rollout 数、reward、训练 token 和测试时计算同时变化时，无法把增益归给某个方法。优先做小规模 factorial ablation，再确认关键交互。'] },
      { title: 'Evaluator 也是版本化依赖', paragraphs: ['Judge model、prompt、temperature、解析器和 rubric 的变化都会改变分数。保存原始输出并尽量让新旧 checkpoint 在同一次 blind pairwise job 中比较。'] },
      { title: '污染审计', paragraphs: ['精确匹配只能发现直接重复；还需 n-gram、embedding 近邻、解题模板、生成来源和时间戳审计。对合成数据记录 teacher prompt 与 source seed。'] },
    ], takeaway: '可信评测必须锁定 evaluator、计算预算和数据 lineage，才能支持因果归因。',
  },
  {
    id: 'online-eval', title: 'Shadow、Canary、A/B 与持续评测', duration: 30, difficulty: '进阶',
    summary: '把离线 checkpoint 评测连接到真实流量和可回滚发布。',
    objectives: ['区分 shadow/canary/A-B', '定义上线门禁', '处理反馈选择偏差'],
    sections: [
      { title: '三种线上证据', paragraphs: ['Shadow 在不影响用户的情况下重放流量；Canary 给小比例真实请求并严密监控；A/B 比较用户/业务指标。风险递增，证据也更接近真实价值。'] },
      { title: '反馈不是天然 reward', paragraphs: ['点击、停留、重试和点赞含展示偏差、幸存者偏差与用户异质性。需要随机化、倾向校正、分群分析和安全过滤，不能直接把点击率喂给 RL。'] },
      { title: '发布必须可回滚', paragraphs: ['模型、prompt、tool schema、retrieval、guardrail 与 harness 都要版本化；监控错误率、延迟、成本、安全和关键任务成功率，触发自动降级或回滚。'] },
    ], takeaway: '上线不是训练结束，而是进入受控、可回滚的持续学习阶段。',
  },
]

export const agentFoundationsChapter: Chapter = {
  id: 'agent-foundations', index: 6, shortTitle: 'Agent 基础', title: 'Agent：从模型调用到自主闭环',
  subtitle: '从无状态模型调用、工具协议到可控 Agent Loop、状态与多智能体', color: 'blue',
  lessons: [
    {
      id: 'agent-vs-workflow', title: '先分清模型、Agent、Workflow 与 Harness', duration: 38, difficulty: '入门',
      summary: '从一个“模型不能直接改文件”的事实出发，建立后续所有 Agent 工程概念的责任边界。',
      objectives: ['区分 model、tool、workflow、agent 与 harness', '解释意图和真实副作用的边界', '选择最小复杂度架构'],
      sections: [
        { title: '先看一个真实场景', paragraphs: ['用户说“修复登录失败并跑测试”。语言模型本身只会生成 token：它可以写出“读取 auth.ts”或一个结构化工具请求，却不会凭空打开文件、执行命令或提交代码。真正接收请求、判断权限、调用文件与终端工具、收集输出并把结果送回模型的是外部运行系统。', '因此要先记住一个贯穿本课程的约束：模型产生意图，Harness 才能产生效果。模型的工具调用是提案，不是已经发生的动作。权限、沙箱、审批、幂等、追踪和恢复都建立在这条边界上。'] },
        { title: '五个名词放到同一张图里', paragraphs: ['Model 是根据输入预测输出的概率模型；Tool 是可被调用的外部能力；Workflow 用代码预先决定步骤；Agent 允许模型依据 observation 动态决定下一步；Harness 则包围模型，负责把任务、工具、状态、策略和真实执行连接成可控生命周期。'], bullets: ['Chat：重点是生成回复，通常没有开放动作循环', 'Workflow：路径由代码控制，模型只在局部节点提供判断', 'Agent：模型拥有有限的下一步选择权', 'Harness：决定模型看见什么、能请求什么、请求是否执行以及何时停止'] },
        { title: '控制权是最清晰的分界', paragraphs: ['不要按框架名称判断是不是 Agent，而要问“下一步由谁决定”。如果代码固定执行检索、总结、写库三步，它仍是 workflow；如果模型能在搜索、读取、修改、询问用户和结束之间动态选择，它才具有 agentic 控制。工业系统常采用混合结构：外层工作流锁住高风险流程，局部不确定节点才开放给 Agent。'] },
        { title: '什么时候不要用 Agent', paragraphs: ['路径固定、错误代价高且规则可表达、延迟非常严格、或者根本没有可靠验收标准时，开放式 Agent 往往比普通代码更贵、更慢、更难测。先用一次模型调用建立 baseline，再升级为 workflow；只有可枚举步骤无法覆盖真实变化时，才开放 Agent Loop。'], callout: { type: 'industry', title: '最小复杂度原则', text: '每增加一层自主性，都要用任务成功率、成本、延迟和安全数据证明它带来了净收益。' } },
      ], takeaway: 'Agent 的关键不是“会用工具”，而是模型在 Harness 规定的边界内拥有下一步控制权。',
    },
    {
      id: 'agent-model-protocol', title: '模型调用协议：Messages、Tools 与 Streaming', duration: 44, difficulty: '入门',
      summary: '先看懂一次 HTTP 模型调用的输入输出，再理解多轮、工具调用和流式事件如何拼成 Agent。',
      objectives: ['解释模型 API 的无状态本质', '读懂 tool call 与 tool result 配对', '理解流式参数为何必须完整后再解析'],
      sections: [
        { title: '一次调用本质上是一份请求', paragraphs: ['应用把 instructions/messages、当前输入、可用工具 schema、输出预算和采样配置序列化后发给模型服务。模型返回普通文本、结构化输出、工具调用项或不完整/错误状态。API 名称和字段会随供应商变化，但“输入上下文 → 模型输出意图”这个抽象保持不变。', '模型不会因为你第二次调用同一个 endpoint 就自然记得第一次。多轮体验来自 Harness 保存历史或状态标识，并在下一次请求时重新关联所需内容。'] },
        { title: 'Messages 是协议记录，不等于长期记忆', paragraphs: ['System/developer 指令约束角色和规则，user 提供任务，assistant 保存模型输出，tool/function result 保存环境观察。Harness 可以全量回传、使用响应链标识、做摘要或从事件日志重建，但必须保证语义顺序和请求/结果配对。'], callout: { type: 'warning', title: '不要假设隐式继承', text: '不同 API 对上一轮 instructions、存储和响应链的继承规则不同；实现时以当前官方协议为准，并在 trace 中记录实际发送的 context manifest。' } },
        { title: '工具调用分成三步', paragraphs: ['第一步，Harness 把工具名称、描述和参数 schema 作为动作空间交给模型；第二步，模型返回 tool name、arguments 和 call id；第三步，Harness 校验、授权并执行，再用同一个 call id 回填 tool result。模型提出调用不代表工具已运行，参数字符串也不应在未完整接收时直接执行。'] },
        { title: 'Streaming 是事件流，不是半截 JSON', paragraphs: ['流式响应会把文本、工具名和参数拆成多个 delta。运行时按 call id 累积片段，只在对应工具调用块完成后解析完整 JSON、做 schema 校验并进入调度。多个只读调用可以并行，但结果回填顺序必须稳定，写操作还要处理资源冲突。'] },
        { title: '读 TypeScript / Rust Agent 源码时先抓数据流', paragraphs: ['TypeScript 中重点认出 async/await、Promise、联合类型、可选字段与 Zod/JSON Schema；Rust 中重点认出 Result/Option、enum + match、trait、async/await 与所有权边界。初学时不需要先精通两门语言，沿着“请求类型 → 模型响应枚举 → 工具分发 → 状态事件”追踪即可。'], bullets: ['TypeScript 的 type A | B 常表示模型输出的多种分支', 'Rust 的 Result<T, E> 强迫调用者显式处理成功与错误', 'Schema 生成代码决定模型看到的协议，执行器代码决定真实副作用', '常量和类名属于实现快照，数据流与责任边界更值得记忆'] },
      ], takeaway: 'Agent 的第一块地基是准确实现模型协议，而不是先写复杂规划器。',
    },
    {
      id: 'agent-loop-runtime', title: '最小 Agent Loop 与五道执行闸门', duration: 46, difficulty: '进阶',
      summary: '把“模型决定、工具执行、观察回填”写成可验证的循环，并理解每个真实副作用前的控制点。',
      objectives: ['手写最小 Agent Loop', '解释 locate/validate/hook/authorize/execute', '处理并行、配对和停止候选'],
      sections: [
        { title: '六步闭环先跑通', paragraphs: ['每一轮依次完成：组装上下文、调用模型、读取输出、定位工具、校验与授权、执行并回填观察。若模型只返回最终文本，运行时也只是“具备停止资格”，还需检查任务验收、预算和 stop hook，不能把没有工具调用机械等同于业务成功。'] },
        { title: '工具执行前有五道闸门', paragraphs: ['Locate 确认工具存在且当前可见；Validate 验证参数与协议；Hook 运行项目级检查或变换；Authorize 根据用户、风险和策略返回 allow/ask/deny；Execute 才进入沙箱或外部系统。每一层错误都应形成结构化 observation，而不是直接让进程崩溃。'] },
        { title: '调用和结果必须成对', paragraphs: ['一次 tool call 必须对应一个可识别的 tool result，即使执行被拒绝、超时、取消或用户中断，也要回填结构化终态。否则下轮上下文会出现悬空调用，模型与协议都无法判断世界是否已经变化。对写操作尤其要记录 pending action 和幂等键。'] },
        { title: '并行不是 Promise.all 就结束', paragraphs: ['独立只读工具可以在调用块完整后尽早启动；共享资源写入要加读写锁、队列或冲突检测。完成顺序可以不同，但 observation 应按稳定规则回填并保留 call id。并行度、工具数、wall time、token 和成本都属于预算。'] },
      ], takeaway: '最小 loop 很短，难点在 loop 外围的协议、闸门、状态和失败语义。',
    },
    {
      id: 'agent-tools', title: '工具调用：Schema、语义与可恢复错误', duration: 39, difficulty: '进阶',
      summary: '把工具设计成模型可理解、运行时可验证、失败后可恢复的动作空间。',
      objectives: ['写出高质量 tool schema', '分类工具错误', '设计幂等与审批'],
      sections: [
        { title: '工具描述就是动作空间', paragraphs: ['名称、描述、参数类型、必填项、枚举和错误语义共同决定模型能否选对工具。避免功能重叠和万能工具；把高频、可组合、可观察的原子能力暴露给模型。'] },
        { title: '失败必须结构化', paragraphs: ['区分 validation error、permission denied、timeout、rate limit、not found、conflict 与 internal error，并给出是否可重试和下一步提示。把大段堆栈直接塞回上下文只会增加噪声。'], bullets: ['read 与 write 工具分权', '写操作使用 idempotency key', '高风险动作 dry-run + human approval', '工具输出限制大小并标注来源/时间'] },
        { title: '工具选择评测', paragraphs: ['除了 end-to-end success，还要构造 minimal pairs 测选择、参数边界、拒绝错误工具、并行调用和错误恢复。工具升级需做 schema compatibility test。'] },
      ], takeaway: '工具不是 API 的直接镜像，而是面向模型决策与安全执行重新设计的动作接口。',
    },
    {
      id: 'agent-planning-memory', title: '规划、反思、状态与记忆', duration: 38, difficulty: '进阶',
      summary: '区分计划、工作状态、会话记忆和长期记忆，避免把所有历史塞入上下文。',
      objectives: ['比较 plan-and-execute 与 ReAct', '设计 state schema', '理解 memory write policy'],
      sections: [
        { title: '规划是可选计算，不是仪式', paragraphs: ['简单任务边做边想更高效；依赖复杂、可并行或需要审批的任务适合先产出结构化计划。计划应允许 observation 驱动修订，不能把第一版计划当真理。'] },
        { title: '四类状态不要混在一起', paragraphs: ['对话历史保存沟通；working state 保存当前任务事实；artifact 保存文件/结果；long-term memory 保存跨任务稳定信息。它们有不同生命周期、权限和压缩策略。'] },
        { title: '记忆写入比检索更危险', paragraphs: ['错误、敏感或攻击性内容一旦写入长期记忆，会污染未来任务。建立 write gate、来源、TTL、用户可见/可删与冲突解决；memory retrieval 也应接受 prompt injection 检查。'], callout: { type: 'warning', title: '反思的边界', text: '让同一个模型“再检查一次”只能减少部分随机错误；没有外部证据、测试或独立视角时，自我反思可能只是更自信地重复。' } },
      ], takeaway: '可靠 Agent 依赖显式状态与受控记忆，而不是无限增长的聊天记录。',
    },
    {
      id: 'multi-agent', title: '多 Agent 编排：Manager、Handoff 与并行', duration: 36, difficulty: '进阶',
      summary: '知道何时让多个 Agent 协作，以及为什么单 Agent 常是更强基线。',
      objectives: ['比较 agent-as-tool 与 handoff', '设计并行 fan-out/fan-in', '识别多 Agent 协调成本'],
      sections: [
        { title: '三种常用拓扑', paragraphs: ['Manager 把 specialist 当工具并保留最终控制；handoff 把当前会话控制权移交给 specialist；并行 fan-out 让多个 worker 独立探索，再由聚合器合并。拓扑决定上下文、责任和最终答案所有权。'] },
        { title: '多 Agent 不是免费的多样性', paragraphs: ['通信 token、重复检索、冲突合并、共享状态竞态和失败传播会快速增加成本。只有任务可分解、并行收益明显或角色需要不同工具/权限时才值得。'] },
        { title: '协调协议', paragraphs: ['为子任务定义 typed input/output、截止条件、预算、共享 artifact 与冲突策略。不要让 agent 之间只靠自由文本聊天维持大型工程状态。'], callout: { type: 'industry', title: '强基线', text: '先比较“单强 Agent + 好工具/上下文”与多 Agent；许多所谓协作增益其实来自额外测试时计算。' } },
      ], takeaway: '多 Agent 是组织与并发架构，不是模型数量越多能力越强。',
    },
  ],
}

export const harnessChapter: Chapter = {
  id: 'agent-harness', index: 7, shortTitle: 'Agent Harness', title: 'Agent Harness：让智能在边界内可靠运行',
  subtitle: '任务契约、运行循环、上下文、工具、权限、恢复、人工协作、编排与反馈闭环', color: 'orange',
  lessons: [
    {
      id: 'harness-anatomy', title: 'Harness 全景：三种时间尺度与九大组件', duration: 48, difficulty: '入门',
      summary: '从一条核心不变量出发，建立覆盖任务前、运行中和运行后的完整控制面地图。',
      objectives: ['给出准确的 Harness 定义', '解释三种时间尺度与九个组件', '识别组件之间的依赖关系'],
      sections: [
        { title: '为什么只有模型还不够', paragraphs: ['模型可以提出“读文件、搜索网页、修改代码”的意图，但它不知道当前用户真正拥有什么权限，也不会自动保证工具参数合法、操作幂等、状态已持久化或任务已经通过验收。Harness 是模型周围的软件脚手架和控制面：它管理循环、工具路由、上下文、状态、权限、恢复、人工协作、编排、追踪与评测。'] },
        { title: 'Scaffolding 与 Control Plane 是同一对象的两种观察角度', paragraphs: ['参考知识库将 Anthropic 的表述归纳为包围模型的 software scaffolding：loop、tools、context management 和 guardrails；重点是 Harness 会编码对模型局限的假设，模型进步后应删除失效脚手架。OpenAI 相关材料更常从 control plane 和完整 contract 描述：模型调用、工具路由、handoff、approval、run state、recovery、tracing 与 validation。', '两种语言并不冲突：前者提醒我们 Harness 要随模型能力演化并做减法，后者帮助工程团队把运行责任拆成可实现、可观测的组件。本课程使用共同的九组件地图，不把任何单个产品的类名或默认常量当成行业标准。'], callout: { type: 'warning', title: '源码快照边界', text: 'Claude Code、Codex 或其他 Agent 的内部实现会持续变化；课程保留可迁移的设计模式，涉及字段、阈值和平台能力时应回看当前官方文档与源码。' } },
        { title: '三种时间尺度', paragraphs: ['任务开始前是 Contract：Task Spec 定义成功与预算，Tool Registry 定义能力表面，Policy & Sandbox 定义能做什么。任务运行中是 Runtime：Agent Loop 推进决策，State & Context 维持可用信息，Error & Recovery 处理失败，Termination & Human 管停止和交接，Orchestration 管多个执行单元。任务结束后是 Feedback：Tracing & Eval 把结果变成下一轮改进证据。'] },
        { title: '九个组件不是九个孤岛', paragraphs: ['Task Spec 决定 loop 的验收；Tool Registry 同时影响动作空间和 context 成本；Policy 决定调用是允许、询问还是拒绝；Context 与 State 为恢复和编排提供事实；每个 runtime 事件进入 tracing，评测结果再反过来修改任务、工具、策略或提示。Agent Loop 与 Tracing/Eval 是最常见的两个连接枢纽。'] },
        { title: '代码组织不同，责任地图仍相通', paragraphs: ['参考源码图中，一类实现更像从入口沿主循环向下追踪的单链结构，另一类实现把 protocol、core、tools、sandbox、state 等拆成明显分层。目录形状不代表谁更完整：读源码时应把具体文件重新映射到九组件，而不是只寻找一个名为 Harness 或 AgentLoop 的大类。', '最小 loop 往往只占生产代码的一小部分；真正复杂度分散在请求组装、流式协议、进程管理、权限、持久化、错误路径和 telemetry 中。'] },
        { title: '十三个实现深挖会放到哪里', paragraphs: ['参考知识库的 13 个 deep dive 不会作为孤立附录堆在最后，而是沿学习路径进入负责它们的组件。先学协议和最小 loop，再处理上下文生命周期、进程与沙箱，最后统一生态概念。'], bullets: ['请求与协议：Q1 上下文组装、Q2 工具 schema、Q9 多轮状态、Q10 流式工具调用', '上下文生命周期：Q3 长输出、Q4 压缩提示、Q11 上下文回收、Q12 Prompt Cache', '循环与运行时：Q5 终止、Q6 最小循环、Q7 进程控制、Q8 Sandbox Runtime', '生态组合：Q13 Tool、MCP 与 Skill 的责任边界'] },
        { title: '这是菜单，不是强制清单', paragraphs: ['简单只读问答不需要完整状态机；高风险长任务才需要审批、持久恢复和严格沙箱。好的 Harness 不是组件越多越先进，而是每个控制都有真实失败证据支撑，并能在模型能力提升或环境变化后删除过时限制。'], callout: { type: 'insight', title: '建设与维护', text: '建设 Harness 常是补上缺失能力；长期维护则要持续删除已经无效、重复或阻碍模型发挥的控制。' } },
      ], takeaway: 'Harness 是把模型意图变成受控效果、并把运行证据变成改进信号的完整控制面。',
    },
    {
      id: 'harness-task-contract', title: 'Task Spec：把“做完”写成可检查契约', duration: 42, difficulty: '进阶',
      summary: '把自然语言目标、验收器、预算和子任务边界统一成运行契约。',
      objectives: ['设计 task spec', '区分业务成功与机械停止', '定义多维预算和子任务合同'],
      sections: [
        { title: '任务描述决定了系统追求什么', paragraphs: ['一个 Task Spec 至少包含目标、输入、约束、允许产物、done-when、评测方式和预算。它不一定对应某个名为 TaskSpec 的对象，可能分散在用户请求、项目指令、运行参数和验证器中；但 Harness 必须在每轮把一致的任务契约组装给模型和执行层。'] },
        { title: '成功标准与评测器应同源', paragraphs: ['如果任务说“修复 bug”，done-when 应落到测试通过、目标文件变更、没有越权副作用等可检查条件。仅仅“模型没有继续调用工具”只表示机械结束，不表示结果正确。最终回答、环境状态和 verifier 需要一起决定业务成功。'] },
        { title: '预算是多维约束', paragraphs: ['max turns 只是一个维度，还要考虑输入/输出 token、工具次数、并发度、wall time、费用、审批次数和环境资源。软预算用于提醒模型收敛或降级，硬预算由 Harness 强制停止。预算耗尽应产生可解释的终止原因，而不是伪装为成功。'] },
        { title: '子 Agent 也需要任务合同', paragraphs: ['对子 Agent 传递明确的输入、可用工具、权限、输出 schema、截止条件和预算。子任务结果是带来源和状态的消息或 artifact，不是天然可信的函数返回值。Context isolation 能减少污染，但也意味着父 Agent 必须显式提供完成子任务所需的最小上下文。'] },
      ], takeaway: 'Task Spec 把模糊愿望变成模型可理解、系统可执行、评测器可判定的同一份契约。',
    },
    {
      id: 'harness-tool-registry', title: 'Tool Registry：能力表面、Schema 与渐进暴露', duration: 46, difficulty: '进阶',
      summary: '理解为什么工具越多不一定越强，以及 Harness 如何构建每一轮真正对模型可见的动作空间。',
      objectives: ['区分运行时注册表与模型可见投影', '设计 schema 与错误协议', '理解工具描述的 token 与缓存成本'],
      sections: [
        { title: 'Registry 不只是一个静态数组', paragraphs: ['系统拥有的全部工具构成运行时 registry；当前用户、任务阶段、权限和模型真正能看见的只是它的动态投影。Harness 可以先注册大量能力，再按租户、风险、任务和依赖逐层筛选。把所有工具永久塞给模型会增加 token、误选和攻击面。'] },
        { title: 'Schema 是输入合同，错误也是输出合同', paragraphs: ['工具名和描述说明何时使用，JSON Schema 约束参数形状，运行时还要定义成功、可重试错误、参数错误、权限拒绝、超时和部分成功。默认值应 fail-safe；自由文本万能参数会把验证责任推回概率模型。工具输出同样需要大小上限、来源、时间和可恢复引用。'] },
        { title: '工具描述会进入提示前缀', paragraphs: ['Schema 和描述占 context，并影响 prompt cache。稳定工具应保持字段顺序和字节表示稳定；高变化能力放在后面或延迟加载。工具粒度过粗会扩大副作用，过细会增加多步成本，需按任务成功、调用数和恢复难度做消融。'] },
        { title: '渐进披露与 Tool Search', paragraphs: ['工具很多时，可以先暴露搜索/目录能力，再按查询加载候选 schema；也可以按 namespace、任务阶段或显式依赖延迟展开。Discovery 本身必须受权限和版本控制，不能因为模型“搜到了”某个工具就自动获得执行权。'] },
      ], takeaway: 'Tool Registry 的核心不是收集更多 API，而是为当前回合投影最小、清晰、可授权的能力表面。',
    },
    {
      id: 'harness-context', title: 'Context Assembly：每一轮重新编译工作集', duration: 48, difficulty: '硬核',
      summary: '从消息、指令、工具、状态和证据中，为当前决策组装最小充分且可追溯的上下文。',
      objectives: ['画出 context assembly pipeline', '区分工作上下文与持久状态', '正确维护多轮调用/结果关系'],
      sections: [
        { title: '请求通常由三类内容组成', paragraphs: ['第一类是相对稳定的系统/开发者指令和项目规范；第二类是工具定义、环境信息、当前目标与结构化状态；第三类是多轮消息、tool call/result、检索证据和附件。不同 API 有不同外形，但 Harness 都要决定每类内容的优先级、顺序、缓存边界、信任等级和预算。', '参考知识库所用源码快照展示了两种组织风格：一种把稳定 system 段、身份、动态环境/项目说明和历史分段组装，并显式考虑缓存边界；另一种每轮重建 Prompt，把 instructions、环境信息、ResponseItem、function_call_output 与图像等统一投影。不要背类名，要在 trace 中查看最终 wire payload。'] },
        { title: 'Working Context 不等于 Durable State', paragraphs: ['Working context 是模型这一步能看见的白板，受窗口限制；durable state 是事件日志、数据库、artifact 和 checkpoint，负责跨轮与重启保存事实。只有把关键事实外置为可寻址状态，压缩才是“换一种表示”，否则只是忘记。'], formula: '\\mathcal{C}_t=\\operatorname{Assemble}(I,G,S_t,H_t,R_t,\\mathcal{T}_t;B_{\\mathrm{ctx}})', formulaLabel: '预算约束下的上下文组装', formulaNote: 'I 为稳定指令，G 为目标，S 为结构化状态，H 为必要历史，R 为证据，T 为可见工具，B_ctx 为本轮预算。' },
        { title: '多轮状态有三种常见实现', paragraphs: ['应用可以每轮回传完整语义历史；也可以使用服务端 conversation/previous-response 等状态衔接；还可以保存事件日志并按需重建。无论哪种方式，都要知道实际进入模型的内容，不能把“服务端有状态”误解为模型拥有独立长期记忆。'] },
        { title: 'Observation 是不可信数据', paragraphs: ['网页、文档、MCP 结果和终端输出可能包含错误或注入内容。Harness 应标注来源、时间与信任级别，保持指令和数据边界；任何敏感副作用都重新依据用户目标和 policy 授权，不能让工具结果直接提升自己的指令优先级。'] },
      ], takeaway: 'Context engineering 是每轮对信息进行选择、排序、隔离和版本记录，而不是不断把 prompt 写长。',
    },
    {
      id: 'harness-context-recycling', title: '上下文回收：长输出、压缩与 Prompt Cache', duration: 52, difficulty: '硬核',
      summary: '按信息损失从低到高处理上下文压力，并理解压缩、持久化与前缀缓存之间的关系。',
      objectives: ['比较五级上下文回收策略', '设计长工具输出的持久化与取回', '解释 prompt cache 的稳定前缀原则'],
      sections: [
        { title: '先分清三件事', paragraphs: ['Truncation 决定给模型看多少；Persistence 决定完整内容是否保存在外部；Retrieval 决定模型以后能否按路径、范围或查询取回。把长输出截短但不保存，会永久丢证据；保存了却没有可寻址工具，也不能真正防止忘记。', '源码快照中可以看到不同取舍：有的执行器保留头部并把完整输出持久化后返回路径，有的优先省略中段，并依赖持久终端会话或后续读取命令继续取证。比较方案时不要只问“截了多少字符”，还要问原文在哪里、模型能否取回、进程是否仍存活。'] },
        { title: '五级回收从可逆到有损', paragraphs: ['优先把大 artifact 外置并在 context 留摘要、路径和 hash；然后裁剪明显冗余的旧历史；再把早期 tool results 做 micro-compaction；仍超限时进行局部上下文折叠；最后才对整段会话做 full compaction。每一级都要记录被替换内容、恢复入口和触发阈值。'] },
        { title: '压缩提示要保留什么', paragraphs: ['好的压缩结果保留用户目标、硬约束、已完成动作、关键观察、未解决问题、pending action、artifact 引用、预算与终止条件。摘要不是自由发挥的文章，而是下一轮可执行状态。对高风险任务，结构化 ledger 应比自然语言摘要更权威。'] },
        { title: 'Prompt Cache 复用稳定前缀', paragraphs: ['缓存通常复用相同请求前缀的预填充计算，而不是替你保存任务状态。把稳定的工具 schema、系统规则和静态说明放前面，变化频繁的状态放后面；避免无意义的序列化抖动。压缩会改变前缀，因此“节省 token”和“提高 cache hit”需要联合权衡。'], callout: { type: 'industry', title: '不要迷信缓存技巧', text: '具体缓存字段、断点数和保留时间会随供应商变化；课程强调的是稳定前缀、可观测命中率和成本归因这三个长期原则。' } },
      ], takeaway: '可靠压缩的前提是先把事实外置、留下地址，再按可恢复性逐级减少工作上下文。',
    },
    {
      id: 'harness-safety', title: 'Policy、Sandbox 与进程控制', duration: 52, difficulty: '硬核',
      summary: '把“是否允许”与“即使出错最多影响什么”分成两层，并落实到文件、网络和进程运行时。',
      objectives: ['区分 policy 与 sandbox', '实现 allow/ask/deny', '设计超时、取消和进程树清理'],
      sections: [
        { title: 'Policy 是闸门，Sandbox 是防爆墙', paragraphs: ['Policy 根据用户、工具、参数、风险和历史授权，决定 allow、ask 或 deny；Sandbox 使用操作系统、容器或受限执行器，限制文件、网络、进程、系统调用和资源。前者回答“这次请求该不该执行”，后者回答“即使执行器或模型犯错，影响半径有多大”。两者正交，不能互相替代。'] },
        { title: '权限必须在执行层强制', paragraphs: ['Prompt 中的“禁止删除”只是软约束。模型只能请求 capability，Harness 用确定性规则和实际凭据决定是否执行。读取与写入分权，敏感凭据按任务短期下发；高风险动作展示具体参数、影响和可逆性后进入 ask 状态。'] },
        { title: '文件、网络和 Shell 都要两层控制', paragraphs: ['文件层先做路径/能力策略，再由沙箱限制真实可见目录；网络层先做域名或服务 allowlist，再在运行时限制出站连接；Shell 层先筛查命令意图，再用受限用户、资源配额和系统调用约束执行。任何平台 fallback 都必须显式暴露，不能静默变成无沙箱运行。', '参考源码快照中的实现会按平台选择不同隔离机制，例如 macOS 的系统策略沙箱，或 Linux 的 namespace/系统调用过滤组合。具体机制和可用性会变化，但选择、降级、环境提示和审批升级必须进入 trace。'] },
        { title: '进程控制是可靠性的一部分', paragraphs: ['终端工具要管理 stdout/stderr 流、输出上限、超时、取消、后台任务和整个进程树。只杀父进程可能遗留子进程继续写文件或占端口。长任务应返回可轮询的 session id，取消采用温和信号到强制终止的分级策略，并在 run 结束时清理资源。', '源码中也常见两类终端语义：每次启动新 shell、由 Harness 模拟当前目录，或者维护可持续交互的 PTY/session。前者隔离简单，后者适合长进程和增量输出；两者对 cwd、环境变量、取消和恢复的契约不同。'], callout: { type: 'warning', title: 'Hard boundary', text: '允许某次工具调用不代表可以绕过硬沙箱；审批扩大的是特定动作权限，不是给模型永久管理员权限。' } },
      ], takeaway: 'Policy 控制决定，Sandbox 控制后果；可靠 Harness 必须同时拥有两层。',
    },
    {
      id: 'harness-recovery', title: '错误、重试、无进展检测与崩溃恢复', duration: 48, difficulty: '硬核',
      summary: '把失败视为运行中的正常观察，并保证每次重试都可解释、有限且不会重复副作用。',
      objectives: ['设计分层错误协议', '区分可重试与不可重试错误', '实现进展保证和 crash recovery'],
      sections: [
        { title: '错误不是循环之外的异常', paragraphs: ['参数验证失败、权限拒绝、超时、限流、资源冲突、空结果和环境故障都应被分类。靠近模型的错误要转换为简短、可行动的 observation；基础设施错误则由 Harness 重试、降级或暂停。错误信息应说明稳定 code、发生位置、是否可重试和建议下一步。'] },
        { title: '重试必须带语义', paragraphs: ['网络抖动和限流可指数退避；参数错误应让模型修改参数；权限拒绝需要审批或换方案；永久 not-found 不应原样重试。写操作只有在幂等键、结果查询或补偿事务明确时才可自动重试。每类错误设置独立 attempt 和 wall-time 上限。'] },
        { title: 'Harness 要证明系统在前进', paragraphs: ['比较连续轮次的状态 delta、重复调用签名、错误序列和未完成子目标，检测循环、振荡和“换句话重复”。触发后可以注入诊断、切换策略、请求人工或终止。单纯 max turns 能防无限循环，却不能解释为何没有进展。'] },
        { title: '崩溃恢复依赖事件和 pending action', paragraphs: ['每次可能产生副作用前先持久化 intent、call id、幂等键和 expected state；完成后再原子记录 result。进程重启时先查询外部系统和幂等存储，判断动作未执行、已成功还是部分成功，再决定继续、补偿或人工介入。'] },
      ], takeaway: '恢复不是多试几次，而是让每个失败都进入状态机，并保证重试不会把不确定性放大成重复副作用。',
    },
    {
      id: 'harness-termination', title: '终止、预算、审批与 Human-in-the-Loop', duration: 46, difficulty: '进阶',
      summary: '明确 Agent 何时成功、何时停手、何时等待人，以及暂停后如何无歧义地恢复。',
      objectives: ['区分四类退出', '区分 approval 与 clarification', '设计 pause/resume/cancel'],
      sections: [
        { title: '模型没有一个神奇的 done 位', paragraphs: ['模型返回最终文本或没有工具调用，只能作为停止候选。Harness 还要检查 verifier、任务状态、未完成动作和 stop hook。相反，某些环境已经达到成功条件时，即使模型想继续，也应由运行时阻止多余副作用。', '不同实现把边界放在不同层：有的 Runner 直接支持 turn、费用与 stop hook；有的把 thread、turn、attempt 分层，并把部分总预算交给上层客户端。读源码时要找到真正拥有循环的层，不能因为某个函数没有 max_turns 就断言系统无限运行。'] },
        { title: '四类退出要分别记录', paragraphs: ['Success 表示验收通过；Budget exhausted 表示时间、token、工具或成本用尽；Model handback 表示模型需要用户信息或无法继续；Escalation 表示风险、冲突或故障需要人工接管。FAILED、CANCELLED 和 PAUSED 也不能混成一条自然语言消息。'] },
        { title: '审批和澄清不是一回事', paragraphs: ['Approval 是“动作已经明确，是否允许执行”；Clarification 是“任务或参数仍不明确，需要用户补充”。审批 UI 必须展示工具、参数、影响、可逆性和作用域；澄清则保存问题、已知上下文和恢复位置，避免用户回答后 Agent 从头猜。'] },
        { title: '暂停必须可持久化', paragraphs: ['进入 WAITING_APPROVAL 或 WAITING_INPUT 前，保存 run version、pending action、外部状态摘要、预算和过期策略。恢复时重新授权并检查世界是否变化；取消时终止活跃进程、撤销临时凭据并把未完成 artifact 标为不可信。'] },
      ], takeaway: '终止与人工协作是显式状态机，不是依赖模型礼貌地说“任务完成”。',
    },
    {
      id: 'harness-orchestration', title: 'Orchestration：子 Agent 的本质是上下文隔离', duration: 44, difficulty: '进阶',
      summary: '从控制权、上下文、状态和通信协议理解多 Agent，而不是用角色扮演堆叠模型调用。',
      objectives: ['解释 context isolation', '比较代码编排与模型编排', '设计子 Agent 结果回传和并发上限'],
      sections: [
        { title: '子 Agent 不是换一个角色名', paragraphs: ['真正的子 Agent 拥有独立上下文、工具投影、预算、状态或执行线程。它的价值首先是隔离：让专门任务不污染父 Agent 工作集，也让权限和历史按需裁剪。仅在同一 prompt 中写“你现在是研究员”没有获得这种隔离。'] },
        { title: '代码编排与模型编排', paragraphs: ['代码编排适合固定依赖、审批和并发图，结果可预测；模型编排适合任务分解无法预先枚举的场景，灵活但更难评测。常见混合方式是代码控制 fan-out/fan-in、预算和权限，模型只选择子任务内容或候选 specialist。'] },
        { title: '结果是事件，不是普通函数返回值', paragraphs: ['子 Agent 可能完成、失败、超时、请求输入或产生 artifact。父 Agent 应通过带 task id、status、provenance、cost 和输出 schema 的 mailbox/event 接收结果，再验证和聚合。不要把自由文本结果直接当成已验证事实。'] },
        { title: '并发受状态和成本约束', paragraphs: ['独立检索可并行，共享仓库写入需要锁、分支或 ownership；多 Agent 还要限制总并发、递归深度、token、工具配额和 fan-in 等待策略。公平比较必须给单 Agent 同等测试时计算预算。'] },
      ], takeaway: '多 Agent 的核心工程价值是隔离与组织，而不是把同一个模型重复调用很多次。',
    },
    {
      id: 'harness-observability', title: 'Tracing、Replay、Evals 与自我修正传感器', duration: 41, difficulty: '进阶',
      summary: '把每次模型决策、工具调用和上下文变化变成可诊断、可回放的轨迹。',
      objectives: ['设计 trace/span schema', '区分 replay 与 re-execution', '建立 guides/sensors 闭环'],
      sections: [
        { title: 'Trace 要能回答因果链', paragraphs: ['记录 run/turn/model/tool/retrieval/guardrail/handoff span，包含模型与 prompt 版本、输入摘要、token/latency/cost、tool args/result、state diff、policy decision 和错误。敏感内容默认脱敏。'] },
        { title: 'Replay 有不同层级', paragraphs: ['纯日志回放只重建 UI；model replay 固定工具 observation 重跑决策；environment re-execution 重新执行工具，可能受外部状态变化影响。测试要明确使用哪种。可复现目标通常是可回放、可重跑、可归因，而不是要求随机模型和外部世界逐 bit 相同。'] },
        { title: 'Run 指标和 Harness 指标不同', paragraphs: ['Run-level 评测问“这次任务是否完成、成本多少、哪里失败”；Harness-level 评测问“换上下文策略、工具描述、权限规则或恢复机制后，跨任务分布是否更好”。一次 run completed 不等于答案正确，一次答案正确也不等于轨迹安全高效。', '参考知识库审阅的两个源码库都提供了丰富 telemetry/rollout 线索，但在所检查范围内没有一套可直接替代业务 eval suite 的内建答案。Trace 是原料，团队仍需在外部定义任务 fixture、verifier、统计方法与发布门禁。'] },
        { title: 'Guides 与 Sensors', paragraphs: ['Guides 在行动前提供规则、技能、参考与计算工具；Sensors 在行动后提供测试、linter、日志、浏览器状态或语义 review。确定性 sensor 应优先进入每步自修正循环，昂贵 judge 用于需要语义判断的节点。'], callout: { type: 'insight', title: 'Harness Engineering', text: '前馈约束减少第一次犯错，反馈传感器让系统发现并修正错误；只有一边都会留下盲区。' } },
      ], takeaway: '没有结构化 trace、状态 diff 和可回放环境，就无法可靠改进长程 Agent。',
    },
    {
      id: 'harness-mcp', title: 'Tool、MCP 与 Skill：三层能力如何组合', duration: 44, difficulty: '进阶',
      summary: '最后统一执行能力、连接协议和工作方法，避免把 Tool、MCP、Skill 当作互相替代的三种方案。',
      objectives: ['区分 Tool/MCP/Skill', '解释 host/client/server', '设计 discovery、授权与技能加载'],
      sections: [
        { title: '三者解决不同问题', paragraphs: ['Tool 是可执行能力，例如读文件或查询订单；MCP 是 Host 与外部 Server 发现和调用 prompts/resources/tools 的连接协议；Skill 是可加载的领域说明、流程和检查清单，告诉 Agent 如何完成某类任务，但本身不直接产生副作用。一个 Skill 可以指导 Agent 使用本地 Tool，也可以声明需要某个 MCP Server。'] },
        { title: 'MCP 不替代 Host/Harness', paragraphs: ['Server 暴露能力与 schema，Client 维护协议连接，Host 决定哪些内容进入上下文、哪些工具对当前模型可见、是否需要用户同意以及如何执行和记录。协议互操作不等于信任，更不自动授予远端系统访问用户数据的权限。'] },
        { title: 'Manifest 与完整说明分工', paragraphs: ['Skill manifest 用少量稳定信息帮助 Harness 发现适用场景、依赖与入口；完整 instructions 在真正需要时加载，避免所有技能正文长期占满 context。工具也可以先展示目录，再通过 tool search 延迟加载 schema。两者都属于渐进披露。'] },
        { title: '完整组合流程', paragraphs: ['任务到达后，Harness 先匹配 Skill，读取其工作方法和依赖；再从本地 registry 与 MCP 连接中构建当前可用工具投影；模型提出调用；Harness 仍按 validate、hook、authorize、sandbox、execute 处理；结果进入 state、trace 和下一轮 context。'], callout: { type: 'warning', title: '供应链边界', text: '第三方 Skill 指令、MCP schema 和 Tool 输出都可能变化或不可信；需要固定版本、最小权限、来源标记和明确的用户同意。' } },
      ], takeaway: 'Tool 负责做事，MCP 负责连接能力，Skill 负责教方法，Harness 负责把三者安全地组织起来。',
    },
  ],
}

export const trainingSystemsChapter: Chapter = {
  id: 'training-systems', index: 10, shortTitle: '训练系统', title: '后训练系统：从单卡实验到异步集群',
  subtitle: '并行策略、Rollout/Learner 解耦、权重同步、容错与成本', color: 'red',
  lessons: [
    {
      id: 'parallelism-memory', title: '显存模型与并行策略', duration: 40, difficulty: '硬核',
      summary: '理解 DP/FSDP/ZeRO、TP、PP、CP/Sequence Parallel 的切分对象。',
      objectives: ['估算训练显存', '按互联选择并行', '理解 RL 多模型放置'],
      sections: [
        { title: '先写显存账本', paragraphs: ['参数、master weights、梯度、优化器状态、激活、KV cache、通信 buffer 和碎片共同占用显存。SFT 主要是训练图；在线 RL 还并存 rollout engine、reference、RM/critic 与长序列 KV cache。'] },
        { title: '不同并行切不同维度', paragraphs: ['Data Parallel 复制模型分数据；FSDP/ZeRO 切模型状态；Tensor Parallel 切层内矩阵；Pipeline Parallel 切层；Context/Sequence Parallel 切序列。并行越多，通信和调度越复杂。'] },
        { title: 'RL 的资源放置', paragraphs: ['colocate 提高 GPU 复用但训练/生成相互抢显存；disaggregate 让 rollout 与 learner 独立扩缩，但增加权重同步与网络传输。选择取决于生成/训练耗时比例、模型大小和互联。'] },
      ], takeaway: '并行策略是显存、通信、调度和 RL 阶段比例的联合优化，不是越多维越先进。',
    },
    {
      id: 'rollout-inference', title: 'Rollout Engine、KV Cache 与权重同步', duration: 39, difficulty: '硬核',
      summary: '理解为什么在线 RL 的核心瓶颈常是生成与新鲜权重分发。',
      objectives: ['计算 rollout 吞吐', '解释 generation-training mismatch', '设计权重版本协议'],
      sections: [
        { title: '生成成本随输出长度增长', paragraphs: ['Prefill 处理 prompt，decode 每步生成一个 token 并读写 KV cache。多候选、长 CoT 与工具多轮让 decode 和环境等待主导 wall time。continuous batching、prefix caching 和 speculative decoding 可改善吞吐，但会改变批处理与数值路径。'] },
        { title: '推理与训练 logprob 必须对得上', paragraphs: ['不同 kernel、精度、temperature 处理、vocabulary mask 或权重版本会造成 behavior logprob 与 learner 重算不一致。重要性比率对小误差敏感，应监控 mismatch 并使用版本/校正机制。'] },
        { title: '权重同步协议', paragraphs: ['每个 rollout 记录 policy version；learner 发布不可变 checkpoint/增量；actor 在安全边界切换；旧轨迹按 lag 丢弃、降权或校正。同步过程自身需 checksum、超时与回滚。'] },
      ], takeaway: '在线 RL 的样本不仅要正确，还必须能证明由哪个策略、哪套采样语义生成。',
    },
    {
      id: 'async-architecture', title: '同步、异步与流式 Experience Pipeline', duration: 43, difficulty: '硬核',
      summary: '设计 actor、environment、reward、experience store 与 learner 的生产级数据流。',
      objectives: ['比较 barrier 与 streaming', '控制 backpressure', '保证轨迹原子性'],
      sections: [
        { title: '同步简单，异步高吞吐', paragraphs: ['同步迭代保证数据新鲜且易调试，但受 straggler 拖累；异步让 actor 持续产出、learner 持续消费，利用率更高但带来 policy lag、重复/丢失与 backpressure。'] },
        { title: 'Experience schema 是核心接口', paragraphs: ['包含 prompt/task id、完整 observation/action、behavior logprob、mask、reward 分解、终止原因、policy/environment/reward version、时间与错误。单条 trajectory 或 transition 必须原子提交。'] },
        { title: 'Exactly-once 通常不值得硬追', paragraphs: ['分布式训练可通过唯一 trajectory id、幂等写、去重与统计容忍实现 effectively-once。更重要的是检测系统性偏差：某类长任务因超时从数据流中消失。'], callout: { type: 'industry', title: '流量控制', text: '按 learner 消费速度、lag 和有效样本率做 backpressure；只追 rollout 数会堆积大量过时或无梯度轨迹。' } },
      ], takeaway: '异步系统优化的是有效且足够新鲜的训练 token 吞吐，不是原始 trajectory 数。',
    },
    {
      id: 'rl-observability', title: 'RL 可观测性、容错与成本归因', duration: 34, difficulty: '进阶',
      summary: '把学习信号、系统性能和数据分布放在同一张诊断图上。',
      objectives: ['设计分层指标', '定位 straggler/OOM/NAN', '计算有效样本成本'],
      sections: [
        { title: '三层指标必须关联', paragraphs: ['学习层：reward/KL/entropy/advantage/clip；数据层：难度、长度、全对全错率、截断；系统层：tokens/s、queue、GPU utilization、同步和环境延迟。用 task/policy version 关联，才能解释 reward 波动。'] },
        { title: '失败样本也是分布', paragraphs: ['OOM、timeout、parser error、tool error 和 reward failure 若被静默丢弃，会改变训练分布。记录失败率并按任务/长度/worker 切片，必要时以显式终止奖励处理。'] },
        { title: '成本归因到有效更新', paragraphs: ['报告每个有效 prompt 组、每个非零优势 token、每点评测提升的 GPU-hour 与生成 token。这样才能比较 dynamic sampling、组大小和算法。'], formula: '\\mathrm{cost}_{\\mathrm{effective}}=\\frac{\\mathrm{GPU\\ hours}+c_{\\mathrm{env}}+c_{\\mathrm{judge}}}{N_{\\mathrm{nonzero\\text{-}advantage\\ tokens}}}', formulaLabel: '有效学习信号成本（示意）', formulaNote: '分母需结合任务定义；该指标用于暴露大量全对/全错、截断或失败 rollout 的浪费。' },
      ], takeaway: '后训练系统应优化“产生可用学习信号的成本”，而不是孤立的 GPU 利用率。',
    },
  ],
}

export const distillationChapter: Chapter = {
  id: 'distillation', index: 11, shortTitle: '蒸馏与交付', title: '蒸馏、压缩与模型交付',
  subtitle: '把昂贵的教师、搜索与 RL 能力迁移为可部署策略', color: 'green',
  lessons: [
    {
      id: 'rejection-sampling', title: 'Best-of-N、拒绝采样与迭代自训练', duration: 31, difficulty: '进阶',
      summary: '把多采样与 verifier/judge 选择转化为新的示范或偏好数据。',
      objectives: ['区分 pass@N 与 selected@N', '设计拒绝采样数据', '控制教师/验证器偏差'],
      sections: [
        { title: '生成与选择是两个模型能力', paragraphs: ['Best-of-N 先由 proposal policy 生成 N 个候选，再由 verifier/RM/judge 选一个。pass@N 衡量候选覆盖，selected accuracy 衡量选择器能否找到正确候选；二者必须分开报告。'] },
        { title: '选中候选可以怎么用', paragraphs: ['作为 SFT target 做 rejection sampling fine-tuning；与低分候选组成 DPO pair；保留完整候选和分数训练 RM；或只在推理时 rerank。选择会改变数据难度和风格，需保留来源与 N。'] },
        { title: '迭代会放大偏差', paragraphs: ['模型生成、同族 judge 选择、再训练同一模型会形成闭环。使用独立 verifier、人工 anchor、来源多样性和固定评测，避免风格坍缩与错误自举。'] },
      ], takeaway: '拒绝采样用测试时计算制造离线监督，是 SFT/DPO 与在线 RL 之间的重要桥梁。',
    },
    {
      id: 'knowledge-distillation', title: 'Logit、Sequence 与 Reasoning Distillation', duration: 38, difficulty: '硬核',
      summary: '理解软标签、教师轨迹和能力迁移的不同信息量与成本。',
      objectives: ['写出温度蒸馏目标', '比较 logit 与 sequence KD', '识别 reasoning imitation 的表面化'],
      sections: [
        { title: '软分布包含暗知识', paragraphs: ['Logit KD 让学生匹配教师在词表上的概率分布，比 one-hot target 提供候选 token 相对关系，但需要访问教师 logits，存储和通信成本高。'], formula: '\\mathcal{L}_{\\mathrm{KD}}=T^2\\,\\mathrm{KL}\\!\\left(p_{\\mathrm{teacher}}^{(T)}\\,\\Vert\\,p_{\\mathrm{student}}^{(T)}\\right)', formulaLabel: 'Temperature-scaled logit distillation', formulaNote: 'T 软化分布；T² 常用于补偿温度对梯度尺度的影响。实际还会与 hard-label NLL 混合。' },
        { title: 'Sequence KD 更像数据生产', paragraphs: ['教师生成 answer/rationale，学生做 SFT，适用于闭源教师且工程简单；但只有采样到的轨迹，丢失完整分布信息。多样化采样与验证比单条贪心答案更重要。'] },
        { title: '推理格式不等于推理能力', paragraphs: ['学生可能学会“首先、其次、检查”的表面 CoT，却没有获得教师的搜索覆盖。用新难题、短预算、过程错误和工具迁移测试是否真正内化。'] },
      ], takeaway: '蒸馏迁移的是教师在数据与分布中显露的信息，不会自动复制教师全部潜在能力。',
    },
    {
      id: 'onpolicy-distillation', title: 'On-Policy Distillation 与学生分布', duration: 35, difficulty: '硬核',
      summary: '让教师针对学生当前会访问的状态提供监督，缩小离线轨迹偏移。',
      objectives: ['解释 student-induced distribution', '比较 GKD 与离线 KD', '控制教师调用成本'],
      sections: [
        { title: '为什么固定教师数据会过时', paragraphs: ['学生改进后访问的前缀与错误状态不同于最初教师轨迹。On-policy distillation 从学生生成前缀/轨迹出发，让教师给分布、纠正或续写，使监督覆盖学生真实状态。'] },
        { title: '与 RL 的关系', paragraphs: ['它不一定需要标量 reward 或策略梯度，而是用教师分布提供 dense target；但同样需要在线生成、版本同步和昂贵教师推理。可视作分布纠正型模仿学习。'] },
        { title: '混合策略', paragraphs: ['固定高质量离线数据稳住基础，少量 on-policy 样本覆盖学生错误，再用可验证任务做 rejection/RL。控制教师调用预算并防止学生完全继承教师偏差。'] },
      ], takeaway: 'On-policy distillation 的价值在于让教师教“学生此刻真正会犯的错”。',
    },
    {
      id: 'compression-delivery', title: '量化、合并、部署一致性与回归', duration: 33, difficulty: '进阶',
      summary: '从训练 checkpoint 到真实服务模型，避免最后一公里抹掉后训练增益。',
      objectives: ['区分训练量化与部署量化', '验证 adapter merge', '建立服务一致性测试'],
      sections: [
        { title: '交付物不是一个权重目录', paragraphs: ['模型权重、tokenizer、chat template、generation config、special tokens、tool schema、adapter/merge 方法和 license 一起构成版本。遗漏任一项都可能改变行为。'] },
        { title: '量化需要任务级校准', paragraphs: ['PTQ 通过校准集估计量化尺度；QAT/量化感知微调在训练中模拟误差。困惑度变化小不代表工具 JSON、长上下文或安全边界不退化，必须跑完整任务回归。'] },
        { title: 'Merge 与 serving parity', paragraphs: ['LoRA merge 前后应在固定精度验证 logits/生成近似；训练框架与 vLLM/TensorRT-LLM 等服务引擎要检查 tokenizer、stop、sampling 和 logits processor 一致性。'], callout: { type: 'industry', title: '最终门禁', text: '所有离线质量、安全、延迟和成本结论，都应针对最终量化与服务引擎产物重跑，而不是只测 bf16 trainer checkpoint。' } },
      ], takeaway: '后训练只有在最终服务产物上仍通过质量、安全与成本门禁，才算真正完成。',
    },
  ],
}

export const additionalPapers = [
  { title: 'WTF is Agent Harness?', year: '2026', stage: 'Harness Knowledge Base', why: '从四项基础、九大组件到十三个实现深挖的源码导读与知识地图', url: 'https://lulusiyuyu.github.io/WTFisHarness/' },
  { title: 'Building Effective Agents', year: '2024', stage: 'Agent Architecture', why: 'Workflow 与 Agent、组合式编排和工具设计', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
  { title: 'DAPO: An Open-Source LLM Reinforcement Learning System at Scale', year: '2025', stage: 'Reasoning RL', why: '动态采样、解耦裁剪、token loss 与 overlong shaping', url: 'https://arxiv.org/abs/2503.14476' },
  { title: 'Understanding R1-Zero-Like Training: A Critical Perspective', year: '2025', stage: 'Dr.GRPO', why: 'GRPO 长度偏差与更简化的无偏优化视角', url: 'https://arxiv.org/abs/2503.20783' },
  { title: 'Group Sequence Policy Optimization', year: '2025', stage: 'GSPO', why: 'sequence-level importance ratio 与 MoE RL 稳定性', url: 'https://arxiv.org/abs/2507.18071' },
  { title: 'Harness Engineering for Coding Agent Users', year: '2026', stage: 'Harness', why: 'Guides、Sensors、前馈与反馈控制的工程框架', url: 'https://martinfowler.com/articles/harness-engineering.html' },
  { title: 'Model Context Protocol Specification', year: '2025', stage: 'MCP', why: 'Host/Client/Server 与 prompts/resources/tools 的标准边界', url: 'https://modelcontextprotocol.io/specification/2025-06-18/index' },
  { title: 'Demystifying Evals for AI Agents', year: '2026', stage: 'Agent Evals', why: '多轮环境、轨迹与生产级 Agent 评测方法', url: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents' },
  { title: 'Reinforcing Multi-Turn Reasoning via Turn-Level Credit Assignment', year: '2025', stage: 'Agentic RL', why: '多轮 MDP 与 turn-level 信用分配', url: 'https://arxiv.org/abs/2505.11821' },
]
