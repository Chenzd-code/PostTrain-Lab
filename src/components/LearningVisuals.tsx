import { useMemo, useState } from 'react'
import {
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDot,
  Gauge,
  Layers3,
  Network,
  Scale,
  Sparkles,
} from 'lucide-react'
import type { LearningVisual as LearningVisualKind } from '../types'

type StepConfig = {
  title: string
  description: string
  output: string
}

const stepVisuals: Partial<Record<LearningVisualKind, {
  eyebrow: string
  title: string
  steps: StepConfig[]
}>> = {
  'rlhf-loop': {
    eyebrow: 'ONLINE LOOP',
    title: '一次 RLHF 更新如何流动',
    steps: [
      { title: 'Actor 采样', description: '当前策略为一批 prompt 生成 response，并保存旧 logprob。', output: '轨迹 + old logprob' },
      { title: 'Reward 打分', description: '奖励模型、规则验证器和 reference KL 共同形成 reward。', output: 'token / sequence reward' },
      { title: 'Critic 估值', description: 'Value 与 GAE 判断每个 token 相对预期好多少。', output: 'advantage + return' },
      { title: 'PPO 更新', description: '在裁剪与 KL 约束下更新 Actor、Critic，再同步 rollout 权重。', output: '新 policy version' },
    ],
  },
  'agent-loop': {
    eyebrow: 'AGENT LOOP',
    title: '模型与环境怎样形成闭环',
    steps: [
      { title: '组装上下文', description: 'Harness 选择目标、状态、允许的工具与相关记忆。', output: '最小工作集' },
      { title: '模型决策', description: '模型输出最终答案，或提出一个结构化 tool call。', output: 'decision' },
      { title: '检查并执行', description: '运行时验证 schema、权限和预算，再执行真实工具。', output: 'observation' },
      { title: '更新或终止', description: '观察写回 state；达到成功、失败或预算条件时停止。', output: 'next state' },
    ],
  },
  'harness-stack': {
    eyebrow: 'RUNTIME STACK',
    title: 'Harness 七层责任边界',
    steps: [
      { title: 'Task & Identity', description: '绑定用户、租户、目标、预算和运行版本。', output: 'run contract' },
      { title: 'Context', description: '从指令、状态、记忆和检索中组装当前工作集。', output: 'model input' },
      { title: 'Model', description: '在允许的动作空间中提出下一步决策。', output: 'typed decision' },
      { title: 'Policy', description: '用确定性规则检查权限、审批与风险边界。', output: 'allow / deny / approve' },
      { title: 'Execution', description: '在沙箱、超时、重试和幂等控制下执行工具。', output: 'tool result' },
      { title: 'State', description: '原子持久化事件、checkpoint 和 pending action。', output: 'resumable run' },
      { title: 'Observability', description: 'Tracing、Evals 和传感器为复盘与控制提供证据。', output: 'trace + metrics' },
    ],
  },
  'eval-stack': {
    eyebrow: 'EVAL LADDER',
    title: '从单元正确到线上有效',
    steps: [
      { title: 'L0 单元与数据', description: '先验证模板、mask、verifier 和工具 schema。', output: '基础契约可信' },
      { title: 'L1 模型能力', description: '固定解码，在隔离数据上检查分桶能力与安全。', output: 'model delta' },
      { title: 'L2 系统轨迹', description: '运行完整 Agent 与工具，加入超时、空结果和权限扰动。', output: 'trace diagnostics' },
      { title: 'L3 在线结果', description: '通过 shadow、canary 和 A/B 观察真实任务与成本。', output: 'product impact' },
    ],
  },
}

export function LearningVisual({ kind }: { kind: LearningVisualKind }) {
  if (kind === 'token-mask') return <TokenMaskLab />
  if (kind === 'preference-pair') return <PreferenceLab />
  if (kind === 'ppo-clip') return <PpoClipLab />
  if (kind === 'dpo-margin') return <DpoMarginLab />
  if (kind === 'grpo-group') return <GrpoLab />
  if (kind === 'trajectory-credit') return <TrajectoryLab />
  if (kind === 'memory-budget') return <MemoryLab />
  if (kind === 'distillation') return <DistillationLab />
  const config = stepVisuals[kind]
  return config ? <StepLab config={config} /> : null
}

