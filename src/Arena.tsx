import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Swords, ShieldAlert, ShieldCheck, Zap, Trophy,
  CheckCircle2, XCircle, ArrowRight, RotateCcw,
  Lightbulb, Target, Search
} from 'lucide-react'
import './Arena.css'

type Case = {
  type: 'Scam' | 'Safe'
  category: string
  sender: string
  title: string
  message: string
  clue: string
  explanation: string
  advice: string
  flags: string[]
  decoys: string[]
}

const cases: Case[] = [
  {
    type: 'Scam',
    category: 'BANKING',
    sender: 'Unknown number · SMS',
    title: 'Your account is on hold',
    message: 'URGENT: Your bank account will be blocked today. Complete KYC immediately using this link. Share your OTP with our executive to verify.',
    clue: 'Threatening account closure, an unexpected link and a request to share an OTP.',
    explanation: 'Banks do not ask customers to share OTPs. Urgency and unsolicited KYC links are common phishing tactics.',
    advice: 'Do not open the link or share an OTP. Contact your bank through independently verified contact details.',
    flags: ['URGENT', 'will be blocked today', 'using this link', 'Share your OTP'],
    decoys: ['Your bank account', 'Complete KYC immediately']
  },
  {
    type: 'Safe',
    category: 'ACCOUNT SECURITY',
    sender: 'Bank · App notification',
    title: 'A transaction alert',
    message: 'You spent ₹450 using your debit card today. If you do not recognise this transaction, open your bank app directly or call the number printed on your card.',
    clue: 'It asks you to open the official app yourself, rather than follow an unfamiliar link.',
    explanation: 'This is consistent with a routine transaction alert. It does not request credentials, OTPs or payment.',
    advice: 'Verify the transaction inside your banking app. Never rely on a message alone.',
    flags: [],
    decoys: ['₹450', 'debit card', 'bank app directly']
  },
  {
    type: 'Scam',
    category: 'JOB FRAUD',
    sender: 'Recruitment Desk · WhatsApp',
    title: 'A job offer that pays first',
    message: 'Congratulations! Earn ₹3,500 daily from home. No interview needed. Pay a refundable ₹1,999 registration fee today to activate your employee ID.',
    clue: 'Unrealistic pay, no selection process and an upfront registration fee.',
    explanation: 'Fake job offers often promise easy money and demand fees for registration, training or verification.',
    advice: 'Do not pay. Verify the company and vacancy through its independently found official careers page.',
    flags: ['Earn ₹3,500 daily', 'No interview needed', 'Pay a refundable ₹1,999 registration fee'],
    decoys: ['Congratulations!', 'from home', 'employee ID']
  },
  {
    type: 'Safe',
    category: 'DIGITAL PAYMENTS',
    sender: 'UPI app',
    title: 'You receive a payment',
    message: 'Your UPI app shows that ₹800 has been received. You check the transaction inside the app and see the credit in your account balance.',
    clue: 'The credit is verified inside your own payment app. No PIN is requested.',
    explanation: 'Receiving money does not require entering your UPI PIN.',
    advice: 'Never enter your UPI PIN to receive money or approve an unexpected collect request.',
    flags: [],
    decoys: ['₹800', 'inside the app', 'account balance']
  },
  {
    type: 'Scam',
    category: 'PRIZE FRAUD',
    sender: 'Lucky Rewards · SMS',
    title: 'You won a surprise prize',
    message: 'You have won ₹5,00,000! Pay ₹4,999 processing charges within two hours to claim your prize. Reply with your details now.',
    clue: 'An unexpected prize, advance payment demand and a short deadline.',
    explanation: 'Prize scams create excitement and urgency before demanding money or personal information.',
    advice: 'Do not pay. Verify contests through independently found official channels.',
    flags: ['You have won ₹5,00,000', 'Pay ₹4,999 processing charges', 'within two hours'],
    decoys: ['Reply with your details now']
  },
  {
    type: 'Safe',
    category: 'PASSWORD SAFETY',
    sender: 'Password manager · App notification',
    title: 'A security reminder',
    message: 'Your password manager recommends enabling two-factor authentication. Open the password manager app from your device to review this recommendation.',
    clue: 'It recommends a protective setting and asks you to open the app yourself.',
    explanation: 'This is a sensible security reminder. Navigating to the app directly is safer than following unexpected login links.',
    advice: 'Enable two-factor authentication where available.',
    flags: [],
    decoys: ['two-factor authentication', 'password manager app']
  }
]

