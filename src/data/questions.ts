import type { InterviewQuestion, InterviewType, QuizQuestion } from '../types'
import { additionalInterviewQuestions, additionalQuizQuestions } from './advancedQuestions'

const baseQuizQuestions: QuizQuestion[] = [
  { id:'q1', chapterId:'sft', type:'single', difficulty:'入门', question:'SFT 与预训练最核心的共同点是什么？', options:['都必须使用人工偏好对','通常都使用 next-token 交叉熵','都需要奖励模型','都属于 on-policy 学习'], answer:[1], explanation:'两者通常都优化 token-level next-token prediction；关键差别主要在数据分布与 mask。' },
  { id:'q2', chapterId:'sft', type:'multi', difficulty:'进阶', question:'哪些问题可能由训练与推理 chat template 不一致造成？', options:['模型不停止生成','角色边界混乱','工具调用格式错误','GPU 显存物理损坏'], answer:[0,1,2], explanation:'EOS、角色 token、tool token 不一致都会造成行为退化，但不会损坏硬件。' },
  { id:'q3', chapterId:'sft', type:'single', difficulty:'进阶', question:'LoRA 的核心假设是什么？', options:['权重必须量化到 4 bit','有效权重更新可以用低秩矩阵近似','只更新词嵌入层','完全不会发生灾难性遗忘'], answer:[1], explanation:'LoRA 以 BA 表示低秩权重增量；量化是 QLoRA 的额外做法。' },
  { id:'q4', chapterId:'preference', type:'single', difficulty:'入门', question:'成对偏好常比绝对评分更稳定，主要因为？', options:['不需要 prompt','降低不同标注员评分尺度不一致的影响','chosen 一定正确','可以完全消除偏差'], answer:[1], explanation:'比较任务减弱了个体评分标尺差异，但位置、长度等偏差仍存在。' },
  { id:'q5', chapterId:'preference', type:'judge', difficulty:'进阶', question:'Reward model 的绝对分值可以直接跨版本比较。', options:['正确','错误'], answer:[1], explanation:'pairwise RM 主要约束 reward 差，平移和尺度校准可能不同，不能直接跨版本比较绝对值。' },
  { id:'q6', chapterId:'preference', type:'multi', difficulty:'进阶', question:'校准 LLM-as-a-Judge 的有效做法包括？', options:['交换 A/B 顺序','对照人工金标','隐藏模型身份','只保留 judge 同意自己的样本'], answer:[0,1,2], explanation:'位置交换、盲化和人工校准能测量偏差；按 judge 自洽筛样会放大偏差。' },
  { id:'q7', chapterId:'rlhf', type:'single', difficulty:'进阶', question:'经典 PPO-RLHF 中 critic 的主要作用是？', options:['生成 chosen/rejected','估计 value 以降低策略梯度方差','计算 reference KL','替代 tokenizer'], answer:[1], explanation:'Critic 提供状态价值基线，用于优势估计。' },
  { id:'q8', chapterId:'rlhf', type:'single', difficulty:'硬核', question:'PPO clip 与 reference KL 的区别，哪项最准确？', options:['完全相同，只是名字不同','clip 约束新旧策略更新，reference KL 约束相对参考模型漂移','clip 只用于 critic','reference KL 不参与训练'], answer:[1], explanation:'两者参照的分布和作用不同：π_old 与 π_ref 不能混淆。' },
  { id:'q9', chapterId:'rlhf', type:'multi', difficulty:'硬核', question:'Reward 上升但人工胜率下降时，应优先检查？', options:['回答长度变化','reference KL','reward model 的对抗漏洞','显示器分辨率'], answer:[0,1,2], explanation:'这是 reward hacking 或分布漂移的典型信号，需要联查长度、KL、独立评测。' },
  { id:'q10', chapterId:'direct-preference', type:'single', difficulty:'硬核', question:'DPO 的训练信号直接鼓励什么？', options:['chosen 相对 reference 的 log-ratio 优于 rejected','所有回答概率都提高','reference 模型同步更新','只缩短回答'], answer:[0], explanation:'DPO 优化 chosen/rejected 相对 reference 的隐式 reward 差。' },
  { id:'q11', chapterId:'direct-preference', type:'judge', difficulty:'进阶', question:'DPO 不需要显式奖励模型，因此也不需要偏好数据。', options:['正确','错误'], answer:[1], explanation:'DPO 省掉显式 RM，但核心输入仍是 chosen/rejected 偏好数据。' },
  { id:'q12', chapterId:'direct-preference', type:'multi', difficulty:'进阶', question:'离线偏好优化的典型限制包括？', options:['受离线候选支持集约束','策略提升后旧 pair 可能变简单','无法主动探索新轨迹','一定比 PPO 更耗 rollout'], answer:[0,1,2], explanation:'离线方法通常更省 rollout，但受数据覆盖和 distribution shift 限制。' },
  { id:'q13', chapterId:'reasoning-rl', type:'single', difficulty:'进阶', question:'RLVR 最适合哪类任务？', options:['审美完全主观的诗歌','结果可由程序可靠验证的数学或代码','没有任何反馈信号的闲聊','只看回复长度的任务'], answer:[1], explanation:'RLVR 的优势来自低噪声可验证奖励。' },
  { id:'q14', chapterId:'reasoning-rl', type:'single', difficulty:'硬核', question:'GRPO 某个 prompt 的 G 个候选 reward 完全相同，会怎样？', options:['产生很强优势信号','组内归一化优势接近 0','critic 自动修复','reference 被删除'], answer:[1], explanation:'reward 减均值后均为 0，该组几乎不提供相对学习信号。' },
  { id:'q15', chapterId:'reasoning-rl', type:'multi', difficulty:'进阶', question:'判断“长 CoT 是否真的提升推理”应同时看？', options:['准确率','tokens/solution','截断与重复率','只看平均长度'], answer:[0,1,2], explanation:'长度只是行为特征，需要与正确率、效率和失败模式联读。' },
  { id:'q16', chapterId:'agentic-rl', type:'single', difficulty:'进阶', question:'Agentic RL 相比单轮 LLM-RL 的关键变化是？', options:['只增加 system prompt','策略在多步环境反馈中做决策','不用奖励','不再生成 token'], answer:[1], explanation:'Agentic RL 处理带 observation/action 的长程决策过程，常建模为 POMDP。' },
  { id:'q17', chapterId:'agentic-rl', type:'judge', difficulty:'进阶', question:'ReAct 是一种具体的强化学习优化算法。', options:['正确','错误'], answer:[1], explanation:'ReAct 是组织 reasoning/action/observation 的 agent 范式，可通过 prompting、SFT 或 RL 获得。' },
  { id:'q18', chapterId:'agentic-rl', type:'multi', difficulty:'硬核', question:'异步 Agent rollout 的主要工程权衡包括？', options:['提高环境吞吐','引入 policy lag','需要记录策略版本','自动消除 off-policy 偏差'], answer:[0,1,2], explanation:'异步减少等待但轨迹更陈旧，必须跟踪版本并控制偏差。' },
  { id:'q19', chapterId:'evaluation', type:'single', difficulty:'入门', question:'比较两个模型的 win-rate 时，哪项报告最可信？', options:['只报 52% vs 48%','同时报样本量、置信区间和分桶结果','只报最好一次','用训练 RM 当唯一 judge'], answer:[1], explanation:'点估计不体现不确定性和样本组成，分桶与 CI 是基本证据。' },
  { id:'q20', chapterId:'evaluation', type:'multi', difficulty:'进阶', question:'Agent 评测除成功率外还应包含？', options:['工具调用步数与错误','成本和延迟','策略违规/副作用','网页背景颜色'], answer:[0,1,2], explanation:'效率、可靠性和安全后果决定 Agent 是否可用。' },
  { id:'q21', chapterId:'evaluation', type:'judge', difficulty:'进阶', question:'安全模型拒答率越高，说明对齐效果一定越好。', options:['正确','错误'], answer:[1], explanation:'过度拒答会伤害无害请求的可用性，需同时衡量 safe refusal 与 benign helpfulness。' },
  { id:'q22', chapterId:'industry', type:'single', difficulty:'进阶', question:'一个格式遵循很差但有大量高质量示范的任务，首先应尝试？', options:['直接大规模 PPO','修正模板与 SFT 数据','构建多 Agent 社会','只增加推理温度'], answer:[1], explanation:'格式和行为模仿首先属于数据契约与 SFT 的能力范围。' },
  { id:'q23', chapterId:'industry', type:'single', difficulty:'进阶', question:'工业界难复制的长期优势通常不只是哪一个？', options:['单一新 loss 名称','数据飞轮与评测系统','训练可观测性','高保真任务环境'], answer:[0], explanation:'单一 loss 常可快速复现；数据、环境、评测和工程体系才形成组合壁垒。' },
  { id:'q24', chapterId:'industry', type:'multi', difficulty:'入门', question:'一个可信训练项目作品集应包含？', options:['强 baseline','固定评测与失败分析','成本/吞吐记录','只展示最终最好分数'], answer:[0,1,2], explanation:'可复现、有对照、有分析的实验比孤立最好分数更有说服力。' },
]