function LabShell({ eyebrow, title, children }: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return <section className="learning-lab" aria-label={title}>
    <header className="lab-head">
      <div><span>{eyebrow}</span><h2>{title}</h2></div>
      <Sparkles size={18} />
    </header>
    {children}
  </section>
}

function StepLab({ config }: { config: { eyebrow: string; title: string; steps: StepConfig[] } }) {
  const [active, setActive] = useState(0)
  const step = config.steps[active]
  return <LabShell eyebrow={config.eyebrow} title={config.title}>
    <div className="step-lab-track">
      {config.steps.map((item, index) => <div className="step-lab-item" key={item.title}>
        <button
          className={index === active ? 'active' : index < active ? 'past' : ''}
          onClick={() => setActive(index)}
          aria-pressed={index === active}
        >
          <span>{index < active ? <Check size={14} /> : index + 1}</span>
          <strong>{item.title}</strong>
        </button>
        {index < config.steps.length - 1 && <ChevronRight size={16} />}
      </div>)}
    </div>
    <div className="lab-result" aria-live="polite">
      <div><span>STEP {String(active + 1).padStart(2, '0')}</span><strong>{step.title}</strong></div>
      <p>{step.description}</p>
      <small><CircleDot size={14} />本步产物：{step.output}</small>
    </div>
  </LabShell>
}

function TokenMaskLab() {
  const [assistantOnly, setAssistantOnly] = useState(true)
  const tokens = [
    { text: '<system>', role: 'system' }, { text: '严谨回答', role: 'system' },
    { text: '<user>', role: 'user' }, { text: '什么是 SFT？', role: 'user' },
    { text: '<assistant>', role: 'assistant' }, { text: 'SFT', role: 'assistant' },
    { text: '是监督微调', role: 'assistant' }, { text: '</s>', role: 'assistant' },
  ]
  const supervised = tokens.filter(token => !assistantOnly || token.role === 'assistant').length
  return <LabShell eyebrow="TOKEN LAB" title="哪些 Token 真正在产生训练损失">
    <div className="lab-segmented" aria-label="Loss mask 模式">
      <button className={assistantOnly ? 'active' : ''} onClick={() => setAssistantOnly(true)} aria-pressed={assistantOnly}>只训练 Assistant</button>
      <button className={!assistantOnly ? 'active' : ''} onClick={() => setAssistantOnly(false)} aria-pressed={!assistantOnly}>训练全部 Token</button>
    </div>
    <div className="token-lane">
      {tokens.map((token, index) => {
        const active = !assistantOnly || token.role === 'assistant'
        return <div className={'token-cell role-' + token.role + (active ? ' supervised' : ' masked')} key={token.text + '-' + index}>
          <span>{token.role}</span><strong>{token.text}</strong><small>{active ? '计算 loss' : '只作条件'}</small>
        </div>
      })}
    </div>
    <div className="lab-result compact" aria-live="polite">
      <Gauge size={18} />
      <p><strong>{supervised} / {tokens.length}</strong> 个 token 参与 loss。{assistantOnly ? '用户问题仍会进入注意力，但标签被设为 -100。' : '模型也会被要求复述 system 与 user token。'}</p>
    </div>
  </LabShell>
}

