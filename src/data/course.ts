import type { Chapter, Concept, Paper } from '../types'
import {
  additionalPapers,
  agentFoundationsChapter,
  directPreferenceAdvancedLessons,
  distillationChapter,
  evaluationAdvancedLessons,
  harnessChapter,
  preferenceAdvancedLessons,
  reasoningAdvancedLessons,
  rlhfAdvancedLessons,
  sftAdvancedLessons,
  trainingSystemsChapter,
} from './advancedCourse'

const coreChapters: Chapter[] = [
  {
    id: 'sft', index: 1, shortTitle: 'SFT', title: '监督微调：把基座模型教成助手',
    subtitle: '数据、目标函数、模板、参数高效微调与灾难性遗忘', color: 'green',
    lessons: [
      {
        id: 'sft-objective', title: 'SFT 到底在优化什么', duration: 28, difficulty: '入门',
        summary: '从 next-token prediction 出发，理解 instruction tuning 如何塑造模型的条件分布。',
        objectives: ['写出 SFT 的 token-level 交叉熵目标', '区分预训练、继续预训练与 SFT', '解释 assistant-only loss 的必要性'],
        sections: [
          {
            title: '同一个目标，不同的数据分布',
            paragraphs: [
              'SFT 通常没有发明新的损失函数：它仍然最小化下一个 token 的负对数似然。真正改变模型行为的，是训练样本由“自然文本”切换成“指令 → 理想回答”的条件分布。模型学到的不只是知识，还包括回答边界、语气、格式和拒答方式。',
              '继续预训练（CPT）更像补充领域语料与语言分布；SFT 更像明确展示任务接口和行为范式。工业项目常先用少量高纯度领域 CPT 恢复术语分布，再用 SFT 建立任务行为。两者不能简单互换。',
            ],
            formula: '\\mathcal{L}_{\\mathrm{SFT}}(\\theta)=-\\sum_{t=1}^{T}m_t\\log \\pi_{\\theta}\\!\\left(y_t\\mid x,y_{<t}\\right)',
            formulaLabel: 'Masked token-level negative log-likelihood',
            formulaNote: 'm_t 是 loss mask。常见做法只让 assistant token 参与损失，system/user token 作为条件而非预测目标。',
            callout: { type: 'insight', title: '关键直觉', text: 'SFT 是行为克隆：它逼近数据中的专家策略，而不是直接优化“回答质量”这个抽象目标。' },
          },
          {
            title: 'Chat template 是训练契约',
            paragraphs: ['BOS/EOS、角色标记、工具调用标记和换行都进入 token 序列。训练与推理模板不一致，会产生比超参数错误更隐蔽的退化。'],
            bullets: ['训练前随机 decode 样本，检查角色边界与 EOS', '验证多轮样本中只 mask 掉应被忽略的 token', '推理时复用 tokenizer.apply_chat_template，而不是手拼字符串'],
            code: `# 伪代码：只对 assistant 回答计算损失\nlabels = input_ids.clone()\nlabels[assistant_mask == 0] = -100\nloss = cross_entropy(logits[:, :-1], labels[:, 1:])`,
          },
          {
            title: 'SFT 能与不能',
            paragraphs: ['SFT 擅长教会格式、任务流程、术语和基本推理轨迹；但它受限于示范数据支持集，难以系统探索比示范更优的策略。错误或冗长的思维链还会被逐 token 模仿。'],
            callout: { type: 'industry', title: '工业判断', text: '如果问题是“不会按格式输出”，先修数据与 SFT；如果问题是“能生成多个候选但不会稳定选优”，再考虑偏好优化。' },
          },
        ],
        takeaway: 'SFT 的核心不是“再训练一次”，而是用一致的数据契约进行条件行为克隆。',
      },
      {
        id: 'sft-data', title: '高质量指令数据工程', duration: 35, difficulty: '进阶',
        summary: '建立从任务定义、采样、合成、过滤、去重到数据混合的可审计流水线。',
        objectives: ['设计多维数据 schema', '识别污染、重复与风格坍缩', '用能力分桶做数据配比'],
        sections: [
          { title: '质量由任务分布定义', paragraphs: ['“高质量”不是文采好，而是正确、可验证、覆盖真实流量、难度合适且格式一致。先把线上任务拆成能力桶：知识问答、抽取、代码、数学、工具调用、安全等，再在桶内定义验收标准。'], bullets: ['记录 source、license、generator、verifier、difficulty、domain', '保留失败原因而不只保留 pass/fail', '训练集、验证集、金丝雀集按来源隔离，防止近重复泄漏'] },
          { title: '合成数据不是免费午餐', paragraphs: ['Self-Instruct、强模型蒸馏和拒绝采样可以快速扩充数据，但会复制教师偏差。常见闭环是：种子任务 → 多样化生成 → 规则过滤 → judge/验证器打分 → 语义去重 → 人工抽检。'], callout: { type: 'warning', title: '常见失败', text: '只按“答案看起来不错”筛选，会让长度、语气和模板成为伪特征，模型学会讨好 judge 而非完成任务。' } },
          { title: '混合比例与课程学习', paragraphs: ['数据量增加并不单调提升效果。通用能力数据用于稳住基线，领域数据提供增益，安全与格式数据约束边界。按 token 而非样本数计算比例，并监控每个桶的梯度与离线评测。'], formula: 'p_k=\\frac{w_k n_k^{\\alpha}}{\\sum_j w_j n_j^{\\alpha}}', formulaLabel: '能力桶采样概率', formulaNote: 'α<1 可降低超大数据桶的支配效应；w_k 体现业务价值和当前短板。' },
        ],
        takeaway: '先建立能力地图与验证器，再谈扩量；数据配比本身就是模型产品策略。',
      },
      {
        id: 'sft-systems', title: 'LoRA、全参微调与训练诊断', duration: 32, difficulty: '进阶',
        summary: '根据预算和任务选择参数更新方式，并读懂 loss 之外的训练信号。',
        objectives: ['比较 Full FT、LoRA、QLoRA', '估算显存构成', '诊断过拟合与能力遗忘'],
        sections: [
          { title: '参数效率的真实取舍', paragraphs: ['LoRA 将权重更新约束为低秩矩阵 ΔW=BA，训练参数少、检查点小、迭代快；全参微调容量更高，适合大规模、多能力迁移。QLoRA 量化冻结的基座权重以降低显存，但训练吞吐与量化误差仍需实测。'], formula: 'W^{\\prime}=W+\\Delta W,\\qquad \\Delta W=\\frac{\\alpha}{r}BA,\\quad B\\in\\mathbb{R}^{d_{\\mathrm{out}}\\times r},\\ A\\in\\mathbb{R}^{r\\times d_{\\mathrm{in}}}', formulaLabel: 'LoRA 低秩增量', formulaNote: 'r、target modules、learning rate 和数据规模共同决定容量，不能只复制默认配置。' },
          { title: '显存账本', paragraphs: ['全参训练显存通常包含参数、梯度、优化器状态、激活和通信 buffer。bf16 参数本身不是最大项；Adam 状态和激活经常才是瓶颈。梯度检查点以额外计算换激活显存，ZeRO/FSDP 切分模型状态。'], bullets: ['OOM 前记录 sequence length 分布而非只看平均值', 'packing 提高 token 利用率，但要检查跨样本 attention 隔离', '吞吐统一用有效 tokens/s/GPU 比较'] },
          { title: '不要只盯训练 loss', paragraphs: ['训练 loss 下降只说明更像训练集。应同时观察 held-out loss、格式成功率、能力分桶指标、回答长度、重复率和安全回归。'], callout: { type: 'industry', title: '停止条件', text: '工业训练通常由综合评测门禁决定，而不是“epoch 跑完”。保存可回滚检查点，并用相同推理参数对比。' } },
        ],
        takeaway: '参数高效微调节省的是迭代成本，不会替你解决数据错误和评测盲区。',
      },
    ],
  },
  {
    id: 'preference', index: 2, shortTitle: '偏好与 RM', title: '偏好数据与奖励模型',
    subtitle: '把“更好”转化为可学习、可测量、可审计的信号', color: 'orange',
    lessons: [
      {
        id: 'preference-data', title: '偏好数据：chosen 与 rejected', duration: 30, difficulty: '入门',
        summary: '理解成对比较、排序标注、评分标注和隐式反馈各自的统计含义。',
        objectives: ['设计无位置偏差的成对标注', '区分 pointwise、pairwise、listwise', '计算标注一致性'],
        sections: [
          { title: '为什么比较比打分更稳', paragraphs: ['对“这条回答是 7 分还是 8 分”，标注员尺度常不一致；对同一 prompt 的两条回答选优通常更稳定。偏好数据的基本单元是 (x, y_w, y_l)，表示在上下文 x 下 y_w 优于 y_l。'], bullets: ['随机交换 A/B 位置以消除位置偏差', '候选难度要适中：全是碾压局学不到细粒度边界', '允许 tie/无法判断，避免强迫制造噪声'] },
          { title: '标注 rubric 决定隐含目标', paragraphs: ['Helpfulness、correctness、harmlessness、style 可能冲突。一个总分会掩盖冲突，最好先做分维度判断，再定义聚合策略。对数学和代码优先使用可执行验证器，对开放回答使用多人标注或 LLM judge 加人工校准。'], callout: { type: 'warning', title: '偏好泄漏', text: '如果 chosen 总是更长、更分点或总含某个开场白，奖励模型会利用这些捷径。必须监控长度胜率和风格特征。' } },
          { title: '主动采样有价值的 pair', paragraphs: ['随机候选常产生大量易例。可以优先标注 RM 不确定、多个 judge 分歧、线上高频或安全风险高的 pair，从而提高单位标注成本的信息量。'], formula: '\\operatorname{priority}(x)=u(x)\\cdot w_{\\mathrm{traffic}}(x)\\cdot w_{\\mathrm{risk}}(x)', formulaLabel: '主动标注启发式', formulaNote: '这是工程启发式，不是唯一公式；重点是把标注预算投向决策边界。' },
        ],
        takeaway: '偏好数据不是“两个答案加标签”，而是一套对价值冲突和标注偏差的测量设计。',
      },
      {
        id: 'reward-model', title: '奖励模型与 Bradley–Terry', duration: 36, difficulty: '硬核',
        summary: '从 pairwise likelihood 到 reward hacking，掌握奖励模型的训练与校准。',
        objectives: ['推导 pairwise RM loss', '理解 reward scale 不可辨识性', '设计 RM 验证集'],
        sections: [
          { title: '把偏好拟合成标量', paragraphs: ['奖励模型 r_φ(x,y) 输出一个标量。Bradley–Terry 假设 chosen 胜出的概率由两者 reward 差决定。训练只约束差值，因此给所有 reward 加同一常数不改变概率。'], formula: '\\mathcal{L}_{\\mathrm{RM}}(\\phi)=-\\mathbb{E}_{(x,y_w,y_l)}\\!\\left[\\log\\sigma\\!\\left(r_{\\phi}(x,y_w)-r_{\\phi}(x,y_l)\\right)\\right]', formulaLabel: 'Bradley–Terry pairwise loss', formulaNote: '模型学到的是相对偏好。绝对 reward 数值不可跨模型、跨版本直接比较。' },
          { title: 'Reward model 也会过拟合', paragraphs: ['高 RM accuracy 不等价于好策略。策略优化会主动搜索 RM 的漏洞，进入训练数据之外的分布。需要评估普通 pair、对抗 pair、长度控制 pair、风格反事实 pair，并观察 reward 与人工偏好的相关性。'], bullets: ['对同答案做长度截断/扩写反事实', '对正确内容改写格式，检查风格敏感度', '对事实和代码加入可验证错误，检查 reward 是否识别'] },
          { title: 'Outcome 与 Process Reward', paragraphs: ['ORM 只评价最终答案，成本低但信用分配稀疏；PRM 对中间步骤打分，可用于过程监督和搜索，但标注昂贵且“正确步骤”的定义更困难。'], callout: { type: 'industry', title: '混合奖励', text: '常见系统将规则验证器、ORM、PRM、安全分类器和长度惩罚组合；每个分量都要单独监控，避免聚合分数掩盖退化。' } },
        ],
        takeaway: '奖励模型是可被策略攻击的代理目标，验证它要像验证安全关键测量仪器。',
      },
      {
        id: 'rlaif', title: 'RLAIF、宪法式反馈与 Judge', duration: 26, difficulty: '进阶',
        summary: '用模型反馈扩展监督，同时认识自偏好、位置偏差和评测污染。',
        objectives: ['解释 RLAIF 流程', '设计 judge 校准实验', '区分生成器与评判器偏差'],
        sections: [
          { title: '从人工反馈到 AI 反馈', paragraphs: ['RLAIF 用强模型或规则生成偏好、批评和修订，降低标注成本并扩展到长尾。宪法式方法先写原则，再让模型依据原则批评与改写，最后把这些信号用于 SFT 或偏好优化。'] },
          { title: 'LLM-as-a-Judge 的三类偏差', paragraphs: ['Judge 会受位置、长度、措辞和“自家模型”风格影响。单次 win-rate 没有可信区间也很危险。'], bullets: ['交换候选顺序并取一致结果', '隐藏模型身份并归一化格式', '用人工金标计算分维度准确率与校准曲线', '对明显正确/错误样例设 sanity check'] },
          { title: '工业界的分层使用', paragraphs: ['规则可验证任务优先规则；高风险样本优先人工；大量开放样本用 judge；分歧样本进入人工仲裁。这是成本、速度与可信度的组合优化。'], callout: { type: 'insight', title: '边界', text: 'AI 反馈扩展的是已被写进 rubric 的价值，不会自动发现 rubric 漏掉的问题。' } },
        ],
        takeaway: 'RLAIF 的关键不是换掉人，而是让人定义原则、校准评判器并审计失败分布。',
      },
    ],
  },
  {
    id: 'rlhf', index: 3, shortTitle: 'RLHF / PPO', title: '经典 RLHF 与 PPO',
    subtitle: 'Actor、Reference、Reward、Critic 如何组成在线优化闭环', color: 'blue',
    lessons: [
      {
        id: 'rlhf-pipeline', title: '四模型与在线采样闭环', duration: 30, difficulty: '进阶',
        summary: '拆解 InstructGPT 式 SFT → RM → PPO 管线以及各模型职责。',
        objectives: ['画出 rollout 与 update 数据流', '解释 reference model 的作用', '区分 on-policy 与 off-policy'],
        sections: [
          { title: 'RLHF 的四个角色', paragraphs: ['Actor 生成回答并被更新；Reference 固定，用于约束分布漂移；Reward Model 为完整回答打分；Critic 估计 value，降低策略梯度方差。工程实现可以共享权重或分布式放置，但逻辑角色不能混淆。'], bullets: ['Rollout：从 prompt 采样 response 与 logprob', 'Scoring：计算 RM reward、规则奖励和 KL', 'Advantage：用 value/GAE 估计每个 token 的优势', 'Update：多轮 minibatch 更新 actor 与 critic'] },
          { title: '为什么必须在线采样', paragraphs: ['策略梯度要对当前策略访问到的分布求期望。策略更新后，旧数据逐渐变成 off-policy；PPO 用概率比和 clipping 限制每批数据复用时的偏差，但不能无限复用。'], formula: '\\rho_t(\\theta)=\\frac{\\pi_{\\theta}(a_t\\mid s_t)}{\\pi_{\\theta_{\\mathrm{old}}}(a_t\\mid s_t)}', formulaLabel: 'Importance ratio', formulaNote: '当新旧策略相差太大，importance ratio 方差会爆炸。这里用 ρ 避免与 reward r_t 混淆。' },
          { title: 'RLHF 不只是一个 loss', paragraphs: ['生成速度、训练速度、权重同步、序列变长和模型共置决定系统效率。实际瓶颈经常在 rollout 而不是反向传播。'], callout: { type: 'industry', title: '系统重点', text: '观察 tokens/s、生成等待、actor/critic 利用率、权重同步时间和有效 batch，而不只看 GPU 是否“占满”。' } },
        ],
        takeaway: '经典 RLHF 是一个在线数据系统：模型一边产生训练分布，一边改变这个分布。',
      },
      {
        id: 'ppo-math', title: 'PPO、GAE 与 KL 约束', duration: 44, difficulty: '硬核',
        summary: '逐项理解 clipped surrogate objective，以及 token-level 信用分配。',
        objectives: ['解释 PPO clip 的上下界', '计算 GAE', '区分 reward KL 与 loss KL'],
        sections: [
          { title: 'PPO clipped objective', paragraphs: ['当优势 A_t>0，希望提高该 token 概率；A_t<0 时希望降低。但比率变化过大意味着用旧数据估计新策略不再可靠，因此取 unclipped 与 clipped 目标的较保守者。'], formula: 'J^{\\mathrm{CLIP}}(\\theta)=\\mathbb{E}_t\\!\\left[\\min\\!\\left(\\rho_t(\\theta)\\hat A_t,\\ \\operatorname{clip}(\\rho_t(\\theta),1-\\epsilon,1+\\epsilon)\\hat A_t\\right)\\right]', formulaLabel: 'PPO clipped surrogate objective', formulaNote: '这是需要最大化的 surrogate objective；实现里通常最小化其负值，并叠加 value loss、entropy bonus 等项。clip 不是 KL 的硬上界。' },
          { title: '序列奖励如何分到 token', paragraphs: ['RM 常只给 EOS 处一个终局奖励，KL 惩罚分布在每个 token。Critic 估计 V(s_t)，GAE 用 TD residual 在偏差与方差之间折中。'], formula: '\\delta_t=r_t+\\gamma V_{\\psi}(s_{t+1})-V_{\\psi}(s_t),\\qquad \\hat A_t^{\\mathrm{GAE}(\\gamma,\\lambda)}=\\sum_{l=0}^{T-t-1}(\\gamma\\lambda)^l\\delta_{t+l}', formulaLabel: 'TD residual 与 GAE', formulaNote: '语言生成常令 γ≈1；λ 越高通常偏差更小、方差更大。终止与截断必须使用不同的 bootstrap mask。' },
          { title: 'KL 的两种放置', paragraphs: ['可以把 −β log(π/π_ref) 加入 reward，也可在 policy loss 中加入 KL penalty。两者梯度与实现细节不同，指标命名必须清晰。自适应 β 根据目标 KL 调节约束强度。'], callout: { type: 'warning', title: '面试陷阱', text: 'PPO clipping 控制的是新旧策略比率，reference KL 控制的是相对 SFT/reference 的漂移；二者不是同一个约束。' } },
        ],
        takeaway: 'PPO 的稳定性来自有限数据复用、优势估计与多重漂移约束，而不是某个神奇公式。',
      },
      {
        id: 'ppo-debug', title: 'PPO 训练崩溃诊断', duration: 34, difficulty: '硬核',
        summary: '从 reward、KL、entropy、clip fraction 和长度识别失控模式。',
        objectives: ['识别 reward hacking', '解释 KL 爆炸与 entropy collapse', '制定训练监控面板'],
        sections: [
          { title: '四条必须联读的曲线', paragraphs: ['Reward 上升可能是能力提升，也可能是 exploit。至少同时看 reference KL、response length、entropy、clip fraction 和独立评测。若 reward 飙升而人工胜率下降，优先怀疑奖励漏洞。'], bullets: ['KL 突升：学习率过高、β过小、旧 logprob 错位', 'Entropy 快速下降：探索坍缩或奖励过尖', 'Clip fraction 长期过高：每步更新过大', 'Value loss/variance 爆炸：critic 难拟合或 reward scale 不稳'] },
          { title: '实现级隐蔽 bug', paragraphs: ['Padding mask、左/右 padding、EOS reward 位置、生成温度、old logprob 与训练 token 对齐，都能让公式正确而训练失败。先在极小 batch 上手算一个样本。'] },
          { title: '恢复策略', paragraphs: ['保存 actor、critic、optimizer、scheduler、随机状态和数据游标。只恢复 actor 权重通常不是真正 resume。'], callout: { type: 'industry', title: '上线门禁', text: '每个 checkpoint 都跑固定 prompt 集、随机盲测和安全回归；不要用训练 RM 同时充当最终裁判。' } },
        ],
        takeaway: 'RL debug 的本质是同时审计目标、采样分布、估计器和系统对齐。',
      },
    ],
  },
  {
    id: 'direct-preference', index: 4, shortTitle: 'DPO 系', title: '直接偏好优化家族',
    subtitle: '不用显式奖励模型的离线对齐，以及它真正省掉和没有省掉的东西', color: 'red',
    lessons: [
      {
        id: 'dpo-core', title: 'DPO 从哪里来', duration: 38, difficulty: '硬核',
        summary: '从 KL 正则化最优策略关系推到二分类式 DPO loss。',
        objectives: ['解释 implicit reward', '读懂 DPO log-ratio', '说明 β 的作用'],
        sections: [
          { title: '把最优策略反解成奖励', paragraphs: ['在 KL 正则化 RL 目标下，最优策略与 reference 的概率比指数正比于 reward。DPO 将这个关系代入 Bradley–Terry 偏好模型，绕过显式 RM 和在线 PPO。'], formula: '\\mathcal{L}_{\\mathrm{DPO}}(\\theta)=-\\mathbb{E}\\!\\left[\\log\\sigma\\!\\left(\\beta\\left(\\log\\frac{\\pi_{\\theta}(y_w\\mid x)}{\\pi_{\\mathrm{ref}}(y_w\\mid x)}-\\log\\frac{\\pi_{\\theta}(y_l\\mid x)}{\\pi_{\\mathrm{ref}}(y_l\\mid x)}\\right)\\right)\\right]', formulaLabel: 'Direct Preference Optimization', formulaNote: '模型学习相对于 reference 更偏向 chosen、远离 rejected。π(y|x) 是回答 token 条件概率的乘积；实现通常在 log-space 求和。' },
          { title: 'β 不是普通学习率', paragraphs: ['β 对应 KL 正则强度/偏好间隔尺度。较大 β 在同一 log-ratio 下使分类更尖锐，但其行为还受实现中的 loss 定义、长度归一化与数据噪声影响，应以 KL 和胜率联合调参。'] },
          { title: 'DPO 省掉了什么', paragraphs: ['省掉显式 RM、critic 和 on-policy rollout，工程简单且稳定；但仍需要成对偏好、reference forward 和可靠评测。更关键的是，它只在离线数据覆盖的回答上学习，不能主动探索新轨迹。'], callout: { type: 'insight', title: '选择原则', text: '开放式对话且预算有限时 DPO 常是强基线；需要可验证探索、长程决策或策略超越离线候选时，在线 RL 更合适。' } },
        ],
        takeaway: 'DPO 是对 KL 正则化偏好学习的巧妙重参数化，不是“完全不需要奖励”的方法。',
      },
      {
        id: 'dpo-family', title: 'IPO、KTO、ORPO 与 SimPO', duration: 30, difficulty: '进阶',
        summary: '根据标签形态、reference 成本和噪声选择直接对齐算法。',
        objectives: ['比较主流 offline 方法', '从数据形态选算法', '识别长度偏差'],
        sections: [
          { title: '家族差异看三个问题', paragraphs: ['先问：有没有 pair？是否愿意保留 reference？是否需要和 SFT 合并训练？不同算法多是在偏好建模假设、margin 和 reference 使用方式上做取舍。'], bullets: ['IPO：用平方损失缓解可分数据上 DPO 过拟合倾向', 'KTO：可使用独立 desirable/undesirable 标签，不要求成对', 'ORPO：将 SFT NLL 与 odds-ratio 偏好项合并，不需独立 reference', 'SimPO：以长度归一化平均 logprob 和目标 margin 做 reference-free 优化'] },
          { title: '没有普适冠军', paragraphs: ['同一算法在不同数据构造、长度分布、模型尺寸和评测器上排名可能反转。正确实验是固定数据、推理设置与评测，报告均值、方差、长度和 KL。'] },
          { title: '长度是隐藏变量', paragraphs: ['序列 logprob 求和天然随长度变得更负；不同 loss 的长度归一化会改变偏好。必须画 chosen/rejected 长度差与胜率关系。'], callout: { type: 'warning', title: '错误比较', text: '把一个经过精细数据清洗的 DPO 模型与原始 PPO 基线比较，不能得出“算法优于算法”；多数增益可能来自数据。' } },
        ],
        takeaway: '算法选择应由反馈形态和系统约束驱动，数据与评测控制比追新缩写更重要。',
      },
      {
        id: 'offline-online', title: '离线偏好与在线偏好的边界', duration: 24, difficulty: '进阶',
        summary: '理解 distribution shift、在线 DPO、迭代式 DPO 与拒绝采样。',
        objectives: ['解释 offline distribution mismatch', '设计迭代数据飞轮', '比较 RS、DPO 和在线 RL'],
        sections: [
          { title: '策略变了，旧 pair 还代表什么', paragraphs: ['离线 pair 来自某个行为策略。模型提升后会访问新的回答分布，旧 rejected 可能过于简单，chosen 也可能不再是最优。此时继续刷同一数据容易饱和。'] },
          { title: '迭代式对齐飞轮', paragraphs: ['常见做法是当前模型多采样 → verifier/judge 选优 → 形成新 SFT 或 preference 数据 → 更新模型 → 重新采样。拒绝采样微调直接模仿优质候选，在线 DPO 更新 pair，RL 则直接利用 reward。'], formula: '\\pi_k\\xrightarrow{\\text{sample }G}\\{y_i\\}_{i=1}^{G}\\xrightarrow{\\text{score / select}}\\mathcal{D}_k\\xrightarrow{\\text{update}}\\pi_{k+1}', formulaLabel: '迭代式数据飞轮', formulaNote: '每轮必须保留固定 anchor eval，否则 judge 或数据分布变化会制造虚假进步。' },
          { title: '何时升级到在线方法', paragraphs: ['当候选质量方差不足、任务有可验证奖励、需要探索新策略，或多轮交互的后果依赖早期动作时，在线方法的价值上升。'], callout: { type: 'industry', title: '成本决策', text: '先用 SFT/DPO 建立强初始策略，再把昂贵在线 rollout 用在高价值、可验证的能力上，通常更经济。' } },
        ],
        takeaway: '离线对齐的上限受数据支持集约束；迭代采样是从数据方法走向策略优化的桥。',
      },
    ],
  },
  {
    id: 'reasoning-rl', index: 5, shortTitle: '推理 RL', title: '可验证推理与 GRPO',
    subtitle: '从结果奖励、组内相对优势到长思维链的涌现与风险', color: 'green',
    lessons: [
      {
        id: 'rlvr', title: 'RLVR：可验证奖励为何强大', duration: 30, difficulty: '进阶',
        summary: '用数学、代码和结构化任务理解 Reinforcement Learning with Verifiable Rewards。',
        objectives: ['区分 RM reward 与 verifier reward', '设计防作弊验证器', '理解 pass@k 与 pass@1'],
        sections: [
          { title: '从主观偏好到客观验收', paragraphs: ['数学答案、单元测试、SQL 执行结果、结构约束可以给出低噪声奖励。RLVR 让模型通过探索发现能通过验证器的推理策略，减少训练一个通用 RM 的需求。'] },
          { title: '验证器定义了任务', paragraphs: ['只检查最终数值可能被格式漏洞、答案泄漏或测试不完备利用。安全验证器需做解析隔离、隐藏测试、资源限制和对抗样例。'], bullets: ['不要让 prompt 暴露测试答案', '代码执行使用沙箱与超时', '格式分与正确性分分开记录', '训练验证器和最终评测验证器保留差异'] },
          { title: '探索与能力上限', paragraphs: ['若基模型对一个 prompt 的所有采样都失败，组内奖励没有正信号。要通过更强起点、课程难度、温度、多样化采样或少量 cold-start SFT 提高可学习样本比例。'], callout: { type: 'insight', title: '核心条件', text: 'RL 放大“偶尔能做对”的能力；它不能凭空从全零奖励中高效发明知识。' } },
        ],
        takeaway: '可验证奖励提供低噪声目标，但验证器本身必须经得起策略搜索。',
      },
      {
        id: 'grpo', title: 'GRPO 与组内相对优势', duration: 40, difficulty: '硬核',
        summary: '理解无 critic 的优势估计、组采样、裁剪和 KL 正则。',
        objectives: ['计算 group-normalized advantage', '比较 GRPO 与 PPO', '解释组内零方差问题'],
        sections: [
          { title: '用同题候选互为 baseline', paragraphs: ['GRPO 对每个 prompt 采样 G 个回答，用组内 reward 均值与标准差归一化得到优势，省去 critic。它降低了模型数量与显存，但需要多次生成，rollout 成本仍高。'], formula: '\\hat A_i=\\frac{R_i-\\mu_R}{\\sigma_R+\\varepsilon},\\qquad \\mu_R=\\frac{1}{G}\\sum_{j=1}^{G}R_j,\\quad \\sigma_R^2=\\frac{1}{G}\\sum_{j=1}^{G}(R_j-\\mu_R)^2', formulaLabel: 'GRPO group-relative advantage', formulaNote: '所有候选奖励相同时优势为零或数值上接近零，该 prompt 对本步更新几乎无贡献。是否除以标准差是 GRPO 与部分改进方法的重要差异。' },
          { title: '与 PPO 的本质差异', paragraphs: ['PPO 通常用 learned critic 做状态/每 token baseline；GRPO 用同 prompt 候选的终局相对奖励。GRPO 更适合结果可验证、能并行采多候选的任务，但信用分配更粗。'] },
          { title: '稳定训练细节', paragraphs: ['监控每题 reward 方差、全对/全错比例、输出长度、KL、clip ratio、有效 token 和 importance sampling mismatch。推理引擎与训练引擎数值不一致会使 old logprob 偏差，需要权重同步与校正。'], callout: { type: 'warning', title: '不要神化 GRPO', text: '省掉 critic 不等于训练免费；多候选生成、长序列与奖励计算通常主导总成本。' } },
        ],
        takeaway: 'GRPO 用组内比较换掉 critic，适配可验证推理，但仍是受分布与系统约束的在线策略优化。',
      },
      {
        id: 'reasoning-behavior', title: '长推理、冷启动与蒸馏', duration: 34, difficulty: '进阶',
        summary: '分析 DeepSeek-R1 式多阶段训练中可读性、探索与能力迁移。',
        objectives: ['解释 cold-start 数据作用', '识别 length hacking', '区分 RL 提升与蒸馏迁移'],
        sections: [
          { title: '为什么常需要 cold start', paragraphs: ['纯 RL 可能产生可验证但难读、语言混杂或格式不稳的轨迹。少量高质量推理示范先建立输出协议与基本策略，再让 RL 探索，通常更稳。'] },
          { title: '更长不等于更会推理', paragraphs: ['奖励与长度相关时模型可能通过反复检查、重复或拖延来获益。应同时看准确率、tokens/solution、截断率、重复率和最短正确路径。'], bullets: ['对超长但错误样本单独统计', '按难度画长度—正确率曲线', '对截断样本施加合理惩罚', '用独立 judge 检查可读性，不把风格分混进正确性'] },
          { title: '蒸馏把昂贵轨迹变成离线数据', paragraphs: ['强 reasoning 模型生成轨迹，小模型用 SFT/偏好学习模仿，部署便宜且稳定；但学生可能学到表面格式，且受教师支持集限制。'], callout: { type: 'industry', title: '常见组合', text: '大模型在线 RL 探索 → 筛选轨迹 → 小模型 SFT 蒸馏 → 少量偏好或 RL 校准，是能力与成本之间的现实路径。' } },
        ],
        takeaway: '推理能力提升通常来自多阶段组合：格式先验、在线探索、数据回收和蒸馏缺一不可。',
      },
    ],
  },
  {
    id: 'agentic-rl', index: 6, shortTitle: 'Agentic RL', title: 'Agentic RL：在环境中学习行动',
    subtitle: '多轮轨迹、工具调用、POMDP、信用分配与训练—执行解耦', color: 'orange',
    lessons: [
      {
        id: 'agent-mdp', title: '从单轮生成到 POMDP', duration: 34, difficulty: '进阶',
        summary: '把 Agent 视为在部分可观察环境中执行多步决策的策略。',
        objectives: ['定义状态、观察、动作与奖励', '区分 LLM-RL 与 Agentic RL', '识别环境非平稳性'],
        sections: [
          { title: '单轮 RL 是退化的决策过程', paragraphs: ['普通回答可近似看成给 prompt 后生成一条序列并获得终局 reward。Agent 需要观察环境、选择工具和参数、读取结果、更新计划并决定终止；真实状态不可完全见，因而更接近 POMDP。'], formula: '\\tau=(o_0,a_0,r_0,\\ldots,o_T),\\qquad J(\\pi)=\\mathbb{E}_{\\tau\\sim p_{\\pi}(\\tau)}\\!\\left[\\sum_{t=0}^{T}\\gamma^t r_t\\right]', formulaLabel: 'Agent trajectory objective', formulaNote: '动作既可以是自然语言 token，也可以是结构化 tool call；环境 observation 会改变后续上下文。POMDP 中策略严格说依赖可见历史或 belief，而非不可见真实状态。' },
          { title: 'ReAct 是推理接口，不是训练算法', paragraphs: ['ReAct 将 Thought/Action/Observation 交错表示，帮助模型规划和利用外部信息。它可以靠 prompting、SFT 或 RL 获得；不要把 agent loop 与 Agentic RL 混为一谈。'] },
          { title: '环境是训练数据生成器', paragraphs: ['网页、代码仓库、数据库、游戏或企业系统必须可重置、可并发、可观测、结果可判定。环境版本变化会让 reward 非平稳。'], callout: { type: 'industry', title: '先造环境', text: 'Agentic RL 项目最难的资产往往不是算法，而是高保真、可扩展、无泄漏的任务环境和验证器。' } },
        ],
        takeaway: 'Agentic RL 的跃迁是从“优化一段文本”变为“优化对环境产生后果的轨迹”。',
      },
      {
        id: 'agent-credit', title: '长程信用分配与轨迹学习', duration: 40, difficulty: '硬核',
        summary: '处理稀疏终局奖励、工具错误、无效探索和多 Agent 贡献归因。',
        objectives: ['解释 trajectory-level 与 turn-level reward', '设计 reward shaping', '识别因果归因难题'],
        sections: [
          { title: '最后成功，前面每步都好吗', paragraphs: ['一次任务成功可能包含碰巧正确的错误步骤；失败也可能只由最后一个工具参数导致。把终局 reward 均匀广播到所有 token 方差很大。可用过程验证器、子目标、critic 或 hindsight 重标注改善信用分配。'] },
          { title: 'Reward shaping 要保持目标一致', paragraphs: ['给“调用工具”“写出计划”正奖励会诱导无效调用和冗长计划。更好的 shaping 与可验证进展绑定：测试通过数、检索证据覆盖、数据库约束满足、任务状态变化。'], callout: { type: 'warning', title: '代理目标陷阱', text: '任何能被计数但不等于任务成功的行为，都会在足够强的优化下被刷分。' } },
          { title: '多 Agent 的额外困难', paragraphs: ['共享终局奖励无法说明是谁贡献了成功。可用集中式 critic、反事实 baseline、角色级 reward 或轨迹分解，但通信内容也会扩大状态空间和成本。'], bullets: ['先训练单 Agent strong baseline', '记录每个工具调用的输入、输出、延迟和错误', '支持 deterministic replay 复盘轨迹', '把环境失败与策略失败分开记账'] },
        ],
        takeaway: '长程训练的关键是让 reward 对真实进展敏感，同时避免教模型表演“看起来像工作”的动作。',
      },
      {
        id: 'agent-systems', title: '异步 Rollout 与训练系统', duration: 36, difficulty: '硬核',
        summary: '理解 agent runtime、trajectory store、learner 和权重同步的系统分层。',
        objectives: ['设计训练—执行解耦架构', '理解 policy lag', '选择同步或异步训练'],
        sections: [
          { title: '为什么要解耦 Agent 与 Trainer', paragraphs: ['Agent 可能由复杂工作流、第三方工具和多种框架实现。将执行轨迹标准化成 observation/action/reward/logprob 元数据，trainer 才能独立消费。Agent Lightning 等工作把这种解耦作为核心设计。'] },
          { title: '异步提高吞吐，也引入陈旧策略', paragraphs: ['环境步骤延迟差异巨大，同步 batch 会被最慢轨迹拖住。异步 rollout 提高利用率，但轨迹可能由旧权重生成，产生 policy lag，需要版本标记、importance correction 或限制滞后窗口。'], formula: '\\operatorname{lag}(\\tau)=v_{\\mathrm{learner}}^{\\mathrm{now}}-v_{\\mathrm{actor}}(\\tau)', formulaLabel: 'Policy version lag', formulaNote: 'lag 不是只看墙钟时间；每条轨迹必须记录生成它的策略版本和 behavior log-probability。' },
          { title: '可观测性即训练能力', paragraphs: ['需要保存 prompt、工具 schema、每步 observation/action、reward 分解、token logprob、模型版本、环境版本和异常。否则无法复现 reward spike。'], callout: { type: 'industry', title: '工程现实', text: '生产 Agent 的工具鉴权、重试、超时和副作用必须进入环境契约；训练沙盒绝不能对真实系统执行不可逆动作。' } },
        ],
        takeaway: 'Agentic RL 是分布式系统问题和学习问题的交集，策略版本与轨迹可复现性是底线。',
      },
    ],
  },
  {
    id: 'evaluation', index: 7, shortTitle: '评测', title: '评测、红队与数据闭环',
    subtitle: '从 benchmark 分数到可信上线决策与持续学习', color: 'blue',
    lessons: [
      {
        id: 'eval-stack', title: '四层评测体系', duration: 28, difficulty: '入门',
        summary: '建立能力、偏好、安全和系统层的组合评测。',
        objectives: ['设计分层 eval suite', '区分静态与动态评测', '理解置信区间'],
        sections: [
          { title: '没有一个总分能代表模型', paragraphs: ['基础 benchmark 衡量知识和推理；任务集衡量业务正确性；偏好盲测衡量用户体验；安全红队检查高风险边界；系统评测关注延迟、成本和稳定性。必须分层报告。'] },
          { title: '统计可信度', paragraphs: ['win-rate 受样本和 judge 波动影响。使用成对随机化、bootstrap 置信区间、分桶结果和失败切片。对多个 checkpoint 反复挑最高分还会产生选择偏差。'], formula: '\\widehat{p}_{\\mathrm{win}}=\\frac{N_{\\mathrm{win}}+\\tfrac{1}{2}N_{\\mathrm{tie}}}{N_{\\mathrm{win}}+N_{\\mathrm{loss}}+N_{\\mathrm{tie}}}', formulaLabel: 'Pairwise win rate', formulaNote: '同时报告样本量与 bootstrap 95% 置信区间；小差异不应被包装成确定提升。' },
          { title: '污染与过拟合', paragraphs: ['公开 benchmark 可能出现在预训练或合成数据中。保留私有、时间外和变体测试集，使用 canary 检测数据泄漏。'], callout: { type: 'industry', title: '上线问题', text: '真正的问题不是“哪个 checkpoint 分最高”，而是“证据是否足以承担这次上线风险”。' } },
        ],
        takeaway: '评测是决策系统，不是排行榜；必须同时描述能力、风险、不确定性和成本。',
      },
      {
        id: 'agent-eval', title: 'Agent 评测与轨迹诊断', duration: 32, difficulty: '进阶',
        summary: '用成功率、效率、鲁棒性和副作用评价多步 Agent。',
        objectives: ['区分结果指标与过程指标', '测试环境扰动鲁棒性', '做失败 taxonomy'],
        sections: [
          { title: '成功率之外', paragraphs: ['Agent 即使成功，也可能用了 10 倍工具调用、泄露敏感信息或依赖偶然页面状态。需联合报告 task success、steps、tokens、tool errors、cost、latency 和 policy violations。'] },
          { title: '对环境扰动做压力测试', paragraphs: ['改变工具返回顺序、插入无关信息、模拟超时、重命名 UI 元素、撤销部分权限，检查策略是否真正理解任务而非记住路径。'] },
          { title: '失败分类驱动训练数据', paragraphs: ['将失败分为感知、规划、工具选择、参数、状态追踪、验证、终止和环境异常。每类采用不同修复：提示/SFT、工具 schema、记忆、奖励或环境。'], callout: { type: 'insight', title: '闭环', text: '评测价值在于产生下一轮可行动的数据配方，而不是只留下一个失败截图。' } },
        ],
        takeaway: 'Agent 的过程质量决定可扩展性；偶然成功不等于可靠策略。',
      },
      {
        id: 'safety-eval', title: '安全对齐与红队', duration: 28, difficulty: '进阶',
        summary: '把拒答边界、过度拒答、越狱与工具风险纳入训练全周期。',
        objectives: ['评估 helpfulness-safety tradeoff', '设计自适应攻击集', '区分模型与系统防线'],
        sections: [
          { title: '安全不是拒答率越高越好', paragraphs: ['需要同时测有害请求拒答率和无害请求正常回答率。过度拒答会损害可用性，尤其在医疗科普、网络安全教育等边界领域。'] },
          { title: '静态题库会被刷穿', paragraphs: ['红队应包含多语言、编码、角色扮演、长上下文、工具间接注入和自适应攻击。对 Agent，还要检查权限最小化、确认机制和审计日志。'] },
          { title: '纵深防御', paragraphs: ['模型对齐、输入/输出分类器、工具权限、沙箱、速率限制、人工审批和监控共同构成防线。不能把所有安全责任压给一次 SFT 或 RL。'], callout: { type: 'warning', title: '评测隔离', text: '红队集及规则不要进入普通训练日志或合成提示，避免模型记住测试模板。' } },
        ],
        takeaway: '安全对齐是系统工程：模型行为只是防线中的一层。',
      },
    ],
  },
  {
    id: 'industry', index: 8, shortTitle: '工业实践', title: '工业落地与研究前沿',
    subtitle: '算法选择、成本模型、训练栈与学术—工业差异', color: 'red',
    lessons: [
      {
        id: 'decision', title: '如何选择 SFT、DPO、PPO 或 GRPO', duration: 26, difficulty: '进阶',
        summary: '从任务、反馈、探索需求与预算做方法选择。',
        objectives: ['构建算法决策树', '估算端到端成本', '避免为算法而算法'],
        sections: [
          { title: '先问四个问题', paragraphs: ['问题是否可由高质量示范解决？有没有可靠偏好 pair？奖励能否自动验证？是否需要多步探索？答案比“哪个算法最新”更能决定方案。'], bullets: ['格式/风格/领域任务：SFT 起步', '开放偏好、已有 pair、预算受限：DPO 系', '主观复杂偏好且有 RM 基础设施：PPO/RLHF', '数学/代码等可验证任务：GRPO/RLVR', '工具多步与环境反馈：Agentic RL，先建环境'] },
          { title: '成本要算整条链', paragraphs: ['数据标注、候选生成、judge、训练、失败实验、评测和部署都计入总成本。便宜的训练算法可能需要更贵的数据，反之亦然。'] },
          { title: '最小可证伪实验', paragraphs: ['先用小模型/LoRA、小数据和强评测验证信号，再扩规模。每次只改变一个关键变量，并保留 SFT baseline。'], callout: { type: 'industry', title: '工程准则', text: '如果简单方法已经满足业务门槛，复杂 RL 的维护成本通常不值得。' } },
        ],
        takeaway: '方法选择是反馈可得性、探索价值与系统成本的联合优化。',
      },
      {
        id: 'research-vs-industry', title: '学术界与工业界真正差在哪', duration: 30, difficulty: '进阶',
        summary: '比较目标、数据、算力、评测、发布约束和复现标准。',
        objectives: ['读懂论文结果的适用边界', '识别生产指标', '设计可复现实验记录'],
        sections: [
          { title: '目标函数之外的差异', paragraphs: ['学术研究强调可归因的新方法、公开 benchmark 和有限预算下的可复现性；工业系统强调真实流量、隐私合规、成本延迟、持续更新与事故责任。两者互补，但证据不能直接平移。'] },
          { title: '公开结果的缺失变量', paragraphs: ['模型初始能力、私有数据、清洗规则、生成参数、judge prompt、基础设施优化和失败实验常未完整披露。复现时应把论文当作假设来源，不是部署配方。'] },
          { title: '工业护城河', paragraphs: ['稳定数据飞轮、高保真环境、可靠评测、训练吞吐、可观测性和跨团队流程通常比单一 loss 更难复制。'], callout: { type: 'insight', title: '读论文方法', text: '先找控制变量、比较预算、数据来源和评测独立性，再看 SOTA 数字。' } },
        ],
        takeaway: '学术界优化可验证的新知识，工业界优化受约束的整体系统；不能只用算法名比较。',
      },
      {
        id: 'roadmap', title: '90 天实践路线与前沿地图', duration: 24, difficulty: '入门',
        summary: '把知识转化为可运行实验、分析报告与面试作品。',
        objectives: ['规划三阶段项目', '选择训练框架', '形成可展示作品集'],
        sections: [
          { title: '第 1–30 天：建立基线', paragraphs: ['选 0.5B–3B 开源模型，构建 1k–10k 可验证指令数据；完成 LoRA SFT、评测与数据错误分析。交付物是可复现实验配置、数据卡和失败分类。'] },
          { title: '第 31–60 天：偏好与推理', paragraphs: ['同一 base 上构造偏好 pair，跑 DPO；再选数学或代码小任务跑 GRPO/RLVR。固定评测比较 SFT/DPO/GRPO 的能力、长度、KL、成本。'] },
          { title: '第 61–90 天：Agentic 闭环', paragraphs: ['构建一个可重置工具环境，例如 text-to-SQL 或代码修复。先做 ReAct/SFT baseline，再尝试轨迹奖励或 Agentic RL，完成扰动评测和成本分析。'], callout: { type: 'industry', title: '推荐栈', text: '单机教学可从 Transformers + TRL + PEFT + vLLM 开始；多机与复杂 rollout 再评估 verl、OpenRLHF、Ray 等系统。框架会变，数据契约与评测方法更耐用。' } },
        ],
        takeaway: '最有说服力的学习成果是一组可复现、有强基线、有失败分析的递进实验。',
      },
    ],
  },
]

