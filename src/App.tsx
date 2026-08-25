import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import {
  ArrowLeft, ArrowRight, BookOpen, Bot, BrainCircuit, Check, CheckCircle2,
  ChevronDown, ChevronRight, CircleHelp, Clock3, Code2, ExternalLink, FileText,
  Flame, Gauge, GraduationCap, Layers3, Library, Menu, MessageSquareText, Network,
  PanelLeftClose, PanelLeftOpen, Play, RefreshCw, Search, Send, Settings2, Shuffle,
  Sparkles, Target, Trophy, X, XCircle, Zap, type LucideIcon,
} from 'lucide-react'
import { chapters, concepts, papers, totalLessons, totalMinutes } from './data/course'
import { comparisonRows, interviewQuestions, quizQuestions } from './data/questions'
import type { Chapter, InterviewQuestion, Lesson, QuizQuestion } from './types'

type View = 'dashboard' | 'curriculum' | 'concepts' | 'compare' | 'practice' | 'interview' | 'tutor' | 'resources'
type ChatMessage = { role: 'user' | 'assistant'; content: string }

const navItems: { id: View; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: '学习总览', icon: Gauge },
  { id: 'curriculum', label: '课程章节', icon: BookOpen },
  { id: 'concepts', label: '知识卡片', icon: Layers3 },
  { id: 'compare', label: '算法对比', icon: Network },
  { id: 'practice', label: '章节测验', icon: CircleHelp },
  { id: 'interview', label: '面试题库', icon: GraduationCap },
  { id: 'tutor', label: 'AI 学习导师', icon: Bot },
  { id: 'resources', label: '论文书架', icon: Library },
]

function usePersistentSet(key: string) {
  const [values, setValues] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]') as string[]) }
    catch { return new Set() }
  })
  const toggle = (value: string, force?: boolean) => setValues(prev => {
    const next = new Set(prev)
    const shouldAdd = force ?? !next.has(value)
    if (shouldAdd) next.add(value); else next.delete(value)
    localStorage.setItem(key, JSON.stringify([...next]))
    return next
  })
  return [values, toggle] as const
}

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChapterId, setSelectedChapterId] = useState('sft')
  const [selectedLessonId, setSelectedLessonId] = useState('sft-objective')
  const [completed, toggleCompleted] = usePersistentSet('posttrain-completed-lessons')
  const [savedInterviews, toggleSavedInterview] = usePersistentSet('posttrain-saved-interviews')

  const navigate = (next: View) => {
    setView(next)
    setMobileNavOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openLesson = (chapterId: string, lessonId: string) => {
    setSelectedChapterId(chapterId)
    setSelectedLessonId(lessonId)
    navigate('curriculum')
  }

  const progress = Math.round((completed.size / totalLessons) * 100)
  const allLessons = chapters.flatMap(chapter => chapter.lessons.map(lesson => ({ chapter, lesson })))
  const currentIndex = Math.max(0, allLessons.findIndex(item => item.lesson.id === selectedLessonId))
  const nextUnfinished = allLessons.find(item => !completed.has(item.lesson.id)) ?? allLessons[allLessons.length - 1]

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const lessons = allLessons.filter(({ lesson, chapter }) =>
      `${lesson.title} ${lesson.summary} ${chapter.title}`.toLowerCase().includes(q)
    ).slice(0, 6).map(({ lesson, chapter }) => ({ type: '课程', title: lesson.title, sub: chapter.shortTitle, action: () => openLesson(chapter.id, lesson.id) }))
    const terms = concepts.filter(c => `${c.term} ${c.definition}`.toLowerCase().includes(q)).slice(0, 4)
      .map(c => ({ type: '术语', title: c.term, sub: c.definition, action: () => navigate('concepts') }))
    const questions = interviewQuestions.filter(item => `${item.question} ${item.tags.join(' ')}`.toLowerCase().includes(q)).slice(0, 4)
      .map(item => ({ type: '面试', title: item.question, sub: item.category, action: () => navigate('interview') }))
    return [...lessons, ...terms, ...questions]
  }, [searchQuery, allLessons])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true) }
      if (event.key === 'Escape') { setSearchOpen(false); setMobileNavOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sidebar" aria-label="主导航">
        <div className="brand">
          <div className="brand-mark"><BrainCircuit size={20} /></div>
          {sidebarOpen && <div><strong>PostTrain Lab</strong><span>大模型后训练学习台</span></div>}
        </div>
        <nav className="nav-list">
          {navItems.map(item => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => navigate(item.id)} aria-label={item.label} title={!sidebarOpen ? item.label : undefined}>
            <item.icon size={18} />{sidebarOpen && <span>{item.label}</span>}
          </button>)}
        </nav>
        {sidebarOpen && <div className="sidebar-progress">
          <div className="progress-label"><span>整体进度</span><strong>{progress}%</strong></div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <p>{completed.size} / {totalLessons} 节已完成</p>
        </div>}
        <button className="collapse-button icon-button" onClick={() => setSidebarOpen(v => !v)} aria-label={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}>
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </aside>

      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setMobileNavOpen(true)} aria-label="打开菜单"><Menu size={20} /></button>
        <div className="breadcrumb"><span>POST-TRAINING</span><ChevronRight size={14} /><strong>{navItems.find(i => i.id === view)?.label}</strong></div>
        <button className="search-trigger" onClick={() => setSearchOpen(true)}><Search size={17} /><span>搜索课程、术语与题目</span><kbd>Ctrl K</kbd></button>
        <div className="top-progress"><Flame size={17} /><span>连续学习</span><strong>{completed.size > 0 ? '1 天' : '0 天'}</strong></div>
      </header>

      <main className="main-content">
        {view === 'dashboard' && <Dashboard progress={progress} completed={completed} nextItem={nextUnfinished} openLesson={openLesson} navigate={navigate} />}
        {view === 'curriculum' && <Curriculum selectedChapterId={selectedChapterId} selectedLessonId={selectedLessonId} setChapter={setSelectedChapterId} setLesson={setSelectedLessonId} completed={completed} toggleCompleted={toggleCompleted} currentIndex={currentIndex} openLesson={openLesson} />}
        {view === 'concepts' && <Concepts />}
        {view === 'compare' && <Compare />}
        {view === 'practice' && <Practice />}
        {view === 'interview' && <Interview saved={savedInterviews} toggleSaved={toggleSavedInterview} />}
        {view === 'tutor' && <Tutor />}
        {view === 'resources' && <Resources />}
      </main>

      {mobileNavOpen && <div className="mobile-drawer-backdrop" onMouseDown={() => setMobileNavOpen(false)}>
        <div className="mobile-drawer" onMouseDown={e => e.stopPropagation()}>
          <div className="drawer-head"><div className="brand"><div className="brand-mark"><BrainCircuit size={20} /></div><div><strong>PostTrain Lab</strong><span>学习导航</span></div></div><button className="icon-button" onClick={() => setMobileNavOpen(false)} aria-label="关闭菜单"><X size={20}/></button></div>
          <nav className="nav-list">{navItems.map(item => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => navigate(item.id)}><item.icon size={18}/><span>{item.label}</span></button>)}</nav>
        </div>
      </div>}

      {searchOpen && <div className="modal-backdrop" onMouseDown={() => setSearchOpen(false)}>
        <div className="search-modal" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="全局搜索">
          <div className="search-input-row"><Search size={19}/><input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索 DPO、KL、Agentic RL…"/><button className="icon-button" onClick={() => setSearchOpen(false)} aria-label="关闭"><X size={18}/></button></div>
          <div className="search-results">
            {!searchQuery && <div className="search-empty"><Sparkles size={22}/><p>试试搜索 “GRPO” 或 “reward hacking”</p></div>}
            {searchQuery && searchResults.length === 0 && <div className="search-empty"><Search size={22}/><p>没有找到相关内容</p></div>}
            {searchResults.map((result, idx) => <button key={`${result.title}-${idx}`} onClick={() => { result.action(); setSearchOpen(false); setSearchQuery('') }}><span className="result-type">{result.type}</span><span><strong>{result.title}</strong><small>{result.sub}</small></span><ArrowRight size={16}/></button>)}
          </div>
        </div>
      </div>}
    </div>
  )
}