function PreferenceLab() {
  const rubrics = {
    correctness: { label: '正确性', a: 96, b: 78, note: 'A 给出可验证结论；B 有一个事实错误。' },
    helpfulness: { label: '帮助性', a: 72, b: 91, note: 'B 给出更完整步骤，但事实准确性略差。' },
    safety: { label: '安全性', a: 84, b: 96, note: 'B 更清楚地说明操作边界和风险。' },
  }
  const [rubric, setRubric] = useState<keyof typeof rubrics>('correctness')
  const score = rubrics[rubric]
  const winner = score.a > score.b ? 'A' : 'B'
  return <LabShell eyebrow="PAIRWISE LAB" title="同一对回答，Rubric 改变偏好">
    <div className="lab-segmented" aria-label="偏好维度">
      {Object.entries(rubrics).map(([key, value]) => <button
        key={key}
        className={rubric === key ? 'active' : ''}
        onClick={() => setRubric(key as keyof typeof rubrics)}
        aria-pressed={rubric === key}
      >{value.label}</button>)}
    </div>
    <div className="pair-grid">
      <div className={winner === 'A' ? 'winner' : ''}>
        <span>回答 A</span><strong>{score.a}</strong>
        <p>简洁、结论明确，并给出一个可检查的例子。</p>
      </div>
      <div className="pair-versus"><Scale size={20} /><span>VS</span></div>
      <div className={winner === 'B' ? 'winner' : ''}>
        <span>回答 B</span><strong>{score.b}</strong>
        <p>解释更长、步骤更多，并额外给出风险提醒。</p>
      </div>
    </div>
    <div className="lab-result compact" aria-live="polite">
      <Check size={18} /><p>当前 chosen 是 <strong>回答 {winner}</strong>。{score.note}</p>
    </div>
  </LabShell>
}

function PpoClipLab() {
  const [ratio, setRatio] = useState(1.25)
  const [advantage, setAdvantage] = useState<1 | -1>(1)
  const epsilon = 0.2
  const clippedRatio = Math.max(1 - epsilon, Math.min(1 + epsilon, ratio))
  const raw = ratio * advantage
  const clipped = clippedRatio * advantage
  const objective = Math.min(raw, clipped)
  const clippedNow = Math.abs(raw - objective) > 0.0001
  return <LabShell eyebrow="PPO LAB" title="拖动概率比，观察 Clip 何时介入">
    <div className="lab-control-grid">
      <label>
        <span>概率比 ρ <strong>{ratio.toFixed(2)}</strong></span>
        <input type="range" min="0.5" max="1.5" step="0.01" value={ratio} onChange={event => setRatio(Number(event.target.value))} />
      </label>
      <div>
        <span>Advantage 方向</span>
        <div className="lab-segmented">
          <button className={advantage === 1 ? 'active' : ''} onClick={() => setAdvantage(1)} aria-pressed={advantage === 1}>A = +1</button>
          <button className={advantage === -1 ? 'active' : ''} onClick={() => setAdvantage(-1)} aria-pressed={advantage === -1}>A = -1</button>
        </div>
      </div>
    </div>
    <div className="ratio-axis" aria-label={'概率比 ' + ratio.toFixed(2) + '，裁剪区间 0.8 到 1.2'}>
      <div className="safe-zone" />
      <span className="ratio-marker" style={{ left: ((ratio - 0.5) * 100) + '%' }}><i />ρ={ratio.toFixed(2)}</span>
      <small className="bound lower">0.8</small><small className="bound upper">1.2</small>
    </div>
    <div className="lab-metrics">
      <div><span>未裁剪目标</span><strong>{raw.toFixed(2)}</strong></div>
      <div><span>保守目标</span><strong>{objective.toFixed(2)}</strong></div>
      <div><span>Clip 状态</span><strong>{clippedNow ? '已介入' : '未介入'}</strong></div>
    </div>
    <div className="lab-result compact" aria-live="polite"><Gauge size={18} /><p>{advantage > 0 ? '好动作希望提高概率，但超过 1.2 后不再获得额外收益。' : '坏动作希望降低概率，但低于 0.8 后也会被限制，避免一步改得过猛。'}</p></div>
  </LabShell>
}