const baseInterviewQuestions: InterviewQuestion[] = [
  { id:'i1', category:'SFT', difficulty:'入门', question:'预训练、继续预训练和 SFT 的区别是什么？', shortAnswer:'目标都可为 next-token prediction，但数据分布、任务接口和优化目的不同。', deepAnswer:['预训练从大规模通用语料学习语言与世界知识。','继续预训练用领域或新增语料改变知识/分布。','SFT 用指令—回答示范做行为克隆，重点塑造交互与任务遵循。'], followUps:['什么时候先 CPT 再 SFT？','如何检测 CPT 后通用能力遗忘？'], tags:['目标函数','数据'] },
  { id:'i2', category:'SFT', difficulty:'进阶', question:'为什么只对 assistant token 计算 SFT loss？', shortAnswer:'用户和系统文本是条件，不是希望模型在回答阶段模仿生成的目标。', deepAnswer:['loss mask 避免模型浪费容量预测用户输入。','多轮场景要精确定位所有 assistant span。','是否训练 reasoning/tool observation 等 token 取决于部署时模型应生成什么。'], followUps:['全序列 loss 一定错误吗？','packing 时 mask 如何处理？'], tags:['mask','template'] },
  { id:'i3', category:'SFT', difficulty:'进阶', question:'LoRA 的 rank 越大越好吗？', shortAnswer:'不一定；rank 增加容量和显存，也提高过拟合风险，边际收益取决于任务与 target modules。', deepAnswer:['低秩更新假设任务适配位于低维子空间。','rank 与 alpha、学习率、数据规模耦合。','应用固定评测做 rank sweep，不按参数量猜。'], followUps:['LoRA 应插在哪些层？','QLoRA 与 LoRA 的差别？'], tags:['LoRA','PEFT'] },
  { id:'i4', category:'数据', difficulty:'进阶', question:'如何构建一套高质量 SFT 数据？', shortAnswer:'先定义能力分桶与验收规则，再做来源治理、生成、验证、去重、混合和人工抽检。', deepAnswer:['质量包括正确性、覆盖、难度、格式、许可与可追溯。','合成数据用独立 verifier/judge，并防教师风格单一。','训练验证按来源隔离，避免语义近重复泄漏。'], followUps:['数据量和质量如何 trade-off？','如何发现 benchmark contamination？'], tags:['data-centric','去重'] },
  { id:'i5', category:'偏好', difficulty:'进阶', question:'Bradley–Terry 奖励模型 loss 如何理解？', shortAnswer:'把 chosen 胜出的概率建模为两回答 reward 差的 sigmoid。', deepAnswer:['p(yw>yl|x)=σ(rw−rl)。','最大似然得到 −log σ(rw−rl)。','只识别相对差，绝对 reward 平移不可辨识。'], followUps:['如何加入 margin？','怎样测试长度偏差？'], tags:['RM','Bradley-Terry'] },
  { id:'i6', category:'偏好', difficulty:'硬核', question:'Reward model 验证准确率很高，为什么 PPO 后仍可能变差？', shortAnswer:'策略会优化并访问 RM 训练分布之外的区域，主动放大 RM 漏洞。', deepAnswer:['静态 held-out pair 与优化后的策略分布不同。','RM 可能依赖长度、格式等 spurious feature。','最终要用独立人工/judge、规则与对抗切片评估。'], followUps:['如何做 reward ensemble？','如何监控 reward hacking？'], tags:['reward hacking','OOD'] },
  { id:'i7', category:'PPO', difficulty:'硬核', question:'讲清楚 PPO 中 ratio、clip 与 advantage 的方向。', shortAnswer:'ratio 表示新旧动作概率变化；advantage 决定升降方向；clip 限制单批旧数据上的过度更新。', deepAnswer:['A>0 时提高概率，但不鼓励 ratio 超过 1+ε。','A<0 时降低概率，但不鼓励低于 1−ε。','min 构造在两个方向都取保守目标。'], followUps:['clip 是否保证 KL 上界？','clip fraction 过高意味着什么？'], tags:['PPO','策略梯度'] },
  { id:'i8', category:'PPO', difficulty:'硬核', question:'GAE 中 γ 和 λ 分别控制什么？', shortAnswer:'γ 控制未来奖励折扣；λ 控制多步 TD 混合的偏差—方差折中。', deepAnswer:['λ=0 更接近单步 TD，方差低偏差可能高。','λ→1 更接近 Monte Carlo，偏差低方差高。','LLM 终局奖励下还需正确处理 EOS/padding mask。'], followUps:['语言模型 RL 中为什么 γ 常接近 1？','截断序列 value 如何 bootstrap？'], tags:['GAE','critic'] },
  { id:'i9', category:'PPO', difficulty:'进阶', question:'为什么 RLHF 需要 reference model？', shortAnswer:'通过 KL 约束限制策略偏离初始对齐模型，抑制遗忘和奖励漏洞。', deepAnswer:['RM 只覆盖有限偏好，分布外区域不可信。','reference 提供 token-level 行为先验。','β 太大限制学习，太小可能漂移失控。'], followUps:['reference 与 old policy 是否相同？','adaptive KL coefficient 如何工作？'], tags:['KL','reference'] },
  { id:'i10', category:'DPO', difficulty:'硬核', question:'DPO 为什么可以省掉显式奖励模型？', shortAnswer:'KL 正则化 RL 的最优策略可把 reward 写成 policy/reference log-ratio，代入偏好模型后直接优化策略。', deepAnswer:['隐式 reward 为 β(logπ−logπref) 加 prompt 常数。','prompt 常数在 chosen/rejected 差中抵消。','最终得到对 log-ratio gap 的 logistic loss。'], followUps:['DPO 仍然用了什么 reward 假设？','β 如何影响 KL？'], tags:['DPO','推导'] },
  { id:'i11', category:'DPO', difficulty:'进阶', question:'DPO 与 PPO 应如何选择？', shortAnswer:'离线偏好、工程预算有限优先 DPO；需在线探索、可验证奖励或长程决策时 PPO/其他在线 RL 更有价值。', deepAnswer:['DPO 简单稳定但受数据支持集约束。','PPO 系统复杂、样本贵，但能在当前策略分布探索。','必须用同数据、同评测和总成本公平比较。'], followUps:['迭代 DPO 能否缩小差距？','什么任务不适合 DPO？'], tags:['选型','offline-vs-online'] },
  { id:'i12', category:'DPO', difficulty:'进阶', question:'DPO 为什么容易受到回答长度影响？', shortAnswer:'序列 logprob 是 token logprob 求和，长度改变数值尺度，也常与偏好数据的 chosen 标签相关。', deepAnswer:['长序列 logprob 通常更负。','chosen 若系统性更长，模型可能把长度当作捷径。','应报告长度条件胜率，并比较 length normalization/margin 方案。'], followUps:['SimPO 如何处理长度？','怎样构造长度反事实 pair？'], tags:['长度偏差','logprob'] },
  { id:'i13', category:'GRPO', difficulty:'硬核', question:'GRPO 如何在没有 critic 的情况下估计 advantage？', shortAnswer:'同一 prompt 采样多个候选，用组内 reward 的均值/标准差作为 baseline 和尺度。', deepAnswer:['A_i=(r_i−mean)/std。','相对比较降低 prompt 难度带来的尺度差。','全对或全错时组内方差低，学习信号消失。'], followUps:['省 critic 后成本去了哪里？','组大小 G 怎么选？'], tags:['GRPO','advantage'] },
  { id:'i14', category:'GRPO', difficulty:'进阶', question:'RLVR 中 reward 为 0/1 会有什么训练问题？', shortAnswer:'奖励稀疏；太难样本全错、太简单样本全对，都没有区分候选的有效信号。', deepAnswer:['用课程难度保持中等成功率。','增加采样数和温度改善探索，但成本上升。','可加格式/过程信号，但要防 shaping 改变目标。'], followUps:['如何做 dynamic sampling？','为什么 cold-start SFT 有帮助？'], tags:['RLVR','稀疏奖励'] },
  { id:'i15', category:'推理', difficulty:'进阶', question:'如何证明模型是“更会推理”而不是“输出更长”？', shortAnswer:'控制采样预算，联合比较正确率、token 效率、难度分桶、截断率与轨迹质量。', deepAnswer:['固定 max tokens 与 temperature 做公平对比。','画长度—正确率条件曲线。','用新题、反事实题和过程错误分析排除记忆与 verbosity。'], followUps:['pass@k 和 pass@1 如何解读？','什么时候 test-time compute 更划算？'], tags:['reasoning','评测'] },
  { id:'i16', category:'Agentic RL', difficulty:'进阶', question:'Agentic RL 与普通 LLM RL 的核心区别是什么？', shortAnswer:'前者优化与环境多轮交互的策略轨迹，动作产生外部观察和长期后果。', deepAnswer:['普通回答常近似单次上下文到序列的退化 MDP。','Agent 场景部分可观察、状态长、工具异构、奖励延迟。','训练单位从 response 扩展到 trajectory/transition。'], followUps:['ReAct 是否等于 Agentic RL？','状态应包含什么？'], tags:['POMDP','trajectory'] },
  { id:'i17', category:'Agentic RL', difficulty:'硬核', question:'多轮 Agent 如何做信用分配？', shortAnswer:'组合终局结果、可验证子目标、过程 reward、critic 或反事实 baseline，把信号分配到关键 turn。', deepAnswer:['均匀广播终局 reward 方差大。','shaping 必须与真实进展一致，否则诱导多调用等刷分。','轨迹分解应保留因果上下文与模型版本。'], followUps:['多 Agent 共享 reward 如何处理？','hindsight relabeling 何时可用？'], tags:['credit assignment','reward shaping'] },
  { id:'i18', category:'Agentic RL', difficulty:'硬核', question:'异步 rollout 为什么会引入 off-policy 问题？', shortAnswer:'环境执行期间 learner 已更新，完成的轨迹由陈旧策略生成。', deepAnswer:['记录 actor version 与 behavior logprob。','限制最大 policy lag 或使用 importance correction。','吞吐增益与估计偏差需通过实验权衡。'], followUps:['如何做权重同步？','rollout engine 与 training engine logprob 不一致怎么办？'], tags:['async RL','policy lag'] },
  { id:'i19', category:'评测', difficulty:'进阶', question:'LLM-as-a-Judge 有哪些系统性偏差？', shortAnswer:'位置、长度、措辞、模型身份、自偏好和 rubric 遗漏。', deepAnswer:['交换顺序并检查一致性。','与人工金标做分维度校准。','多 judge 只能降低部分随机性，不能消除共同偏差。'], followUps:['tie 应如何计分？','怎样给 win-rate 算置信区间？'], tags:['judge','偏差'] },
  { id:'i20', category:'评测', difficulty:'进阶', question:'为什么 benchmark 提升不等于可上线？', shortAnswer:'公开集可能污染且覆盖有限，未衡量真实任务、安全、延迟、成本和稳定性。', deepAnswer:['需要私有时间外任务集和线上分布切片。','加入安全红队与回归门禁。','报告系统指标和置信区间。'], followUps:['如何设计 canary？','何时需要 A/B test？'], tags:['benchmark','上线'] },
  { id:'i21', category:'系统', difficulty:'硬核', question:'RLHF 的主要系统瓶颈通常在哪里？', shortAnswer:'常在自回归 rollout、模型间调度与权重同步，而不只在反向传播。', deepAnswer:['生成受序列长度和 KV cache 限制。','actor、critic、reference、RM 的放置影响利用率。','vLLM 等推理引擎与 learner 需要可靠同步和 logprob 一致性。'], followUps:['colocate 与 disaggregate 怎么选？','如何定义有效 tokens/s？'], tags:['分布式训练','rollout'] },
  { id:'i22', category:'系统', difficulty:'进阶', question:'FSDP/ZeRO、Tensor Parallel、Pipeline Parallel 分别切什么？', shortAnswer:'FSDP/ZeRO 切模型状态，TP 切层内计算，PP 切层序列。', deepAnswer:['ZeRO 阶段逐步切 optimizer、gradient、parameter。','TP 通信频繁，适合节点内高速互联。','PP 有 bubble，microbatch 调度影响效率。'], followUps:['RLHF 多模型如何分配 GPU？','LoRA 是否还需要 ZeRO？'], tags:['并行','显存'] },
  { id:'i23', category:'工业实践', difficulty:'进阶', question:'你会如何设计一个后训练项目的 ablation？', shortAnswer:'固定 base、数据、推理和评测，只改变一个算法或关键组件，并报告成本、方差与失败切片。', deepAnswer:['保留 no-training、SFT 和简单偏好基线。','至少多 seed 或 bootstrap 不确定性。','记录训练 token、rollout token、GPU hours 和评测调用成本。'], followUps:['数据和算法无法完全解耦怎么办？','怎样避免 cherry-pick checkpoint？'], tags:['实验设计','ablation'] },
  { id:'i24', category:'工业实践', difficulty:'硬核', question:'线上模型反馈如何安全地进入训练闭环？', shortAnswer:'先做隐私与来源治理，再分层采样、脱敏、审核、反作弊、离线验证和灰度上线。', deepAnswer:['显式反馈与隐式点击都含选择偏差。','建立数据版本、删除请求与许可追踪。','新模型通过固定门禁、shadow、canary、A/B 和回滚机制。'], followUps:['隐式反馈能否直接当 reward？','如何处理用户分布变化？'], tags:['数据飞轮','MLOps'] },
]