type Mode = 'classify' | 'redflags' | 'timed'

function Arena({ onRoundComplete }: { onRoundComplete: (result: { cases: number; correct: number; xp: number }) => number }) {
  const xpAwarded = useRef(false)
  const [mode, setMode] = useState<Mode>('classify')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(string | null)[]>(Array(6).fill(null))
  const [selectedFlags, setSelectedFlags] = useState<string[]>([])
  const [flagAnswers, setFlagAnswers] = useState<(boolean | null)[]>(Array(6).fill(null))
  const [flagSubmitted, setFlagSubmitted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [totalAwardedXP, setTotalAwardedXP] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [timerStarted, setTimerStarted] = useState(false)

  const current = cases[index]
  const answer = answers[index]
  const flagCorrect = current.flags.length === selectedFlags.length &&
    current.flags.every(flag => selectedFlags.includes(flag))

  const score = answers.reduce(
    (total, value, i) => total + (value === cases[i].type ? 1 : 0), 0
  )
  const flagScore = flagAnswers.filter(value => value === true).length
  const completed = mode === 'redflags' ? flagSubmitted : answer !== null

  function resetRound(nextMode: Mode = mode) {
    xpAwarded.current = false
    setMode(nextMode)
    setIndex(0)
    setAnswers(Array(6).fill(null))
    setSelectedFlags([])
    setFlagAnswers(Array(6).fill(null))
    setFlagSubmitted(false)
    setFinished(false)
    setTotalAwardedXP(0)
    setSecondsLeft(30)
    setTimerStarted(nextMode === 'timed')
  }

  function choose(value: 'Scam' | 'Safe') {
    if (answer !== null) return
    if (mode === 'timed' && !timerStarted) setTimerStarted(true)
    setAnswers(previous => previous.map((v, i) => i === index ? value : v))
  }

  function toggleFlag(flag: string) {
    if (flagSubmitted) return
    setSelectedFlags(previous =>
      previous.includes(flag)
        ? previous.filter(item => item !== flag)
        : [...previous, flag]
    )
  }

  function submitFlags() {
    if (flagSubmitted) return
    setFlagAnswers(previous =>
      previous.map((value, i) => i === index ? flagCorrect : value)
    )
    setFlagSubmitted(true)
  }

  function awardAndFinish() {
    if (!xpAwarded.current) {
      const correct = mode === 'redflags' ? flagScore : score
      const earned = correct * 20
      const bonus = onRoundComplete({ cases: cases.length, correct, xp: earned })
      setTotalAwardedXP(earned + bonus)
      xpAwarded.current = true
    }
    setFinished(true)
  }

  useEffect(() => {
    if (mode !== 'timed' || !timerStarted || finished || secondsLeft <= 0) return

    const timer = window.setInterval(() => {
      setSecondsLeft(value => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [mode, timerStarted, finished, secondsLeft > 0])

  useEffect(() => {
    if (mode === 'timed' && secondsLeft === 0 && !finished) {
      awardAndFinish()
    }
  }, [mode, secondsLeft, finished])

  useEffect(() => {
    if (mode !== 'timed' || answer === null || finished) return

    const advance = window.setTimeout(() => {
      if (index === cases.length - 1) {
        awardAndFinish()
      } else {
        setIndex(value => value + 1)
      }
    }, 500)

    return () => window.clearTimeout(advance)
  }, [mode, answer, index, finished])

  function next() {
    if (index === cases.length - 1) {
      awardAndFinish()
    } else {
      setIndex(value => value + 1)
      setSelectedFlags([])
      setFlagSubmitted(false)
    }
  }

  function restart() {
    resetRound(mode)
  }

  function renderFlagMessage(): ReactNode[] {
    const phrases: string[] = [...current.flags, ...current.decoys]
    phrases.sort(
      (a, b) => current.message.indexOf(a) - current.message.indexOf(b)
    )

    const segments: ReactNode[] = []
    let cursor = 0

    phrases.forEach((phrase, i) => {
      const start = current.message.indexOf(phrase)
      if (start < cursor) return

      if (start > cursor) {
        segments.push(current.message.slice(cursor, start))
      }

      const selected = selectedFlags.includes(phrase)
      const isRealFlag = current.flags.some(item => item === phrase)
      const revealed = flagSubmitted && isRealFlag

      segments.push(
        <button
          key={`${index}-${i}`}
          type="button"
          className={`arena-flag ${selected ? 'selected' : ''} ${revealed ? 'revealed' : ''}`}
          onClick={() => toggleFlag(phrase)}
          disabled={flagSubmitted}
          aria-pressed={selected}
        >
          {phrase}
        </button>
      )
      cursor = start + phrase.length
    })

    if (cursor < current.message.length) {
      segments.push(current.message.slice(cursor))
    }

    return segments
  }

  if (finished) {
    const finalScore = mode === 'redflags' ? flagScore : score

    return (
      <section className="arena-page">
        <div className="arena-heading">
          <span className="arena-kicker"><Trophy size={15} /> CASE FILE COMPLETE</span>
          <h1>Investigation complete.</h1>
          <p>{mode === 'redflags'
            ? 'Here is how accurately you spotted the suspicious phrases.'
            : mode === 'timed'
              ? 'Here is how many correct decisions you made before time ran out.'
              : 'Here is how you performed identifying scams.'}</p>
        </div>

        <div className="arena-result">
          <Trophy size={36} />
          <h2>{finalScore}<span> / 6</span></h2>
          <p>{mode === 'redflags'
            ? 'Cases with all red flags found'
            : mode === 'timed'
              ? 'Correct decisions before time ran out'
              : 'Correct decisions'}</p>
          <strong className="arena-xp"><Zap size={17} /> +{totalAwardedXP} XP earned</strong>
          {totalAwardedXP > finalScore * 20 && (
            <p className="arena-bonus-note">Includes +{totalAwardedXP - finalScore * 20} daily mission bonus</p>
          )}
          <div className="arena-progress">
            <div style={{ width: `${finalScore / 6 * 100}%` }} />
          </div>
          <p>{finalScore === 6
            ? 'Perfect investigation. You spotted every clue.'
            : finalScore >= 4
              ? 'Good work. Keep checking the details.'
              : 'Keep practising. Slow down and inspect the clues.'}</p>
          <button className="arena-primary" onClick={restart}>
            <RotateCcw size={16} /> Play again
          </button>
        </div>

        <div className="arena-review">
          <h3>Case review</h3>
          {cases.map((item, i) => {
            const correct = mode === 'redflags'
              ? flagAnswers[i] === true
              : answers[i] === item.type

            return (
              <div className="arena-review-row" key={i}>
                {correct
                  ? <CheckCircle2 color="#659775" />
                  : <XCircle color="#c46e70" />}
                <div>
                  <strong>{item.title}</strong>
                  <p>{mode !== 'redflags'
                    ? `Your answer: ${answers[i] ?? 'Not answered'} · Correct: ${item.type}`
                    : flagAnswers[i] === true
                      ? 'All red flags identified'
                      : 'Some red flags were missed or incorrectly selected'}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <section className="arena-page">
      <div className="arena-heading">
        <span className="arena-kicker"><Swords size={15} /> DETECTIVE TRAINING GROUND</span>
        <h1>Trust the clues. Not the message.</h1>
        <p>Train your instincts with realistic situations and learn what to look for.</p>
      </div>

      <div className="arena-mode-select">
        <button
          className={mode === 'classify' ? 'active' : ''}
          onClick={() => resetRound('classify')}
        >
          <ShieldAlert size={19} />
          <span><strong>Scam or Safe?</strong><small>Make the call</small></span>
        </button>
        <button
          className={mode === 'redflags' ? 'active' : ''}
          onClick={() => resetRound('redflags')}
        >
          <Target size={19} />
          <span><strong>Find the Red Flags</strong><small>Tap suspicious phrases</small></span>
        </button>
        <button
          className={mode === 'timed' ? 'active' : ''}
          onClick={() => resetRound('timed')}
        >
          <Zap size={19} />
          <span><strong>30-Second Sprint</strong><small>Beat the clock</small></span>
        </button>
      </div>

      <div className="arena-mode-row">
        <span>
          {mode === 'redflags'
            ? <><Search size={16} /> RED FLAG HUNT</>
            : mode === 'timed'
              ? <><Zap size={16} /> 30-SECOND SPRINT</>
              : <><ShieldAlert size={16} /> SCAM OR SAFE?</>}
        </span>
        <span><Zap size={16} /> 20 XP per correct case</span>
      </div>

      {mode === 'timed' && (
        <div className={`arena-timer ${secondsLeft <= 10 ? 'urgent' : ''}`}>
          <span><Zap size={18} /> TIME LEFT</span>
          <strong>00:{String(secondsLeft).padStart(2, '0')}</strong>
        </div>
      )}

      <div className="arena-progress-meta">
        <span>CASE {index + 1} OF 6</span>
        <strong>{Math.round((index + (completed ? 1 : 0)) / 6 * 100)}% complete</strong>
      </div>
      <div className="arena-progress">
        <div style={{ width: `${(index + (completed ? 1 : 0)) / 6 * 100}%` }} />
      </div>

      <article className="arena-case">
        <div className="arena-case-top">
          <span>{current.category}</span>
          <small>CASE #{String(index + 1).padStart(2, '0')}</small>
        </div>
        <p className="arena-sender">{current.sender}</p>
        <h2>{current.title}</h2>

        <div className="arena-message">
          “{mode === 'redflags' ? renderFlagMessage() : current.message}”
        </div>

        {mode !== 'redflags' ? (
          <>
            <div className="arena-question">
              <Lightbulb size={19} /> What's your call, detective?
            </div>
            <div className="arena-choices">
              <button disabled={answer !== null} onClick={() => choose('Scam')}>
                <ShieldAlert size={22} />
                <strong>It's a scam</strong>
                <small>Something feels suspicious</small>
              </button>
              <button disabled={answer !== null} onClick={() => choose('Safe')}>
                <ShieldCheck size={22} />
                <strong>Looks safe</strong>
                <small>No clear scam indicators</small>
              </button>
            </div>

            {answer !== null && (
              <div className={`arena-feedback ${answer === current.type ? 'correct' : 'incorrect'}`}>
                <strong>{answer === current.type ? '✓ Correct call!' : `✕ Not quite — this is ${current.type.toLowerCase()}.`}</strong>
                <p><b>Clue:</b> {current.clue}</p>
                <p>{current.explanation}</p>
                <p><b>What to do:</b> {current.advice}</p>
                <b><Zap size={14} /> {answer === current.type ? '+20 XP' : '+0 XP'}</b>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="arena-question">
              <Target size={19} /> Tap every suspicious phrase in the message.
            </div>
            <p className="arena-flag-hint">
              {selectedFlags.length} phrase{selectedFlags.length === 1 ? '' : 's'} selected
              {current.flags.length === 0 ? ' · This message may have no red flags' : ''}
            </p>

            {flagSubmitted ? (
              <div className={`arena-feedback ${flagCorrect ? 'correct' : 'incorrect'}`}>
                <strong>{flagCorrect ? '✓ Excellent detective work!' : '✕ Not quite — review the clues.'}</strong>
                <p><b>What to look for:</b> {current.clue}</p>
                {current.flags.filter(flag => !selectedFlags.includes(flag)).length > 0 && (
                  <p><b>Missed clues:</b> {current.flags.filter(flag => !selectedFlags.includes(flag)).join(', ')}</p>
                )}
                {selectedFlags.filter(flag => current.decoys.some(item => item === flag)).length > 0 && (
                  <p><b>Harmless phrases selected:</b> {selectedFlags.filter(flag => current.decoys.some(item => item === flag)).join(', ')}</p>
                )}
                <p>{current.explanation}</p>
                <p><b>What to do:</b> {current.advice}</p>
                <b><Zap size={14} /> {flagCorrect ? '+20 XP' : '+0 XP'}</b>
              </div>
            ) : (
              <div className="arena-flag-submit">
                <button className="arena-primary" onClick={submitFlags}>
                  Submit findings <ArrowRight size={16} />
                </button>
                <small>Only select phrases that genuinely signal a risk. Some cases have no red flags.</small>
              </div>
            )}
          </>
        )}

        <div className="arena-card-footer">
          <span>Score: <b>{mode === 'redflags' ? flagScore : score} / 6</b></span>
          {completed && mode !== 'timed' && (
            <button className="arena-primary" onClick={next}>
              {index === 5 ? 'See results' : 'Next case'} <ArrowRight size={16} />
            </button>
          )}
          {completed && mode === 'timed' && (
            <span className="arena-sprint-advance">Next case...</span>
          )}
        </div>
      </article>

      {mode === 'timed' && (
        <p className="arena-timed-hint">
          Make a decision and move quickly. The round ends when the clock reaches zero.
        </p>
      )}

      <p className="arena-disclaimer">
        These are educational examples. Real messages need context. When unsure, verify through an independently found official channel.
      </p>
    </section>
  )
}

export default Arena