function DpoMarginLab() {
  const [policyMargin, setPolicyMargin] = useState(1.2)
  const [beta, setBeta] = useState(0.2)
  const referenceMargin = 0.4
  const implicit = beta * (policyMargin - referenceMargin)
  const probability = 1 / (1 + Math.exp(-implicit))
  return <LabShell eyebrow="DPO LAB" title="偏好间隔必须相对 Reference 扩大">
    <div className="lab-control-grid">
      <label><span>Policy 的 chosen − rejected <strong>{policyMargin.toFixed(1)}</strong></span><input type="range" min="-1" max="4" step="0.1" value={policyMargin} onChange={event => setPolicyMargin(Number(event.target.value))} /></label>
      <label><span>β <strong>{beta.toFixed(2)}</strong></span><input type="range" min="0.05" max="1" step="0.05" value={beta} onChange={event => setBeta(Number(event.target.value))} /></label>
    </div>
    <div className="margin-compare">
      <div><span>Reference 间隔</span><strong>{referenceMargin.toFixed(1)}</strong><i style={{ width: (referenceMargin / 4 * 100) + '%' }} /></div>
      <div><span>Policy 间隔</span><strong>{policyMargin.toFixed(1)}</strong><i className={policyMargin >= referenceMargin ? 'positive' : 'negative'} style={{ width: (Math.max(0, policyMargin) / 4 * 100) + '%' }} /></div>
    </div>
    <div className="lab-result" aria-live="polite">
      <div><span>隐式偏好 Logit</span><strong>{implicit.toFixed(2)}</strong></div>
      <p>模型给 chosen 的隐式偏好概率约为 <strong>{(probability * 100).toFixed(1)}%</strong>。β 越大，同样的相对间隔会产生更强的分类信号。</p>
    </div>
  </LabShell>
}

function GrpoLab() {
  const rewards = [1, 0.8, 0.4, 0]
  const mean = rewards.reduce((sum, value) => sum + value, 0) / rewards.length
  const variance = rewards.reduce((sum, value) => sum + (value - mean) ** 2, 0) / rewards.length
  const std = Math.sqrt(variance) || 1
  const [selected, setSelected] = useState(0)
  const advantage = (rewards[selected] - mean) / std
  return <LabShell eyebrow="GRPO LAB" title="同一 Prompt 的候选如何形成相对优势">
    <div className="reward-bars">
      {rewards.map((reward, index) => {
        const itemAdvantage = (reward - mean) / std
        return <button className={selected === index ? 'active' : ''} key={index} onClick={() => setSelected(index)} aria-pressed={selected === index}>
          <span>候选 {index + 1}</span>
          <div><i style={{ height: Math.max(8, reward * 100) + '%' }} /></div>
          <strong>R={reward.toFixed(1)}</strong>
          <small className={itemAdvantage >= 0 ? 'positive' : 'negative'}>A={itemAdvantage.toFixed(2)}</small>
        </button>
      })}
    </div>
    <div className="lab-result" aria-live="polite">
      <div><span>组均值 / 标准差</span><strong>{mean.toFixed(2)} / {std.toFixed(2)}</strong></div>
      <p>候选 {selected + 1} 的标准化优势是 <strong>{advantage.toFixed(2)}</strong>，因此会被{advantage >= 0 ? '鼓励' : '抑制'}。如果整组奖励都相同，组内就没有方向信号。</p>
    </div>
  </LabShell>
}

function TrajectoryLab() {
  const [mode, setMode] = useState<'terminal' | 'shaped'>('terminal')
  const [gamma, setGamma] = useState(0.9)
  const events = ['读取任务', '搜索资料', '调用工具', '提交结果']
  const rewards = mode === 'terminal' ? [0, 0, 0, 1] : [0.1, 0.15, 0.25, 0.5]
  const returns = useMemo(() => {
    const values = Array(rewards.length).fill(0)
    let running = 0
    for (let index = rewards.length - 1; index >= 0; index -= 1) {
      running = rewards[index] + gamma * running
      values[index] = running
    }
    return values
  }, [mode, gamma])
  return <LabShell eyebrow="CREDIT LAB" title="终局奖励怎样传回更早的动作">
    <div className="lab-control-grid">
      <div><span>奖励模式</span><div className="lab-segmented"><button className={mode === 'terminal' ? 'active' : ''} onClick={() => setMode('terminal')} aria-pressed={mode === 'terminal'}>只看最终成功</button><button className={mode === 'shaped' ? 'active' : ''} onClick={() => setMode('shaped')} aria-pressed={mode === 'shaped'}>里程碑奖励</button></div></div>
      <label><span>折扣 γ <strong>{gamma.toFixed(2)}</strong></span><input type="range" min="0.5" max="1" step="0.05" value={gamma} onChange={event => setGamma(Number(event.target.value))} /></label>
    </div>
    <div className="trajectory-lane">
      {events.map((event, index) => <div key={event}>
        <span>{index + 1}</span><strong>{event}</strong>
        <small>即时 R {rewards[index].toFixed(2)}</small>
        <b>Return {returns[index].toFixed(2)}</b>
        {index < events.length - 1 && <ChevronRight size={17} />}
      </div>)}
    </div>
    <div className="lab-result compact" aria-live="polite"><Network size={18} /><p>{mode === 'terminal' ? '早期动作只能通过折扣后的终局成功获得信号，因果归因较粗。' : '过程奖励更密，但每个里程碑都可能改变策略目标，必须验证它与最终成功一致。'}</p></div>
  </LabShell>
}