export const comparisonRows = [
  { method:'SFT', signal:'专家示范', online:'离线', extraModels:'无', exploration:'无', strength:'格式、领域、任务接口', risk:'模仿错误；支持集受限' },
  { method:'RM + PPO', signal:'偏好 + 标量奖励', online:'在线', extraModels:'RM / Critic / Ref', exploration:'强', strength:'复杂主观偏好与在线策略优化', risk:'系统复杂；reward hacking' },
  { method:'DPO', signal:'chosen / rejected', online:'离线', extraModels:'Reference', exploration:'无', strength:'稳定、轻量的偏好对齐', risk:'分布偏移；长度偏差' },
  { method:'KTO', signal:'独立好/坏标签', online:'离线', extraModels:'Reference', exploration:'无', strength:'无法构造 pair 时的反馈学习', risk:'标签尺度与数据配比敏感' },
  { method:'RLOO / REINFORCE++', signal:'多候选标量奖励', online:'在线', extraModels:'Reference（通常）', exploration:'强', strength:'无 critic 的在线策略优化', risk:'方差、采样成本与实现配方敏感' },
  { method:'GRPO / RLVR', signal:'组采样 + 可验证奖励', online:'在线', extraModels:'Reference（通常）', exploration:'强', strength:'数学、代码、结构化推理', risk:'rollout 贵；全对/全错组无信号' },
  { method:'Agent SFT', signal:'专家/筛选后的工具轨迹', online:'离线', extraModels:'无', exploration:'无', strength:'工具协议、基本规划与恢复格式', risk:'teacher forcing；真实闭环分布偏移' },
  { method:'Harness 优化', signal:'测试、trace、环境反馈', online:'无需改权重', extraModels:'可选 Judge', exploration:'由模型决定', strength:'上下文、工具、权限、可靠性与成本', risk:'可能掩盖模型短板；系统复杂度' },
  { method:'Agentic RL', signal:'环境轨迹与延迟奖励', online:'在线/异步', extraModels:'依算法而定', exploration:'最强', strength:'工具、多轮、长程任务', risk:'信用分配；环境与安全成本' },
]

