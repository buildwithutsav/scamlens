import { useState } from 'react'
import { BookOpen, CheckCircle2, ChevronRight, ShieldAlert, Smartphone, BriefcaseBusiness, MessageCircleWarning, LockKeyhole, Zap, RotateCcw } from 'lucide-react'
import './Learn.css'

type Lesson = {
  id: string; category: string; title: string; time: string; summary: string
  icon: typeof ShieldAlert; points: string[]; question: string
  options: string[]; answer: number; explanation: string
}

const lessons: Lesson[] = [
  {
    id: 'phishing', category: 'LINK SAFETY', title: 'Spot a phishing message', time: '3 min',
    summary: 'Learn how fake messages try to steal logins, passwords and personal details.', icon: ShieldAlert,
    points: [
      'Check the complete sender address, not just the display name or logo.',
      'Be cautious of unexpected links asking you to sign in, verify an account or claim a reward.',
      'Open the official app or type the organisation’s known website yourself instead of using the message link.',
    ],
    question: 'Your bank texts an unexpected link asking you to “reactivate” your account. What is the safest next step?',
    options: ['Open the link and check if the page looks genuine', 'Use the bank’s official app or a verified contact channel', 'Reply with your account number to confirm your identity'],
    answer: 1,
    explanation: 'Use a channel you independently know is genuine. Logos and familiar wording can be copied by scammers.',
  },
  {
    id: 'upi', category: 'PAYMENT SAFETY', title: 'Understand UPI payment traps', time: '3 min',
    summary: 'Recognise collect requests, fake payment screenshots and PIN tricks.', icon: Smartphone,
    points: [
      'A UPI PIN authorises a payment from your account; it is not needed to receive money.',
      'Check the transaction inside your own UPI app or bank statement. A screenshot is not proof of payment.',
      'Read the amount and recipient carefully before approving any collect request or QR payment.',
    ],
    question: 'Someone says they are sending you money and asks you to enter your UPI PIN to receive it. What should you do?',
    options: ['Enter the PIN to accept the money', 'Scan their QR code and approve the request', 'Do not enter the PIN; verify the request and refuse unexpected payment approvals'],
    answer: 2,
    explanation: 'Never enter your UPI PIN to receive money. Entering it generally authorises a debit or payment.',
  },
  {
    id: 'jobs', category: 'JOB & INTERNSHIP SAFETY', title: 'Avoid fake job offers', time: '4 min',
    summary: 'Check suspicious recruitment messages before sharing documents or paying fees.', icon: BriefcaseBusiness,
    points: [
      'Be wary of guaranteed high pay, instant selection and offers without a credible interview or assessment.',
      'Upfront registration, training or refundable security fees are major warning signs. Verify independently.',
      'Check the role on the organisation’s official careers page and contact it using independently sourced details.',
    ],
    question: 'A recruiter promises a high-paying job without an interview but asks for a refundable registration fee. What is the strongest response?',
    options: ['Pay a small amount to reserve the role', 'Pause, do not pay, and verify the vacancy through official company channels', 'Send identity documents first and ask questions later'],
    answer: 1,
    explanation: 'Do not pay to secure an unverified offer. Verify the vacancy and recruiter independently before sharing information.',
  },
  {
    id: 'social', category: 'SOCIAL ENGINEERING', title: 'Resist pressure and impersonation', time: '3 min',
    summary: 'Understand how scammers exploit urgency, fear and trust.', icon: MessageCircleWarning,
    points: [
      'Scammers may impersonate banks, police, delivery services, employers or people you know.',
      'Threats, secrecy and demands for immediate action are pressure tactics. Slow the interaction down.',
      'End the conversation and call the person or organisation using a number you already trust.',
    ],
    question: 'A caller claims to be an official and says you will be arrested unless you transfer money immediately. What should you do?',
    options: ['Transfer the money to avoid trouble', 'Stay on the call and share personal details', 'End the call and verify through an official, independently found channel'],
    answer: 2,
    explanation: 'Urgent threats and payment demands are serious warning signs. Do not transfer money or share sensitive information under pressure.',
  },
]