function MemoryLab() {
  const [sequence, setSequence] = useState(2048)
  const [batch, setBatch] = useState(4)
  const weights = 18
  const gradients = 18
  const optimizer = 36
  const activations = Math.max(4, sequence / 2048 * batch / 4 * 16)
  const total = weights + gradients + optimizer + activations
  const parts = [
    { label: '权重', value: weights },
    { label: '梯度', value: gradients },
    { label: '优化器', value: optimizer },
    { label: '激活', value: activations },
  ]
  return <LabShell eyebrow="MEMORY LAB" title="序列与 Batch 怎样推高显存">
    <div className="lab-control-grid">
      <label><span>Sequence length <strong>{sequence}</strong></span><input type="range" min="512" max="8192" step="512" value={sequence} onChange={event => setSequence(Number(event.target.value))} /></label>
      <label><span>Micro batch <strong>{batch}</strong></span><input type="range" min="1" max="16" step="1" value={batch} onChange={event => setBatch(Number(event.target.value))} /></label>
    </div>
    <div className="memory-stack" aria-label={'估算总显存 ' + total.toFixed(1) + ' GB'}>
      {parts.map((part, index) => <i key={part.label} className={'part-' + (index + 1)} style={{ width: (part.value / total * 100) + '%' }}><span>{part.label}<b>{part.value.toFixed(1)}G</b></span></i>)}
    </div>
    <div className="lab-result compact" aria-live="polite"><Layers3 size={18} /><p>粗略总量 <strong>{total.toFixed(1)} GB</strong>。这里权重、梯度和优化器固定，激活随序列和 micro batch 增长；真实值还受层数、attention 与 checkpointing 影响。</p></div>
  </LabShell>
}

function DistillationLab() {
  const [temperature, setTemperature] = useState(1)
  const labels = ['正确', '近义', '相关', '错误']
  const teacherLogits = [5, 2.6, 1.2, -0.4]
  const studentLogits = [3.5, 2.2, 1.6, 0.2]
  const softmax = (logits: number[]) => {
    const values = logits.map(value => Math.exp(value / temperature))
    const total = values.reduce((sum, value) => sum + value, 0)
    return values.map(value => value / total)
  }
  const teacher = softmax(teacherLogits)
  const student = softmax(studentLogits)
  return <LabShell eyebrow="DISTILLATION LAB" title="温度如何暴露教师的暗知识">
    <label className="lab-range"><span>Temperature <strong>{temperature.toFixed(1)}</strong></span><input type="range" min="0.5" max="5" step="0.1" value={temperature} onChange={event => setTemperature(Number(event.target.value))} /></label>
    <div className="distribution-chart">
      {labels.map((label, index) => <div key={label}>
        <span>{label}</span>
        <div className="distribution-bars">
          <i className="teacher" style={{ width: (teacher[index] * 100) + '%' }}><b>{(teacher[index] * 100).toFixed(1)}%</b></i>
          <i className="student" style={{ width: (student[index] * 100) + '%' }}><b>{(student[index] * 100).toFixed(1)}%</b></i>
        </div>
      </div>)}
    </div>
    <div className="chart-legend"><span><i className="teacher" />Teacher</span><span><i className="student" />Student</span></div>
    <div className="lab-result compact" aria-live="polite"><BrainCircuit size={18} /><p>{temperature < 1 ? '低温度让最大 logit 几乎成为 one-hot，次优关系被压扁。' : temperature > 2 ? '高温度让分布更平，学生能看到教师对近义和相关 token 的相对判断。' : '中等温度在主答案与次优关系之间保留了可学习差异。'}</p></div>
  </LabShell>
}