function PageHeading({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>
}

function Dashboard({ progress, completed, nextItem, openLesson, navigate }: {
  progress: number; completed: Set<string>; nextItem: { chapter: Chapter; lesson: Lesson };
  openLesson: (chapterId:string, lessonId:string) => void; navigate: (view:View)=>void
}) {
  const completedMinutes = chapters.reduce((sum, c) => sum + c.lessons.filter(l => completed.has(l.id)).reduce((s,l) => s+l.duration,0),0)
  return <div className="page dashboard-page">
    <PageHeading eyebrow="LEARNING CONSOLE" title="从示范学习，到环境中的决策" description="一条覆盖 SFT、偏好对齐、推理强化学习与 Agentic RL 的完整后训练路线。" />
    <section className="dashboard-summary">
      <div className="progress-orbit" style={{ '--progress': `${progress * 3.6}deg` } as CSSProperties}><div><strong>{progress}%</strong><span>课程完成</span></div></div>
      <div className="continue-block"><span className="section-kicker">下一步</span><div className="chapter-chip">CH.{String(nextItem.chapter.index).padStart(2,'0')} · {nextItem.chapter.shortTitle}</div><h2>{nextItem.lesson.title}</h2><p>{nextItem.lesson.summary}</p><div className="meta-row"><span><Clock3 size={15}/>{nextItem.lesson.duration} 分钟</span><span><Target size={15}/>{nextItem.lesson.difficulty}</span></div><button className="primary-button" onClick={() => openLesson(nextItem.chapter.id,nextItem.lesson.id)}><Play size={17} fill="currentColor"/>继续学习</button></div>
      <div className="stat-stack"><div><span>课程章节</span><strong>{String(chapters.length).padStart(2,'0')}</strong><small>从 SFT 到生产闭环</small></div><div><span>预计总时长</span><strong>{Math.round(totalMinutes/60)}h</strong><small>{totalLessons} 节深度课程</small></div><div><span>面试题库</span><strong>{interviewQuestions.length}</strong><small>含回答框架与追问</small></div></div>
    </section>

    <section className="section-block"><div className="section-title-row"><div><span className="section-kicker">CURRICULUM MAP</span><h2>后训练能力栈</h2></div><button className="text-button" onClick={() => navigate('curriculum')}>查看全部课程 <ArrowRight size={16}/></button></div>
      <div className="roadmap">
        {chapters.map(chapter => { const count = chapter.lessons.filter(l => completed.has(l.id)).length; const done = count === chapter.lessons.length; return <button key={chapter.id} className={`roadmap-node color-${chapter.color} ${done?'done':''}`} onClick={() => openLesson(chapter.id,chapter.lessons[0].id)}><span className="node-index">{String(chapter.index).padStart(2,'0')}</span><div><strong>{chapter.shortTitle}</strong><small>{chapter.title.replace(`${chapter.shortTitle}：`,'')}</small></div><span className="node-progress">{done ? <Check size={14}/> : `${count}/${chapter.lessons.length}`}</span></button> })}
      </div>
    </section>

    <section className="dashboard-grid section-block">
      <div className="focus-panel"><div className="section-title-row"><div><span className="section-kicker">CORE DISTINCTION</span><h2>一张图抓住阶段差异</h2></div><Network size={20}/></div><div className="mini-flow"><div><span>示范</span><strong>SFT</strong><small>模仿正确行为</small></div><ArrowRight/><div><span>偏好</span><strong>DPO / PPO</strong><small>区分回答优劣</small></div><ArrowRight/><div><span>验证</span><strong>GRPO</strong><small>探索可验证策略</small></div><ArrowRight/><div><span>环境</span><strong>Agentic RL</strong><small>优化多步轨迹</small></div></div><button className="secondary-button" onClick={() => navigate('compare')}>打开算法决策台</button></div>
      <div className="quick-panel"><span className="section-kicker">DAILY DRILL</span><h2>今日 5 题</h2><p>混合概念辨析、公式直觉和工程诊断。</p><div className="quiz-preview"><div><strong>5</strong><span>随机题</span></div><div><strong>≈8</strong><span>分钟</span></div></div><button className="primary-button dark" onClick={() => navigate('practice')}><Shuffle size={17}/>开始抽题</button></div>
    </section>
  </div>
}

function Curriculum({ selectedChapterId, selectedLessonId, setChapter, setLesson, completed, toggleCompleted, currentIndex, openLesson }: {
  selectedChapterId:string; selectedLessonId:string; setChapter:(id:string)=>void; setLesson:(id:string)=>void;
  completed:Set<string>; toggleCompleted:(id:string, force?:boolean)=>void; currentIndex:number; openLesson:(chapterId:string, lessonId:string)=>void
}) {
  const chapter = chapters.find(c => c.id === selectedChapterId) ?? chapters[0]
  const lesson = chapter.lessons.find(l => l.id === selectedLessonId) ?? chapter.lessons[0]
  const all = chapters.flatMap(c => c.lessons.map(l => ({chapter:c, lesson:l})))
  const previous = all[currentIndex - 1]
  const next = all[currentIndex + 1]
  const [outlineOpen, setOutlineOpen] = useState(true)

  useEffect(() => { if (!chapter.lessons.some(l => l.id === selectedLessonId)) setLesson(chapter.lessons[0].id) }, [selectedChapterId])

  return <div className="course-layout">
    <aside className={`course-outline ${outlineOpen?'':'closed'}`}>
      <div className="outline-head"><span>课程目录</span><button className="icon-button" onClick={() => setOutlineOpen(v=>!v)} aria-label="收起课程目录">{outlineOpen?<PanelLeftClose size={17}/>:<PanelLeftOpen size={17}/>}</button></div>
      {outlineOpen && <div className="outline-scroll">{chapters.map(c => <div className="outline-chapter" key={c.id}><button className={`outline-chapter-title ${c.id===chapter.id?'active':''}`} onClick={() => setChapter(c.id)}><span>{String(c.index).padStart(2,'0')}</span><strong>{c.shortTitle}</strong><ChevronDown size={15}/></button>{c.id===chapter.id && <div className="outline-lessons">{c.lessons.map((l,i)=><button key={l.id} className={l.id===lesson.id?'active':''} onClick={()=>setLesson(l.id)}><span className={`lesson-dot ${completed.has(l.id)?'done':''}`}>{completed.has(l.id)?<Check size={11}/>:i+1}</span><span>{l.title}<small>{l.duration} 分钟</small></span></button>)}</div>}</div>)}</div>}
    </aside>
    <article className="lesson-page">
      <div className="lesson-topline"><span>第 {chapter.index} 章 · {chapter.shortTitle}</span><span>{currentIndex+1} / {totalLessons}</span></div>
      <h1>{lesson.title}</h1><p className="lesson-lead">{lesson.summary}</p>
      <div className="lesson-meta"><span className={`difficulty ${lesson.difficulty}`}>{lesson.difficulty}</span><span><Clock3 size={15}/>{lesson.duration} 分钟</span><span><BookOpen size={15}/>{lesson.sections.length} 个知识单元</span></div>
      <div className="objective-box"><div className="objective-icon"><Target size={19}/></div><div><strong>完成本节后，你应该能够</strong><ul>{lesson.objectives.map(item=><li key={item}>{item}</li>)}</ul></div></div>
      {lesson.sections.map((section,idx)=><section className="lesson-section" key={section.title}><span className="section-number">{String(idx+1).padStart(2,'0')}</span><div className="section-copy"><h2>{section.title}</h2>{section.paragraphs.map((p,i)=><p key={i}>{p}</p>)}{section.bullets && <ul className="knowledge-list">{section.bullets.map(b=><li key={b}><CheckCircle2 size={16}/><span>{b}</span></li>)}</ul>}{section.formula && <FormulaBlock expression={section.formula} label={section.formulaLabel} note={section.formulaNote}/>} {section.code && <pre className="code-box"><div><Code2 size={15}/>实现示意</div><code>{section.code}</code></pre>}{section.callout && <div className={`callout ${section.callout.type}`}><div>{section.callout.type==='warning'?<Zap size={17}/>:section.callout.type==='industry'?<Gauge size={17}/>:<Sparkles size={17}/>}<strong>{section.callout.title}</strong></div><p>{section.callout.text}</p></div>}</div></section>)}
      <div className="takeaway"><span>ONE-LINE TAKEAWAY</span><strong>{lesson.takeaway}</strong></div>
      <div className="lesson-complete"><div>{completed.has(lesson.id)?<CheckCircle2 size={22}/>:<CircleHelp size={22}/>}<span><strong>{completed.has(lesson.id)?'本节已完成':'读完并理解了吗？'}</strong><small>进度会保存在当前浏览器</small></span></div><button className={completed.has(lesson.id)?'secondary-button':'primary-button'} onClick={()=>toggleCompleted(lesson.id)}>{completed.has(lesson.id)?<><RefreshCw size={16}/>标记为未完成</>:<><Check size={17}/>完成本节</>}</button></div>
      <div className="lesson-navigation"><button disabled={!previous} onClick={()=>previous&&openLesson(previous.chapter.id,previous.lesson.id)}><ArrowLeft size={17}/><span><small>上一节</small><strong>{previous?.lesson.title ?? '已是第一节'}</strong></span></button><button disabled={!next} onClick={()=>next&&openLesson(next.chapter.id,next.lesson.id)}><span><small>下一节</small><strong>{next?.lesson.title ?? '已完成全部课程'}</strong></span><ArrowRight size={17}/></button></div>
    </article>
  </div>
}

function Concepts() {
  const [query,setQuery]=useState('')
  const [active,setActive]=useState<string|null>(null)
  const filtered=concepts.filter(c=>`${c.term}${c.definition}${c.detail}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="page"><PageHeading eyebrow="KNOWLEDGE CARDS" title="核心术语，不背黑话" description="先用一句话建立直觉，再展开边界、细节与面试追问。" actions={<div className="inline-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索术语"/></div>}/><div className="concept-grid">{filtered.map((concept,idx)=><button className={`concept-card ${active===concept.term?'expanded':''}`} key={concept.term} onClick={()=>setActive(active===concept.term?null:concept.term)}><div className="concept-index">{String(idx+1).padStart(2,'0')}</div><h2>{concept.term}</h2><p>{concept.definition}</p><div className="concept-detail"><div><span>进一步理解</span><p>{concept.detail}</p></div><div><span>面试追问</span><p>{concept.interview}</p></div></div><span className="expand-label">{active===concept.term?'收起':'展开'} <ChevronDown size={15}/></span></button>)}</div>{filtered.length===0&&<EmptyState icon={Search} title="没有匹配术语" text="换一个关键词试试，例如 KL 或 reward。"/>}</div>
}

function Compare() {
  const [answers,setAnswers]=useState({feedback:'',explore:'',interaction:''})
  const recommendation=useMemo(()=>{
    if(answers.interaction==='multi'&&answers.explore==='yes') return {name:'Agentic RL',reason:'任务包含多轮环境反馈且需要探索长期策略；先建立可重置环境、Harness 与强 Agent SFT baseline。'}
    if(answers.interaction==='multi') return {name:'Agent SFT + Harness',reason:'先用工具轨迹教会基本行为，并通过上下文、权限、测试和观测把闭环做可靠；确认存在探索瓶颈后再升级 RL。'}
    if(answers.feedback==='verifiable'&&answers.explore==='yes') return {name:'GRPO / RLVR',reason:'可验证奖励加上探索需求，适合在线组采样策略优化。'}
    if(answers.feedback==='pair') return {name:'DPO',reason:'已有成对偏好且不强调在线探索，DPO 是稳健、低复杂度起点。'}
    if(answers.feedback==='demo') return {name:'SFT',reason:'先把高质量示范转化为可靠任务行为，再评估是否需要后续对齐。'}
    if(answers.feedback==='verifiable') return {name:'拒绝采样 + SFT',reason:'已有可靠 verifier 但暂不需要在线探索，先多采样选优并蒸馏回策略，建立低复杂度基线。'}
    if(answers.feedback==='subjective'&&answers.explore==='yes') return {name:'RM + PPO',reason:'主观复杂偏好且需要在线探索，可考虑奖励模型与 PPO。'}
    if(answers.feedback==='subjective') return {name:'RLAIF / 偏好数据 + DPO',reason:'先把主观 rubric 校准成偏好数据，用离线方法验证信号质量，再决定是否承担在线 RL 成本。'}
    return null
  },[answers])
  return <div className="page"><PageHeading eyebrow="METHOD BENCH" title="别按缩写选算法" description="用反馈形态、探索需求和交互长度做判断，再比较训练与系统成本。"/>
    <section className="decision-lab"><div className="decision-copy"><span className="section-kicker">METHOD SELECTOR</span><h2>三问定位起点</h2><p>这里给出的是第一版实验建议，不替代小规模 ablation。</p></div><div className="decision-fields"><label><span>你拥有什么反馈？</span><select value={answers.feedback} onChange={e=>setAnswers({...answers,feedback:e.target.value})}><option value="">请选择</option><option value="demo">高质量示范</option><option value="pair">chosen / rejected 偏好对</option><option value="verifiable">程序可验证奖励</option><option value="subjective">复杂主观反馈</option></select></label><label><span>是否需要策略探索？</span><select value={answers.explore} onChange={e=>setAnswers({...answers,explore:e.target.value})}><option value="">请选择</option><option value="no">不需要 / 不确定</option><option value="yes">需要超越离线候选</option></select></label><label><span>交互长度？</span><select value={answers.interaction} onChange={e=>setAnswers({...answers,interaction:e.target.value})}><option value="">请选择</option><option value="single">单轮回答</option><option value="multi">多轮工具 / 环境</option></select></label></div><div className="recommendation" aria-live="polite">{recommendation?<><Sparkles size={20}/><div><span>推荐起点</span><strong>{recommendation.name}</strong><p>{recommendation.reason}</p></div></>:<><CircleHelp size={20}/><p>完成选择后显示建议</p></>}</div></section>
    <section className="section-block"><div className="section-title-row"><div><span className="section-kicker">SIDE BY SIDE</span><h2>方法横向比较</h2></div></div><div className="table-wrap"><table className="comparison-table"><thead><tr><th>方法</th><th>训练信号</th><th>采样</th><th>额外模型</th><th>探索</th><th>强项</th><th>主要风险</th></tr></thead><tbody>{comparisonRows.map(row=><tr key={row.method}><td><strong>{row.method}</strong></td><td>{row.signal}</td><td><span className={row.online.includes('在线')?'online-mark':'offline-mark'}>{row.online}</span></td><td>{row.extraModels}</td><td>{row.exploration}</td><td>{row.strength}</td><td>{row.risk}</td></tr>)}</tbody></table></div></section>
    <section className="difference-band"><div><span>学术问题</span><h3>方法是否在受控实验中产生可归因增益？</h3><p>关注新颖性、基准、公平比较与复现。</p></div><div className="divider-arrow"><ArrowRight/></div><div><span>工业问题</span><h3>整条数据—训练—评测—部署链是否创造净价值？</h3><p>还要承担隐私、安全、延迟、成本、维护与回滚。</p></div></section>
  </div>
}

function Practice() {
  const [chapterFilter,setChapterFilter]=useState('all')
  const [knowledgeFilter,setKnowledgeFilter]=useState('all')
  const [count,setCount]=useState(5)
  const [session,setSession]=useState<QuizQuestion[]|null>(null)
  const [index,setIndex]=useState(0)
  const [selected,setSelected]=useState<number[]>([])
  const [submitted,setSubmitted]=useState(false)
  const [score,setScore]=useState(0)
  const [finished,setFinished]=useState(false)
  const pool=quizQuestions.filter(q=>(chapterFilter==='all'||q.chapterId===chapterFilter)&&(knowledgeFilter==='all'||q.knowledgeType===knowledgeFilter))
  const start=()=>{ const shuffled=[...pool].sort(()=>Math.random()-.5).slice(0,Math.min(count,pool.length));setSession(shuffled);setIndex(0);setSelected([]);setSubmitted(false);setScore(0);setFinished(false) }
  const question=session?.[index]
  const isCorrect=question?selected.length===question.answer.length&&selected.every(v=>question.answer.includes(v)):false
  const choose=(optionIndex:number)=>{if(!question||submitted)return;if(question.type==='multi')setSelected(prev=>prev.includes(optionIndex)?prev.filter(v=>v!==optionIndex):[...prev,optionIndex]);else setSelected([optionIndex])}
  const submit=()=>{if(!selected.length)return;setSubmitted(true);if(isCorrect)setScore(s=>s+1)}
  const next=()=>{if(!session)return;if(index===session.length-1){setFinished(true)}else{setIndex(i=>i+1);setSelected([]);setSubmitted(false)}}
  if(session&&finished)return <div className="page"><PageHeading eyebrow="RESULT" title="本轮训练完成" description="真正的掌握来自解释错误，而不是只记住选项。"/><div className="result-panel"><div className="result-ring"><strong>{score}</strong><span>/ {session.length}</span></div><h2>{score===session.length?'全部答对':score/session.length>=.6?'基础稳固，继续打磨':'建议回到对应章节复习'}</h2><p>正确率 {Math.round(score/session.length*100)}%。下一轮会重新随机抽题。</p><div><button className="secondary-button" onClick={()=>setSession(null)}><ArrowLeft size={17}/>返回设置</button><button className="primary-button" onClick={start}><RefreshCw size={17}/>再来一轮</button></div></div></div>
  return <div className="page"><PageHeading eyebrow="ACTIVE RECALL" title="抽题训练场" description="每题提交后立即看解析，覆盖概念、推导直觉、Agent/Harness 与工程故障。"/>{!session?<div className="practice-setup"><div className="setup-main"><span className="section-kicker">BUILD A SESSION</span><h2>配置本轮练习</h2><div className="setup-fields"><label><span>章节范围</span><select value={chapterFilter} onChange={e=>setChapterFilter(e.target.value)}><option value="all">全课程混合</option>{chapters.map(c=><option key={c.id} value={c.id}>第 {c.index} 章 · {c.shortTitle}</option>)}</select></label><label><span>知识类型</span><select value={knowledgeFilter} onChange={e=>setKnowledgeFilter(e.target.value)}><option value="all">全部类型</option>{Array.from(new Set(quizQuestions.map(q=>q.knowledgeType))).map(type=><option key={type} value={type}>{type}</option>)}</select></label></div><label><span>题目数量</span><div className="segmented">{[5,10,15].map(n=><button key={n} className={count===n?'active':''} onClick={()=>setCount(n)}>{n} 题</button>)}</div></label><button className="primary-button" disabled={!pool.length} onClick={start}><Shuffle size={17}/>随机抽题</button></div><div className="setup-aside"><div><CircleHelp size={22}/><strong>{pool.length}</strong><span>可抽题目</span></div><div><Target size={22}/><strong>即时</strong><span>判分解析</span></div><div><BrainCircuit size={22}/><strong>8 类</strong><span>知识维度</span></div></div></div>:question&&<div className="quiz-shell"><div className="quiz-status"><span>QUESTION {String(index+1).padStart(2,'0')}</span><div className="quiz-dots">{session.map((_,i)=><span key={i} className={`${i<index?'past':''} ${i===index?'current':''}`}/>)}</div><strong>{score} 分</strong></div><div className="quiz-card"><div className="quiz-tags"><span>{chapters.find(c=>c.id===question.chapterId)?.shortTitle}</span><span>{question.knowledgeType}</span><span>{question.difficulty}</span><span>{question.type==='multi'?'多选题':question.type==='judge'?'判断题':'单选题'}</span></div><h2>{question.question}</h2><div className="options-list">{question.options.map((option,i)=>{const picked=selected.includes(i);const answer=question.answer.includes(i);const state=submitted?(answer?'correct':picked?'wrong':''):picked?'selected':'';return <button key={option} className={state} onClick={()=>choose(i)}><span>{String.fromCharCode(65+i)}</span><strong>{option}</strong>{submitted&&answer&&<Check size={18}/>} {submitted&&picked&&!answer&&<X size={18}/>}</button>})}</div>{submitted&&<div className={`answer-feedback ${isCorrect?'correct':'wrong'}`} aria-live="polite"><div>{isCorrect?<CheckCircle2 size={20}/>:<XCircle size={20}/>}<strong>{isCorrect?'回答正确':'再看一眼这个关键点'}</strong></div><p>{question.explanation}</p></div>}<div className="quiz-actions"><button className="text-button" onClick={()=>setSession(null)}>退出本轮</button>{!submitted?<button className="primary-button" disabled={!selected.length} onClick={submit}>提交答案</button>:<button className="primary-button" onClick={next}>{index===session.length-1?'查看成绩':'下一题'}<ArrowRight size={16}/></button>}</div></div></div>}</div>
}

function Interview({saved,toggleSaved}:{saved:Set<string>;toggleSaved:(id:string)=>void}) {
  const [category,setCategory]=useState('全部')
  const [questionType,setQuestionType]=useState('全部')
  const [difficulty,setDifficulty]=useState('全部')
  const [query,setQuery]=useState('')
  const [revealed,setRevealed]=useState<Set<string>>(new Set())
  const categories=['全部',...Array.from(new Set(interviewQuestions.map(q=>q.category)))]
  const questionTypes=['全部',...Array.from(new Set(interviewQuestions.map(q=>q.questionType).filter(Boolean)))]
  const filtered=interviewQuestions.filter(q=>(category==='全部'||q.category===category)&&(questionType==='全部'||q.questionType===questionType)&&(difficulty==='全部'||q.difficulty===difficulty)&&`${q.question}${q.tags.join('')}`.toLowerCase().includes(query.toLowerCase()))
  const toggleReveal=(id:string)=>setRevealed(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n})
  const randomOne=()=>{const list=filtered.length?filtered:interviewQuestions;const q=list[Math.floor(Math.random()*list.length)];setCategory(q.category);setQuestionType(q.questionType??'全部');setQuery(q.question.slice(0,8))}
  return <div className="page"><PageHeading eyebrow="INTERVIEW HOTSET" title="不止会背，还要经得起追问" description="覆盖概念、推导、对比、诊断、系统设计、项目复盘、代码实现与开放讨论。先口述 90 秒，再展开框架。" actions={<button className="secondary-button" onClick={randomOne}><Shuffle size={16}/>随机一题</button>}/><div className="filter-bar"><div className="inline-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索题目或标签"/></div><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select><select value={questionType} onChange={e=>setQuestionType(e.target.value)}>{questionTypes.map(type=><option key={type}>{type}</option>)}</select><select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option>全部</option><option>入门</option><option>进阶</option><option>硬核</option></select><span>{filtered.length} 题</span></div><div className="interview-list">{filtered.map((q,idx)=><InterviewCard key={q.id} question={q} number={idx+1} revealed={revealed.has(q.id)} saved={saved.has(q.id)} onReveal={()=>toggleReveal(q.id)} onSave={()=>toggleSaved(q.id)}/>)}</div>{!filtered.length&&<EmptyState icon={Search} title="没有匹配题目" text="清空筛选或换一个关键词。"/>}</div>
}

function InterviewCard({question,number,revealed,saved,onReveal,onSave}:{question:InterviewQuestion;number:number;revealed:boolean;saved:boolean;onReveal:()=>void;onSave:()=>void}) {
  return <article className={`interview-card ${revealed?'revealed':''}`}><div className="interview-number">{String(number).padStart(2,'0')}</div><div className="interview-body"><div className="interview-meta"><span>{question.category}</span>{question.questionType&&<span className="question-type">{question.questionType}</span>}<span className={`difficulty ${question.difficulty}`}>{question.difficulty}</span>{question.tags.map(tag=><span key={tag}>#{tag}</span>)}</div><h2>{question.question}</h2>{revealed?<div className="model-answer"><div className="answer-summary"><span>30 秒核心回答</span><p>{question.shortAnswer}</p></div><div className="answer-grid"><div><span>展开框架</span><ol>{question.deepAnswer.map(a=><li key={a}>{a}</li>)}</ol></div><div><span>面试官可能追问</span><ul>{question.followUps.map(f=><li key={f}>{f}</li>)}</ul></div></div></div>:<div className="think-prompt"><Clock3 size={17}/><span>先计时口述 90 秒，再展开答案</span></div>}<div className="interview-actions"><button className="secondary-button" onClick={onReveal}>{revealed?'收起参考':'展开参考答案'}<ChevronDown size={16}/></button><button className={`icon-button save-button ${saved?'saved':''}`} onClick={onSave} aria-label={saved?'取消收藏':'收藏题目'} title={saved?'取消收藏':'收藏题目'}><Trophy size={17}/></button></div></div></article>
}

function Tutor() {
  const [settingsOpen,setSettingsOpen]=useState(false)
  const [baseUrl,setBaseUrl]=useState(()=>sessionStorage.getItem('tutor-base-url')||'https://api.openai.com/v1')
  const [apiKey,setApiKey]=useState(()=>sessionStorage.getItem('tutor-api-key')||'')
  const [model,setModel]=useState(()=>sessionStorage.getItem('tutor-model')||'gpt-4.1-mini')
  const [messages,setMessages]=useState<ChatMessage[]>([{role:'assistant',content:'我是你的后训练学习导师。你可以让我解释公式、比较算法、模拟面试，或根据某个训练现象一起排查。配置 API 后即可开始。'}])
  const [input,setInput]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const saveSettings=()=>{sessionStorage.setItem('tutor-base-url',baseUrl.replace(/\/$/,''));sessionStorage.setItem('tutor-api-key',apiKey);sessionStorage.setItem('tutor-model',model);setSettingsOpen(false)}
  const send=async(text?:string)=>{
    const content=(text??input).trim();if(!content||loading)return
    if(!apiKey){setError('请先打开 API 配置并填写密钥。密钥只保存在当前浏览器会话中。');setSettingsOpen(true);return}
    const next=[...messages,{role:'user' as const,content}];setMessages(next);setInput('');setLoading(true);setError('')
    try{
      const response=await fetch(`${baseUrl.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},body:JSON.stringify({model,temperature:.3,messages:[{role:'system',content:'你是一名严谨的大模型后训练与 Agent 工程导师。用中文回答。重点覆盖 SFT、奖励模型、RLHF/PPO、DPO、GRPO/RLVR、现代在线 RL、Agent 架构、Agent Harness、Agentic RL、蒸馏、评测与分布式系统。先给核心结论，再给公式推导或工程例子；明确区分模型、Harness、工具与环境责任；指出学术设定与工业约束的差别；不要编造论文、数字或框架能力。若用户在模拟面试，先追问再点评。'},...next.map(m=>({role:m.role,content:m.content}))]})})
      if(!response.ok){const body=await response.text();throw new Error(`HTTP ${response.status}: ${body.slice(0,180)}`)}
      const data=await response.json() as {choices?:{message?:{content?:string}}[]}
      const answer=data.choices?.[0]?.message?.content;if(!answer)throw new Error('接口没有返回可读取的回答。')
      setMessages(prev=>[...prev,{role:'assistant',content:answer}])
    }catch(err){setError(err instanceof Error?err.message:'调用失败，请检查配置与网络。')}finally{setLoading(false)}
  }
  const prompts=['用直觉解释 DPO 的推导','模拟一道 GRPO 面试题','设计一个可靠的 Agent Harness','比较 Agent SFT 与 Agentic RL']
  return <div className="page tutor-page"><PageHeading eyebrow="API-POWERED TUTOR" title="把知识点问到真正懂" description="连接任意 OpenAI-compatible API，进行追问、面试模拟和训练/Agent 系统故障分析。" actions={<button className="secondary-button" onClick={()=>setSettingsOpen(true)}><Settings2 size={16}/>API 配置</button>}/><div className="tutor-shell"><div className="chat-area"><div className="chat-messages">{messages.map((message,idx)=><div key={idx} className={`chat-message ${message.role}`}><div className="avatar">{message.role==='assistant'?<Bot size={18}/>:<span>你</span>}</div><div><span>{message.role==='assistant'?'学习导师':'你'}</span><p>{message.content}</p></div></div>)}{loading&&<div className="chat-message assistant"><div className="avatar"><Bot size={18}/></div><div><span>学习导师</span><div className="typing"><i/><i/><i/></div></div></div>}</div>{messages.length===1&&<div className="prompt-suggestions">{prompts.map(prompt=><button key={prompt} onClick={()=>send(prompt)}><MessageSquareText size={16}/>{prompt}</button>)}</div>}{error&&<div className="api-error" role="alert"><XCircle size={17}/><span>{error}</span></div>}<form className="chat-input" onSubmit={(e:FormEvent)=>{e.preventDefault();send()}}><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder="问一个具体问题，例如：Harness 如何防止工具输出中的间接 prompt injection？" rows={2}/><button type="submit" className="send-button" disabled={!input.trim()||loading} aria-label="发送"><Send size={18}/></button></form><p className="input-note">Enter 发送 · Shift + Enter 换行 · 不要提交敏感数据</p></div><aside className="tutor-context"><span className="section-kicker">CONTEXT KIT</span><h2>让回答更有针对性</h2><p>提问时可包含这四类上下文：</p><ul><li><strong>任务</strong><span>数学、代码、对话或 Agent</span></li><li><strong>阶段</strong><span>SFT / DPO / PPO / GRPO / Harness</span></li><li><strong>现象</strong><span>曲线、trace、样例与失败分布</span></li><li><strong>约束</strong><span>模型、工具、环境、显存与延迟</span></li></ul><div className="context-tip"><Sparkles size={17}/><p>好问题示例：Agent 成功率上升但工具调用翻倍，如何区分模型策略问题、reward shaping 漏洞和 Harness 终止条件问题？</p></div></aside></div>
    {settingsOpen&&<div className="modal-backdrop" onMouseDown={()=>setSettingsOpen(false)}><div className="settings-modal" onMouseDown={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="API 配置"><div className="modal-head"><div><span className="section-kicker">CONNECTION</span><h2>API 配置</h2></div><button className="icon-button" onClick={()=>setSettingsOpen(false)} aria-label="关闭"><X size={19}/></button></div><div className="security-note"><Zap size={17}/><p>仅供本地学习：密钥保存在 sessionStorage，关闭标签页后失效。生产部署应使用服务端代理，切勿把密钥写进前端源码。</p></div><label><span>Base URL</span><input value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1"/></label><label><span>API Key</span><input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-…" autoComplete="off"/></label><label><span>模型名称</span><input value={model} onChange={e=>setModel(e.target.value)} placeholder="gpt-4.1-mini"/></label><button className="primary-button" onClick={saveSettings}><Check size={17}/>保存会话配置</button></div></div>}
  </div>
}