export const concepts: Concept[] = [
  { term: 'Alignment', definition: '让模型行为更符合人类或系统定义的目标与约束。', detail: '不等于让模型永不犯错，也不只指安全。包括有用、诚实、无害、可控和任务服从等维度。', interview: 'Alignment 与 capability enhancement 有什么交集和冲突？' },
  { term: 'Behavior cloning', definition: '通过最大似然模仿专家动作的离线策略学习。', detail: 'SFT 可视作序列级行为克隆；受 covariate shift 和示范支持集限制。', interview: '为什么 SFT 在多步 Agent 上会累积误差？' },
  { term: 'Chat template', definition: '将角色消息序列映射为 token 序列的格式协议。', detail: '包含 system/user/assistant/tool 边界、特殊 token 与 generation prompt。训练推理不一致会退化。', interview: '如何验证 template 与 loss mask 正确？' },
  { term: 'KL divergence', definition: '度量两个概率分布差异的非对称量。', detail: '后训练中常约束新策略不要偏离 reference，防止能力遗忘与 reward hacking。', interview: 'PPO clip 与 reference KL 有何区别？' },
  { term: 'Reward model', definition: '把 prompt-response 映射为标量偏好分数的模型。', detail: '通常用成对偏好和 Bradley–Terry loss 训练；会被策略分布外搜索攻击。', interview: 'RM accuracy 高为何不保证 RL 后模型好？' },
  { term: 'Advantage', definition: '某动作相对当前状态基线好多少的估计。', detail: '用 baseline 降低策略梯度方差；PPO 常用 critic/GAE，GRPO 用组内 reward baseline。', interview: '为什么减 baseline 不改变期望策略梯度？' },
  { term: 'On-policy', definition: '训练数据由当前或足够接近当前的策略生成。', detail: '更新策略后数据会过时；异步系统需要处理 policy lag 和 importance sampling。', interview: '为什么在线 RL 的样本不能无限 epoch 重用？' },
  { term: 'DPO', definition: '直接从 chosen/rejected 优化策略相对 reference 的偏好间隔。', detail: '避免显式 RM 与 PPO rollout，但仍依赖偏好数据和 reference logprob。', interview: 'DPO 真的没有 reward model 吗？' },
  { term: 'RLVR', definition: '使用可程序验证的结果奖励训练语言模型。', detail: '适合数学、代码、SQL、结构化输出；验证器漏洞会直接成为策略漏洞。', interview: '如何防止模型 hack 单元测试？' },
  { term: 'GRPO', definition: '用同一 prompt 多个候选的组内相对 reward 估计优势。', detail: '省去 critic，但增加多候选 rollout，且全对/全错组缺少学习信号。', interview: 'GRPO 相对 PPO 的显存和采样成本如何变化？' },
  { term: 'Credit assignment', definition: '判断轨迹中哪些动作应为最终结果负责。', detail: '多轮 Agent 的终局 reward 稀疏，使早期工具选择的因果贡献难估计。', interview: '过程奖励如何既降方差又避免 reward shaping 偏移？' },
  { term: 'Policy lag', definition: '采样策略版本落后于当前 learner 的程度。', detail: '异步 rollout 提高吞吐，但陈旧轨迹增加 off-policy 偏差。', interview: 'Agentic RL 异步架构如何控制 policy lag？' },
  { term: 'Reward hacking', definition: '策略提高代理奖励，却没有提高真实目标。', detail: '常见为长度偏好、格式捷径、验证器漏洞和 judge 套路。', interview: '发现 reward 与人工胜率背离时怎么排查？' },
  { term: 'Process reward model', definition: '对推理中间步骤而非只对最终结果评分。', detail: '改善信用分配与搜索，但步骤标注和局部正确性的定义更困难。', interview: 'PRM 和 ORM 各自适用什么场景？' },
  { term: 'Pass@k', definition: '采样 k 个候选时至少一个通过验证的概率估计。', detail: '反映潜在能力和采样探索；产品单次回答更关心 pass@1。', interview: '为何 pass@k 提升不一定意味着用户体验提升？' },
  { term: 'Agent loop', definition: '模型决策、工具执行、观察回填与终止判断组成的迭代闭环。', detail: '最小 loop 只是骨架；生产系统还需状态、预算、权限、恢复、trace 与验证。', interview: '为什么 ReAct loop 不等于完整 Agent Harness？' },
  { term: 'Agent Harness', definition: '包围模型、负责执行与控制 Agent 生命周期的运行时系统。', detail: '覆盖 context、tools、state、permissions、retries、HITL、observability、verification 和 governance。', interview: '模型错误与 Harness 错误如何分层归因？' },
  { term: 'Context engineering', definition: '在预算与信任边界内为当前决策组装最小充分工作集。', detail: '涉及指令、状态、记忆、检索、工具 schema 的选择、压缩、排序、隔离与版本记录。', interview: '摘要、滑窗、检索和结构化 state 如何组合？' },
  { term: 'Tool contract', definition: '模型动作与真实执行之间的 typed schema、错误语义和权限契约。', detail: '可靠工具应最小、可验证、可观测，写操作还需幂等、审批和影响边界。', interview: '工具参数频繁错误时先改 schema 还是训练模型？' },
  { term: 'MCP', definition: '连接 AI Host 与外部 prompts、resources、tools 的开放协议。', detail: 'MCP 解决互操作，不替代 Host/Harness 对上下文、用户同意、权限和安全的责任。', interview: 'MCP 的 Host、Client、Server 各负责什么？' },
  { term: 'Environment', definition: 'Agent 行动并接收 observation/reward 的外部状态与执行空间。', detail: '训练环境需可重置、可并发、版本化、隔离且有可靠 verifier；真实生产系统通常不能直接作为训练沙盒。', interview: '高保真 Agentic RL 环境最难的部分是什么？' },
  { term: 'Idempotency', definition: '同一写操作重复执行仍只产生一次预期副作用。', detail: '长任务重试、网络超时和人工恢复都可能重复提交；Harness 应使用 idempotency key 与结果存储。', interview: '工具已部分成功但客户端超时时怎么恢复？' },
  { term: 'Sequence-level ratio', definition: '将整段回答的策略变化汇总为一个 importance ratio。', detail: 'GSPO 等方法用 sequence 粒度裁剪，与 outcome reward 更一致，但弱化 token 级差异。', interview: 'Token-level 与 sequence-level clipping 各有什么偏差—方差取舍？' },
  { term: 'Knowledge distillation', definition: '让学生模型匹配教师的 logits、序列或行为分布。', detail: '可分为 logit KD、sequence KD、reasoning distillation 和 on-policy distillation。', interview: '为什么 sequence KD 不能完整复制教师能力？' },
  { term: 'Serving parity', definition: '训练与最终推理引擎在 tokenizer、模板、采样和 logits 语义上的一致性。', detail: '量化、adapter merge、stop token 或 kernel 差异都可能让服务产物偏离 trainer checkpoint。', interview: '最终模型上线前应如何验证 parity？' },
]

