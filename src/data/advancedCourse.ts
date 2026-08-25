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
  subtitle: 'Workflow、Agent Loop、工具、规划、记忆与多智能体边界', color: 'blue',
  lessons: [
    {
      id: 'agent-vs-workflow', title: 'Agent、Workflow 与普通 Chat 的边界', duration: 32, difficulty: '入门',
      summary: '先定义系统中谁决定下一步，再判断是否真的需要 Agent。',
      objectives: ['区分 workflow 与 agent', '解释 augmented LLM', '选择最小复杂度架构'],
      sections: [
        { title: '控制权是最清晰的分界', paragraphs: ['普通 chat 是一次或多次模型响应；workflow 由代码预先规定执行路径；agent 让模型根据 observation 动态选择下一动作、工具和终止条件。多数生产系统是混合体：外层确定性 workflow，局部开放节点交给 agent。'] },
        { title: 'Agent Loop 的最小闭环', paragraphs: ['运行时组装上下文并调用模型；模型输出 final answer 或 tool call；harness 校验并执行工具；结果作为 observation 写回；直到完成、请求人工或触达预算。'], code: `while budget.remaining():\n    context = assemble_context(state, tools, policy)\n    decision = model.generate(context)\n    if decision.is_final(): return verify(decision)\n    call = validate(decision.tool_call)\n    observation = execute_with_policy(call)\n    state.append(decision, observation)` },
        { title: '什么时候不要用 Agent', paragraphs: ['路径固定、错误代价高且可规则表达、延迟严格或评测标准不清时，workflow 往往更可靠。Agent 用灵活性换取成本、延迟和不确定性。'], callout: { type: 'industry', title: '架构准则', text: '先做一次调用，再做 workflow，最后才开放 agent 自主决策；每一级复杂度都要由可测增益证明。' } },
      ], takeaway: 'Agent 的本质是模型拥有下一步控制权，而不是使用了某个框架或画了多节点图。',
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
  subtitle: '运行循环、上下文工程、工具协议、持久状态、权限、安全与可观测性', color: 'orange',
  lessons: [
    {
      id: 'harness-anatomy', title: 'Harness 的七层结构', duration: 38, difficulty: '进阶',
      summary: '理解模型之外负责控制、执行、验证和恢复的完整运行时。',
      objectives: ['定义 Agent Harness', '拆分 execution/context/lifecycle', '画出 run state machine'],
      sections: [
        { title: '模型不是 Agent 的全部', paragraphs: ['Harness 是包围模型的运行与控制层：Execution 执行循环；Tooling 暴露动作；Context 组装输入；Lifecycle 管理暂停/恢复/取消；Observability 记录轨迹；Verification 检查结果；Governance 管理权限与审批。'] },
        { title: '把运行建模为状态机', paragraphs: ['显式状态可包含 READY、MODEL_RUNNING、TOOL_PENDING、WAITING_APPROVAL、RETRYING、PAUSED、COMPLETED、FAILED、CANCELLED。状态转换要原子化并可持久化，才能支持长任务恢复。'], code: `READY -> MODEL_RUNNING -> TOOL_PENDING\n  -> WAITING_APPROVAL -> TOOL_RUNNING\n  -> MODEL_RUNNING -> COMPLETED\nAny state -> PAUSED | FAILED | CANCELLED` },
        { title: '预算与终止属于 Harness', paragraphs: ['max turns、token/cost/time budget、工具配额、重复检测、无进展检测和最终验收共同决定何时停止。把终止完全交给模型会造成死循环或过早结束。'], callout: { type: 'insight', title: '一句定义', text: 'Agent loop 是骨架；Harness 是让这个循环在真实失败、权限和长程状态下仍可运行、可解释、可停止的系统。' } },
      ], takeaway: 'Harness 把概率模型的建议转换成受控、可恢复、可审计的系统行为。',
    },
    {
      id: 'harness-context', title: 'Context Engineering 与压缩策略', duration: 42, difficulty: '硬核',
      summary: '在有限 context window 中选择此刻真正有用的指令、状态、证据和工具。',
      objectives: ['设计 context assembler', '比较截断/摘要/检索', '防止 lost-in-the-middle 与注入'],
      sections: [
        { title: 'Context 是每一步重新编译的工作集', paragraphs: ['系统指令、用户目标、政策、工具 schema、近期轨迹、任务状态、检索证据和 memory 不应简单全量拼接。Harness 根据当前阶段、权限和预算组装最小充分上下文。'] },
        { title: '压缩必须保留可验证状态', paragraphs: ['滑窗最简单但会丢早期约束；摘要节省 token 但会累积失真；检索可找回信息但依赖 query；结构化 state/ledger 最适合关键事实。实践通常组合使用。'], formula: '\\mathcal{C}_t=\\operatorname{Assemble}(I, G, S_t, M_t, R_t, \\mathcal{T}_t; B_{\\mathrm{ctx}})', formulaLabel: 'Context assembly under a token budget', formulaNote: 'I 为指令，G 为目标，S 为工作状态，M 为记忆，R 为检索证据，T 为可用工具，B_ctx 为上下文预算。' },
        { title: '不可信 observation 要隔离', paragraphs: ['网页、文档和工具输出是数据，不是高优先级指令。标注来源、引用边界、权限与信任级别；敏感工具调用前重新依据用户目标和 policy 验证，而不是服从 observation 中的命令。'] },
      ], takeaway: 'Context engineering 不是 prompt 修辞，而是受预算和信任边界约束的运行时数据选择。',
    },
    {
      id: 'harness-mcp', title: 'MCP、Tool Registry 与协议边界', duration: 36, difficulty: '进阶',
      summary: '理解 MCP 的 prompts/resources/tools 控制权与 Harness 的宿主责任。',
      objectives: ['区分 MCP primitive', '解释 host/client/server', '设计 tool discovery 与权限'],
      sections: [
        { title: 'MCP 标准化连接，不替代 Harness', paragraphs: ['MCP Server 暴露 resources、prompts、tools；Client 维持协议连接；Host 负责用户体验、模型调用、权限、安全和上下文。协议解决互操作，是否调用、暴露多少、如何审批仍是 harness 决策。'] },
        { title: '三类 primitive 的控制权', paragraphs: ['Prompts 通常由用户选择，Resources 由应用加入上下文，Tools 由模型请求执行。理解控制权有助于设计 consent 与 UI，不能把服务器提供的一切默认授予模型。'] },
        { title: '工具发现也占上下文', paragraphs: ['工具数多时全量 schema 会挤占 context 并增加误选。可按任务/权限筛选、分层 registry、语义检索工具或使用 namespace；但 discovery 结果也需版本和审计。'], callout: { type: 'warning', title: '供应链风险', text: '第三方 MCP server 同时带来数据外发、代码执行和 schema 变更风险；使用 allowlist、最小权限、隔离与明确用户同意。' } },
      ], takeaway: 'MCP 提供标准插座，Harness 决定插什么、何时通电以及发生故障如何断开。',
    },
    {
      id: 'harness-safety', title: '权限、沙箱、Guardrail 与 Human-in-the-Loop', duration: 43, difficulty: '硬核',
      summary: '以最小权限和影响半径控制 Agent 的真实副作用。',
      objectives: ['设计 capability-based permission', '区分输入/输出/工具 guardrail', '实现暂停审批'],
      sections: [
        { title: '权限在执行层强制', paragraphs: ['Prompt 里的“不要删除”不是安全边界。文件、网络、凭据、数据库和外部消息权限应由执行环境/工具层强制；模型只能请求 capability，Harness 根据 policy 和用户授权决定。'] },
        { title: '风险分级与审批', paragraphs: ['只读、可逆写、外部沟通、财务/账号/删除等动作需要不同策略。高风险调用先展示目标、参数、影响和可逆性，持久化 run state，审批后准确恢复。'], bullets: ['默认拒绝未声明 capability', '把 read 与 write credential 分离', '沙箱限制 filesystem/network/process', '所有副作用使用审计 ID 与幂等键'] },
        { title: 'Guardrail 放在哪', paragraphs: ['输入 guardrail 检查用户请求；tool guardrail 检查每次调用参数与结果；输出 guardrail 检查最终交付。多 Agent handoff 后不能假设首尾 guardrail 自动覆盖中间工具。'], callout: { type: 'industry', title: 'Blast radius', text: '可靠性的目标不是假设模型永不犯错，而是让单次错误的最大影响与用户授予的信任成比例。' } },
      ], takeaway: 'Agent 安全的底线由 Harness 和执行环境强制，而不是模型自觉。',
    },
    {
      id: 'harness-observability', title: 'Tracing、Replay、Evals 与自我修正传感器', duration: 41, difficulty: '进阶',
      summary: '把每次模型决策、工具调用和上下文变化变成可诊断、可回放的轨迹。',
      objectives: ['设计 trace/span schema', '区分 replay 与 re-execution', '建立 guides/sensors 闭环'],
      sections: [
        { title: 'Trace 要能回答因果链', paragraphs: ['记录 run/turn/model/tool/retrieval/guardrail/handoff span，包含模型与 prompt 版本、输入摘要、token/latency/cost、tool args/result、state diff、policy decision 和错误。敏感内容默认脱敏。'] },
        { title: 'Replay 有不同层级', paragraphs: ['纯日志回放只重建 UI；model replay 固定工具 observation 重跑决策；environment re-execution 重新执行工具，可能受外部状态变化影响。测试要明确使用哪种。'] },
        { title: 'Guides 与 Sensors', paragraphs: ['Guides 在行动前提供规则、技能、参考与计算工具；Sensors 在行动后提供测试、linter、日志、浏览器状态或语义 review。确定性 sensor 应优先进入每步自修正循环，昂贵 judge 用于需要语义判断的节点。'], callout: { type: 'insight', title: 'Harness Engineering', text: '前馈约束减少第一次犯错，反馈传感器让系统发现并修正错误；只有一边都会留下盲区。' } },
      ], takeaway: '没有结构化 trace、状态 diff 和可回放环境，就无法可靠改进长程 Agent。',
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
  { title: 'Building Effective Agents', year: '2024', stage: 'Agent Architecture', why: 'Workflow 与 Agent、组合式编排和工具设计', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
  { title: 'DAPO: An Open-Source LLM Reinforcement Learning System at Scale', year: '2025', stage: 'Reasoning RL', why: '动态采样、解耦裁剪、token loss 与 overlong shaping', url: 'https://arxiv.org/abs/2503.14476' },
  { title: 'Understanding R1-Zero-Like Training: A Critical Perspective', year: '2025', stage: 'Dr.GRPO', why: 'GRPO 长度偏差与更简化的无偏优化视角', url: 'https://arxiv.org/abs/2503.20783' },
  { title: 'Group Sequence Policy Optimization', year: '2025', stage: 'GSPO', why: 'sequence-level importance ratio 与 MoE RL 稳定性', url: 'https://arxiv.org/abs/2507.18071' },
  { title: 'Harness Engineering for Coding Agent Users', year: '2026', stage: 'Harness', why: 'Guides、Sensors、前馈与反馈控制的工程框架', url: 'https://martinfowler.com/articles/harness-engineering.html' },
  { title: 'Model Context Protocol Specification', year: '2025', stage: 'MCP', why: 'Host/Client/Server 与 prompts/resources/tools 的标准边界', url: 'https://modelcontextprotocol.io/specification/2025-06-18/index' },
  { title: 'Demystifying Evals for AI Agents', year: '2026', stage: 'Agent Evals', why: '多轮环境、轨迹与生产级 Agent 评测方法', url: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents' },
  { title: 'Reinforcing Multi-Turn Reasoning via Turn-Level Credit Assignment', year: '2025', stage: 'Agentic RL', why: '多轮 MDP 与 turn-level 信用分配', url: 'https://arxiv.org/abs/2505.11821' },
]