function Resources() {
  return <div className="page"><PageHeading eyebrow="PRIMARY SOURCES" title="论文书架与阅读顺序" description="课程内容以原始论文、协议规范和当前主流开源栈为锚点。建议先读问题设定，再看公式、实现与实验。"/><div className="reading-path">{papers.map((paper,idx)=><a key={paper.title} href={paper.url} target="_blank" rel="noreferrer" className="paper-row"><span className="paper-number">{String(idx+1).padStart(2,'0')}</span><div className="paper-main"><div><span>{paper.year}</span><span>{paper.stage}</span></div><h2>{paper.title}</h2><p>{paper.why}</p></div><ExternalLink size={18}/></a>)}</div><section className="resource-stack section-block"><div><span className="section-kicker">IMPLEMENTATION</span><h2>训练、Agent 与 Harness</h2></div><div className="resource-links"><a href="https://huggingface.co/docs/trl/" target="_blank" rel="noreferrer"><Code2/><span><strong>Hugging Face TRL</strong><small>SFT、DPO、GRPO、Reward 与在线训练器</small></span><ExternalLink/></a><a href="https://github.com/volcengine/verl" target="_blank" rel="noreferrer"><Network/><span><strong>verl</strong><small>面向大模型 RL 的灵活分布式训练框架</small></span><ExternalLink/></a><a href="https://github.com/OpenRLHF/OpenRLHF" target="_blank" rel="noreferrer"><Zap/><span><strong>OpenRLHF</strong><small>Ray + vLLM 的 RLHF / Agentic RL 工程栈</small></span><ExternalLink/></a><a href="https://openai.github.io/openai-agents-python/" target="_blank" rel="noreferrer"><Bot/><span><strong>OpenAI Agents SDK</strong><small>Agent loop、tools、handoffs、guardrails、sessions 与 tracing</small></span><ExternalLink/></a><a href="https://modelcontextprotocol.io/specification/2025-06-18/index" target="_blank" rel="noreferrer"><Network/><span><strong>MCP Specification</strong><small>Host/Client/Server 和 prompts/resources/tools 协议边界</small></span><ExternalLink/></a><a href="https://martinfowler.com/articles/harness-engineering.html" target="_blank" rel="noreferrer"><Gauge/><span><strong>Harness Engineering</strong><small>Guides、Sensors 与 Agent 自我修正控制系统</small></span><ExternalLink/></a></div></section><div className="freshness-note"><FileText size={18}/><p><strong>内容基线</strong>：原理部分按原始论文整理；框架生态、Harness 与 Agentic RL 章节核对于 2026-08。前沿变化快，开始实验前请再次确认当前版本文档。</p></div></div>
}

function EmptyState({icon:Icon,title,text}:{icon:LucideIcon;title:string;text:string}) { return <div className="empty-state"><Icon size={24}/><h2>{title}</h2><p>{text}</p></div> }

function FormulaBlock({expression,label,note}:{expression:string;label?:string;note?:string}) {
  const html = useMemo(() => katex.renderToString(expression, {
    displayMode: true,
    throwOnError: false,
    strict: false,
    output: 'htmlAndMathml',
  }), [expression])
  return <figure className="formula-box">
    {label && <figcaption><span>FORMULA</span>{label}</figcaption>}
    <div className="formula-render" dangerouslySetInnerHTML={{__html:html}} />
    {note && <p>{note}</p>}
  </figure>
}

export default App