const corePapers: Paper[] = [
  { title: 'Training language models to follow instructions with human feedback', year: '2022', stage: 'SFT → RM → PPO', why: '经典 InstructGPT 三阶段 RLHF 管线', url: 'https://arxiv.org/abs/2203.02155' },
  { title: 'Constitutional AI: Harmlessness from AI Feedback', year: '2022', stage: 'RLAIF', why: '原则驱动的批评、修订与 AI 偏好反馈', url: 'https://arxiv.org/abs/2212.08073' },
  { title: 'Direct Preference Optimization', year: '2023', stage: 'DPO', why: '从 KL 正则 RL 推导直接偏好损失', url: 'https://arxiv.org/abs/2305.18290' },
  { title: 'DeepSeekMath', year: '2024', stage: 'GRPO', why: 'GRPO 的代表性来源与数学推理训练', url: 'https://arxiv.org/abs/2402.03300' },
  { title: 'DeepSeek-R1', year: '2025', stage: 'Reasoning RL', why: '冷启动、RL、拒绝采样与蒸馏的多阶段实例', url: 'https://arxiv.org/abs/2501.12948' },
  { title: 'ReAct: Synergizing Reasoning and Acting', year: '2022', stage: 'Agent', why: '交错推理、行动与观察的经典范式', url: 'https://arxiv.org/abs/2210.03629' },
  { title: 'Agent Lightning', year: '2025', stage: 'Agentic RL', why: 'Agent 执行与 RL 训练解耦及轨迹信用分配', url: 'https://arxiv.org/abs/2508.03680' },
  { title: 'The Landscape of Agentic Reinforcement Learning for LLMs', year: '2025', stage: 'Survey', why: '从单轮 LLM-RL 到多步 POMDP 的系统综述', url: 'https://arxiv.org/abs/2509.02547' },
]

