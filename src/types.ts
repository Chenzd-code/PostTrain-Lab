export type Difficulty = '入门' | '进阶' | '硬核'

export interface Concept {
  term: string
  definition: string
  detail: string
  interview: string
}

export interface LessonSection {
  title: string
  paragraphs: string[]
  bullets?: string[]
  formula?: string
  formulaLabel?: string
  formulaNote?: string
  code?: string
  callout?: {
    type: 'insight' | 'warning' | 'industry'
    title: string
    text: string
  }
}

export type LearningVisual =
  | 'token-mask'
  | 'preference-pair'
  | 'rlhf-loop'
  | 'ppo-clip'
  | 'dpo-margin'
  | 'grpo-group'
  | 'agent-loop'
  | 'model-protocol'
  | 'intent-gate'
  | 'harness-stack'
  | 'harness-map'
  | 'context-recycling'
  | 'tool-mcp-skill'
  | 'trajectory-credit'
  | 'eval-stack'
  | 'memory-budget'
  | 'distillation'

export interface LearningStep {
  title: string
  detail: string
}

export interface CodeWalkthrough {
  title: string
  language: 'python' | 'typescript' | 'json' | 'yaml' | 'bash'
  code: string
  notes: string[]
}

export interface LessonGuide {
  plain: string
  analogy: string
  why: string
  steps: LearningStep[]
  code: CodeWalkthrough
  visual?: LearningVisual
}

export interface ChapterGuide {
  plainDefinition: string
  roleInPipeline: string
  learningArc: string[]
  prerequisites?: string[]
  readingAdvice?: string
}

export interface Lesson {
  id: string
  title: string
  duration: number
  difficulty: Difficulty
  summary: string
  objectives: string[]
  sections: LessonSection[]
  takeaway: string
  guide?: LessonGuide
}

export interface Chapter {
  id: string
  index: number
  shortTitle: string
  title: string
  subtitle: string
  color: 'green' | 'orange' | 'blue' | 'red'
  lessons: Lesson[]
  guide?: ChapterGuide
}

export interface QuizQuestion {
  id: string
  chapterId: string
  type: 'single' | 'multi' | 'judge'
  question: string
  options: string[]
  answer: number[]
  explanation: string
  difficulty: Difficulty
  knowledgeType?: '概念理解' | '公式推导' | '算法对比' | '工程实践' | '故障诊断' | 'Agent/Harness' | '系统设计' | '评测安全'
}

export type InterviewType = '概念辨析' | '公式推导' | '算法对比' | '故障诊断' | '系统设计' | '项目复盘' | '代码实现' | '评测安全' | '开放讨论'

export interface InterviewQuestion {
  id: string
  category: string
  difficulty: Difficulty
  question: string
  shortAnswer: string
  deepAnswer: string[]
  followUps: string[]
  tags: string[]
  questionType?: InterviewType
}

export interface Paper {
  title: string
  year: string
  stage: string
  why: string
  url: string
}