const inferQuizType = (question: QuizQuestion): NonNullable<QuizQuestion['knowledgeType']> => {
  if (question.chapterId === 'agent-harness' || question.chapterId === 'agent-foundations') return 'Agent/Harness'
  if (question.chapterId === 'evaluation') return '评测安全'
  if (question.chapterId === 'industry') return '工程实践'
  if (/公式|ratio|advantage|GAE|β|KL|loss|梯度/i.test(question.question)) return '公式推导'
  if (/区别|相比|选择|共同点/i.test(question.question)) return '算法对比'
  if (/检查|下降|崩溃|失败|原因/i.test(question.question)) return '故障诊断'
  return '概念理解'
}

const inferInterviewType = (question: InterviewQuestion): InterviewType => {
  if (question.questionType) return question.questionType
  if (/设计|如何构建|架构|流水线|系统/.test(question.question)) return '系统设计'
  if (/推导|公式|loss|GAE|ratio/.test(question.question)) return '公式推导'
  if (/崩溃|变差|排查|问题|背离/.test(question.question)) return '故障诊断'
  if (/选择|区别|相比|各自/.test(question.question)) return '算法对比'
  if (/项目|复盘|ablation|线上/.test(question.question)) return '项目复盘'
  return '概念辨析'
}

export const quizQuestions: QuizQuestion[] = [...baseQuizQuestions, ...additionalQuizQuestions]
  .map(question => ({ ...question, knowledgeType: question.knowledgeType ?? inferQuizType(question) }))

export const interviewQuestions: InterviewQuestion[] = [...baseInterviewQuestions, ...additionalInterviewQuestions]
  .map(question => ({ ...question, questionType: inferInterviewType(question) }))