export const chapters: Chapter[] = [
  { ...coreChapters[0], index: 1, lessons: [...coreChapters[0].lessons, ...sftAdvancedLessons] },
  { ...coreChapters[1], index: 2, lessons: [...coreChapters[1].lessons, ...preferenceAdvancedLessons] },
  { ...coreChapters[2], index: 3, lessons: [...coreChapters[2].lessons, ...rlhfAdvancedLessons] },
  { ...coreChapters[3], index: 4, lessons: [...coreChapters[3].lessons, ...directPreferenceAdvancedLessons] },
  { ...coreChapters[4], index: 5, lessons: [...coreChapters[4].lessons, ...reasoningAdvancedLessons] },
  agentFoundationsChapter,
  harnessChapter,
  { ...coreChapters[5], index: 8 },
  { ...coreChapters[6], index: 9, lessons: [...coreChapters[6].lessons, ...evaluationAdvancedLessons] },
  trainingSystemsChapter,
  distillationChapter,
  { ...coreChapters[7], index: 12 },
]

export const papers: Paper[] = [...corePapers, ...additionalPapers]

export const totalLessons = chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0)
export const totalMinutes = chapters.reduce((sum, chapter) => sum + chapter.lessons.reduce((s, lesson) => s + lesson.duration, 0), 0)