function readCompleted(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem('scamlens-learn-completed') || '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export default function Learn({ onLessonComplete }: { onLessonComplete: (amount: number) => void }) {
  const [completed, setCompleted] = useState<string[]>(readCompleted)
  const [selectedId, setSelectedId] = useState(lessons[0].id)
  const [choice, setChoice] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const selected = lessons.find(lesson => lesson.id === selectedId) ?? lessons[0]
  const Icon = selected.icon
  const isCorrect = choice === selected.answer
  const done = completed.includes(selected.id)

  function selectLesson(id: string) {
    setSelectedId(id)
    setChoice(null)
    setSubmitted(false)
  }

  function submitAnswer() {
    if (choice === null || submitted) return
    setSubmitted(true)
    if (choice === selected.answer && !completed.includes(selected.id)) {
      const updated = [...completed, selected.id]
      setCompleted(updated)
      localStorage.setItem('scamlens-learn-completed', JSON.stringify(updated))
      onLessonComplete(30)
    }
  }

  return (
    <section className="learn-page">
      <header className="learn-hero">
        <div className="learn-hero-copy">
          <span className="learn-kicker"><BookOpen size={15} /> THE DETECTIVE LIBRARY</span>
          <h1>Knowledge is your <em>best defence.</em></h1>
          <p>Short, practical lessons to help you recognise common scams and make safer decisions online.</p>
          <div className="learn-progress-line">
            <span><CheckCircle2 size={16} /> {completed.length} of {lessons.length} lessons completed</span>
            <strong>{Math.round(completed.length / lessons.length * 100)}%</strong>
          </div>
          <div className="learn-progress-track"><span style={{ width: `${completed.length / lessons.length * 100}%` }} /></div>
        </div>
        <div className="learn-hero-art">
          <div className="learn-book-circle"><BookOpen size={48} /></div>
          <span className="learn-spark learn-spark-one">✦</span>
          <span className="learn-spark learn-spark-two">✳</span>
          <div className="learn-xp-chip"><Zap size={15} /> +30 XP per lesson</div>
        </div>
      </header>

      <div className="learn-layout">
        <aside className="learn-list-panel">
          <div className="learn-section-title">
            <div><span className="learn-kicker">LEARNING PATH</span><h2>Choose a lesson</h2></div>
            <span className="learn-count">{completed.length}/{lessons.length}</span>
          </div>
          <div className="learn-lesson-list">
            {lessons.map((lesson, index) => {
              const LessonIcon = lesson.icon
              const isDone = completed.includes(lesson.id)
              return (
                <button key={lesson.id} className={`learn-lesson-item ${selectedId === lesson.id ? 'active' : ''}`} onClick={() => selectLesson(lesson.id)}>
                  <span className="learn-lesson-number">{isDone ? <CheckCircle2 size={19} /> : `0${index + 1}`}</span>
                  <span className="learn-lesson-icon"><LessonIcon size={19} /></span>
                  <span className="learn-lesson-text"><strong>{lesson.title}</strong><small>{lesson.time} · {lesson.category}</small></span>
                  <ChevronRight size={17} className="learn-chevron" />
                </button>
              )
            })}
          </div>
          <div className="learn-tip-card"><LockKeyhole size={19} /><div><strong>Remember</strong><p>Pause before you click, pay or share personal information.</p></div></div>
        </aside>

        <article className="learn-content-card">
          <div className="learn-content-top"><span className="learn-category-pill">{selected.category}</span><span className="learn-duration">{selected.time} read</span></div>
          <div className="learn-content-heading"><div className="learn-topic-icon"><Icon size={25} /></div><div><span className="learn-kicker">FIELD GUIDE</span><h2>{selected.title}</h2></div></div>
          <p className="learn-summary">{selected.summary}</p>
          <div className="learn-points">
            {selected.points.map((point, index) => <div className="learn-point" key={point}><span>{index + 1}</span><p>{point}</p></div>)}
          </div>
          <div className="learn-quiz">
            <div className="learn-quiz-heading">
              <span><BookOpen size={16} /> QUICK KNOWLEDGE CHECK</span>
              {done && <span className="learn-done-label"><CheckCircle2 size={14} /> COMPLETED</span>}
            </div>
            <h3>{selected.question}</h3>
            <div className="learn-options">
              {selected.options.map((option, index) => {
                const correctOption = submitted && index === selected.answer
                const wrongOption = submitted && choice === index && !isCorrect
                return (
                  <button key={option} className={`learn-option ${choice === index ? 'chosen' : ''} ${correctOption ? 'correct' : ''} ${wrongOption ? 'wrong' : ''}`} onClick={() => { if (!submitted) setChoice(index) }} disabled={submitted}>
                    <span className="learn-option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>
                    {correctOption && <CheckCircle2 size={17} />}
                  </button>
                )
              })}
            </div>
            {submitted && <div className={`learn-explanation ${isCorrect ? 'success' : 'retry'}`}><strong>{isCorrect ? 'Correct answer!' : 'Not quite. Review the key idea.'}</strong><p>{selected.explanation}</p></div>}
            <div className="learn-quiz-footer">
              <span><Zap size={15} /> {done ? 'XP already collected for this lesson' : 'Earn 30 XP for a correct answer'}</span>
              {!submitted
                ? <button className="learn-submit" onClick={submitAnswer} disabled={choice === null}>Check answer <ChevronRight size={16} /></button>
                : <button className="learn-submit secondary" onClick={() => { setChoice(null); setSubmitted(false) }}><RotateCcw size={15} /> Try again</button>}
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
