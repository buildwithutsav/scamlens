import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Swords, ShieldAlert, ShieldCheck, Zap, Trophy,
  CheckCircle2, XCircle, ArrowRight, RotateCcw,
  Lightbulb, Target, Search
} from 'lucide-react'
import scammerCharacter from './assets/scammer.svg'
import detectiveCharacter from './assets/detective.svg'
import './Arena.css'

type Case = {
  type: 'Scam' | 'Safe'
  category: string
  incident: string
  briefing: string
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH'
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
    incident: 'Suspected account takeover',
    briefing: 'A sender threatens to block a bank account unless the recipient follows an unexpected link and shares a one-time password.',
    riskLevel: 'HIGH',
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
    incident: 'Routine transaction verification',
    briefing: 'A transaction alert asks the recipient to check an unfamiliar charge through their own banking app or the number printed on their card.',
    riskLevel: 'LOW',
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
    incident: 'Suspicious recruitment offer',
    briefing: 'A recruiter promises unusually high daily earnings without an interview and requests an upfront registration payment.',
    riskLevel: 'HIGH',
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
    incident: 'Unexpected UPI credit',
    briefing: 'A payment notification claims money has arrived. Verify whether the credit appears in the recipient’s own payment app, without requesting a PIN.',
    riskLevel: 'LOW',
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
    incident: 'Advance-fee prize claim',
    briefing: 'An unexpected prize announcement demands processing charges under a tight deadline before the supposed reward can be claimed.',
    riskLevel: 'HIGH',
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
    incident: 'Two-factor authentication reminder',
    briefing: 'A password manager recommends stronger account protection and directs the recipient to open the app independently.',
    riskLevel: 'LOW',
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
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)
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
    setSelectedMode(nextMode)
    setIndex(0)
    setAnswers(Array(6).fill(null))
    setSelectedFlags([])
    setFlagAnswers(Array(6).fill(null))
    setFlagSubmitted(false)
    setFinished(false)
    setTotalAwardedXP(0)
    setSecondsLeft(30)
    setTimerStarted(false)
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

  function backToBoard() {
    setSelectedMode(null)
    setFinished(false)
    setTimerStarted(false)
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
      const isRealFlag = current.flags.includes(phrase)
      const resultClass = flagSubmitted
        ? isRealFlag
          ? selected ? 'revealed' : 'missed'
          : selected ? 'false-alarm' : ''
        : selected ? 'selected' : ''

      segments.push(
        <button
          key={`${index}-${i}`}
          type="button"
          className={`arena-flag ${resultClass}`}
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


  if (selectedMode === null) {
    return (
      <section className="arena-page arena-board">
        <div className="arena-board-hero">
          <div className="arena-board-copy">
            <span className="arena-kicker"><Swords size={15} /> THE DETECTIVE CLUB · TRAINING HQ</span>
            <h1>Your next case<br />starts here.</h1>
            <p>Every message leaves clues. Examine the evidence, trust your instincts, and stop the scam before it strikes.</p>
            <div className="arena-board-stamp"><ShieldCheck size={16} /> 3 TRAINING MISSIONS AVAILABLE</div>
          </div>
          <div className="arena-board-mascot" aria-label="Detective mascot">
            <img src={detectiveCharacter} alt="ScamLens cartoon detective holding a magnifying glass" />
          </div>
          <div className="arena-board-doodle" aria-hidden="true">?</div>
        </div>

        <div className="arena-board-section-heading">
          <div>
            <span className="arena-kicker">YOUR CASE FILES</span>
            <h2>Choose your investigation</h2>
          </div>
          <span className="arena-board-count">03 MISSIONS</span>
        </div>

        <div className="arena-missions">
          <button className="arena-mission mission-pink" onClick={() => resetRound('classify')}>
            <span className="arena-mission-number">CASE 01</span>
            <span className="arena-mission-art"><ShieldAlert size={43} /></span>
            <span className="arena-mission-tag">BEGINNER · 6 CASES</span>
            <strong>Scam or Safe?</strong>
            <span className="arena-mission-description">Can you tell a genuine message from a clever trap?</span>
            <span className="arena-mission-cta">Start investigating <ArrowRight size={16} /></span>
          </button>

          <button className="arena-mission mission-yellow" onClick={() => resetRound('redflags')}>
            <span className="arena-mission-number">CASE 02</span>
            <span className="arena-mission-art"><Target size={43} /></span>
            <span className="arena-mission-tag">OBSERVATION · 6 CASES</span>
            <strong>Find the Red Flags</strong>
            <span className="arena-mission-description">Inspect suspicious messages and uncover every warning sign.</span>
            <span className="arena-mission-cta">Examine the evidence <ArrowRight size={16} /></span>
          </button>

          <button className="arena-mission mission-lavender" onClick={() => resetRound('timed')}>
            <span className="arena-mission-number">CASE 03</span>
            <span className="arena-mission-art"><Zap size={43} /></span>
            <span className="arena-mission-tag">TIME ATTACK · 30 SECONDS</span>
            <strong>30-Second Sprint</strong>
            <span className="arena-mission-description">Six quick decisions. The clock is ticking. Stay sharp.</span>
            <span className="arena-mission-cta">Beat the clock <ArrowRight size={16} /></span>
          </button>
        </div>

        <div className="arena-board-tip">
          <span className="arena-board-tip-icon"><Lightbulb size={21} /></span>
          <div>
            <strong>Detective's reminder</strong>
            <p>Real organisations won't ask you to share an OTP, UPI PIN, or password. When in doubt, verify independently.</p>
          </div>
        </div>
      </section>
    )
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
          <div className="arena-character-wrap">
            <span className="arena-scene-stamp">SUSPECT IDENTIFIED</span>
            <div className="arena-scammer-speech">You caught me!</div>
            <img
              className="arena-scammer-art"
              src={scammerCharacter}
              alt="Cartoon scammer holding a suspicious briefcase"
            />
          </div>
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
          <button className="arena-back-button arena-result-back" onClick={backToBoard}>
            <ArrowRight size={15} /> Back to case board
          </button>
        </div>

        <div className="arena-review">
          <h3>Case review</h3>
          {cases.map((item, i) => {
            const correct = mode === 'redflags'
              ? flagAnswers[i] === true
              : answers[i] === item.type

            return (
              <div
                className={`arena-review-row ${correct ? 'is-correct' : 'is-incorrect'}`}
                key={i}
              >
                <span className="arena-review-number">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="arena-review-copy">
                  <div className="arena-review-title">
                    <strong>{item.title}</strong>
                    <span className={`arena-review-status ${correct ? 'solved' : 'missed'}`}>
                      {correct ? 'CASE SOLVED' : 'MISSED'}
                    </span>
                  </div>

                  <p>{mode !== 'redflags'
                    ? `Your answer: ${answers[i] ?? 'Not answered'} · Correct: ${item.type}`
                    : flagAnswers[i] === true
                      ? 'You identified every suspicious phrase'
                      : 'Some red flags were missed or incorrectly selected'}</p>
                </div>

                <span className="arena-review-icon">
                  {correct
                    ? <CheckCircle2 size={20} />
                    : <XCircle size={20} />}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  if (mode === 'timed' && !timerStarted) {
    return (
      <section className="arena-page sprint-intro-page">
        <button className="arena-back-button" onClick={backToBoard}>
          <ArrowRight size={15} /> Back to case board
        </button>

        <div className="sprint-intro">
          <div className="sprint-intro-topline">
            <span><Zap size={15} /> SCAMLENS ARCADE</span>
            <span>CHALLENGE 03</span>
          </div>

          <div className="sprint-intro-art">
            <div className="sprint-intro-orbit sprint-orbit-one" />
            <div className="sprint-intro-orbit sprint-orbit-two" />
            <img src={detectiveCharacter} alt="ScamLens detective ready for the challenge" />
            <span className="sprint-intro-burst">30<br />SEC</span>
          </div>

          <span className="sprint-intro-kicker">READY, DETECTIVE?</span>
          <h1>LIGHTNING<br /><span>ROUND.</span></h1>
          <p className="sprint-intro-description">
            Six messages. One ticking clock. Trust your instincts and make every second count.
          </p>

          <div className="sprint-rules">
            <div><strong>06</strong><span>CASES</span></div>
            <div><strong>30s</strong><span>ON THE CLOCK</span></div>
            <div><strong>+20</strong><span>XP / CORRECT</span></div>
          </div>

          <button className="sprint-start-button" onClick={() => setTimerStarted(true)}>
            <Zap size={20} /> START SPRINT <ArrowRight size={19} />
          </button>
          <span className="sprint-intro-footnote">
            <ShieldCheck size={14} /> The timer begins when you press start.
          </span>
        </div>
      </section>
    )
  }

  return (
    <section className={`arena-page arena-mode-${mode}`}>
      <button className="arena-back-button" onClick={backToBoard}>
        <ArrowRight size={15} /> Back to case board
      </button>
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
        <div className="sprint-hud">
          <div className={`arena-timer ${secondsLeft <= 10 ? 'urgent' : ''}`}>
            <span><Zap size={18} /> TIME LEFT</span>
            <strong>00:{String(secondsLeft).padStart(2, '0')}</strong>
          </div>
          <div className="sprint-scoreboard">
            <span>YOUR SCORE</span>
            <strong>{score}<small> / 6</small></strong>
            <em>{score * 20} XP EARNED</em>
          </div>
        </div>
      )}

      <div className="arena-progress-meta">
        <span>CASE {index + 1} OF 6</span>
        <strong>{Math.round((index + (completed ? 1 : 0)) / 6 * 100)}% complete</strong>
      </div>
      <div className="arena-progress">
        <div style={{ width: `${(index + (completed ? 1 : 0)) / 6 * 100}%` }} />
      </div>

      <article className={`arena-case arena-game-shell arena-game-${mode}`}>
        {mode === 'classify' && (
          <div className="arena-phone-header">
            <strong>Question {index + 1} <span>of 6</span></strong>
            <span className="arena-phone-label">SCAMLENS CASE</span>
          </div>
        )}
        <div className={mode === 'classify'
          ? 'arena-phone-screen arena-screen-classify'
          : mode === 'redflags'
            ? 'investigation-room'
            : 'sprint-arena'
        }>
        {mode === 'timed' && (
          <div className="sprint-round-banner">
            <span className="sprint-round-icon"><Zap size={19} /></span>
            <div>
              <strong>LIGHTNING ROUND</strong>
              <small>Trust your instincts. Decide fast.</small>
            </div>
            <span className="sprint-round-number">ROUND {index + 1}/6</span>
          </div>
        )}

        <div className="arena-case-top">
          <span className="arena-case-category">{current.category}</span>
          <small><span className="arena-case-file-dot" /> CASE FILE #{String(index + 1).padStart(2, '0')}</small>
        </div>
        {mode === 'redflags' && (
          <div className="investigation-steps">
            <div className="investigation-step active">
              <span>01</span>
              <strong>Inspect</strong>
            </div>
            <div className="investigation-step-line" />
            <div className={`investigation-step ${selectedFlags.length > 0 ? 'active' : ''}`}>
              <span>02</span>
              <strong>Collect</strong>
            </div>
            <div className="investigation-step-line" />
            <div className={`investigation-step ${flagSubmitted ? 'active' : ''}`}>
              <span>03</span>
              <strong>Report</strong>
            </div>
          </div>
        )}

        <div className="investigation-workspace">
          <aside className="investigation-panel dossier-panel">
        {mode === 'redflags' && (
          <section className="case-briefing">
            <div className="case-briefing-top">
              <span><Search size={14} /> INVESTIGATION BRIEFING</span>
              <span className={`case-difficulty risk-${current.riskLevel.toLowerCase()}`}>{current.riskLevel} RISK</span>
            </div>
            <div className="case-briefing-main">
              <div className="case-briefing-number">
                <small>INCIDENT</small>
                <strong>#{String(index + 1).padStart(3, '0')}</strong>
              </div>
              <div>
                <h3>{current.incident}</h3>
                <p>{current.briefing}</p>
              </div>
            </div>
            <div className="case-briefing-source">
              <span>SOURCE UNDER INVESTIGATION</span>
              <strong>{current.sender}</strong>
            </div>
          </section>
        )}

          </aside>
          <section className="investigation-panel message-panel">
        <div className={mode === 'timed' ? 'arena-sender-card sprint-sender-card' : 'arena-sender-card'}>
          <div className="arena-chat-avatar" aria-hidden="true">
            <span className="avatar-hair" />
            <span className="avatar-face">
              <i />
              <i />
            </span>
            <span className="avatar-body" />
          </div>
          <div className="arena-sender-details">
            <span>INCOMING MESSAGE</span>
            <strong>{current.sender}</strong>
          </div>
          <span className="arena-sender-dot" aria-label="New message" />
        </div>
        <h2>{current.title}</h2>

        <div className="arena-chat">
          <div className="arena-message-wrap">
            <div className="arena-message">
              {mode === 'redflags' ? renderFlagMessage() : current.message}
            </div>
            <span className="arena-message-time">MESSAGE PREVIEW · JUST NOW</span>
          </div>
        </div>

        {mode === 'redflags' && flagSubmitted && (
          <div className="evidence-legend">
            <span><i className="legend-genuine" /> Genuine warning sign</span>
            <span><i className="legend-missed" /> Missed clue</span>
            <span><i className="legend-decoy" /> Harmless detail selected</span>
          </div>
        )}

        </section>
          <aside className="investigation-panel evidence-panel">
        {mode !== 'redflags' ? (
          <>
            <div className={mode === 'timed' ? 'arena-question sprint-question' : 'arena-question'}>
              {mode === 'timed'
                ? <><Zap size={19} /> QUICK! SCAM OR SAFE?</>
                : <><Lightbulb size={19} /> What's your call, detective?</>}
            </div>
            <div className={mode === 'timed' ? 'arena-choices sprint-choices' : 'arena-choices'}>
              <button
                className={answer === 'Scam'
                  ? current.type === 'Scam' ? 'chosen correct-choice' : 'chosen incorrect-choice'
                  : ''}
                disabled={answer !== null}
                onClick={() => choose('Scam')}
              >
                <ShieldAlert size={22} />
                <strong>SCAM!</strong>
                <small>Suspicious message</small>
              </button>
              <button
                className={answer === 'Safe'
                  ? current.type === 'Safe' ? 'chosen correct-choice' : 'chosen incorrect-choice'
                  : ''}
                disabled={answer !== null}
                onClick={() => choose('Safe')}
              >
                <ShieldCheck size={22} />
                <strong>SAFE!</strong>
                <small>No clear warning signs</small>
              </button>
            </div>

            {answer !== null && (
              <div className={`arena-verdict ${answer === current.type ? 'correct' : 'incorrect'}`}>
                <div className="arena-verdict-heading">
                  <div className="arena-verdict-icon">
                    {answer === current.type
                      ? <CheckCircle2 size={27} />
                      : <XCircle size={27} />}
                  </div>
                  <div>
                    <span className="arena-verdict-kicker">CASE VERDICT</span>
                    <strong>{answer === current.type ? 'Brilliant detective work!' : 'Case needs another look!'}</strong>
                    <small>
                      {answer === current.type
                        ? 'You spotted the message correctly.'
                        : `This message is ${current.type.toLowerCase()}.`}
                    </small>
                  </div>
                  <div className="arena-verdict-xp">
                    <Zap size={15} />
                    {answer === current.type ? '+20' : '+0'} XP
                  </div>
                </div>

                <div className="arena-verdict-clue">
                  <span><Lightbulb size={16} /> THE KEY CLUE</span>
                  <p>{current.clue}</p>
                </div>

                <div className="arena-verdict-detail">
                  <strong>Why it matters</strong>
                  <p>{current.explanation}</p>
                </div>

                <div className="arena-verdict-advice">
                  <ShieldCheck size={19} />
                  <div>
                    <strong>Detective's takeaway</strong>
                    <p>{current.advice}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="evidence-briefing">
              <div className="evidence-briefing-icon"><Search size={21} /></div>
              <div>
                <span>YOUR OBJECTIVE</span>
                <strong>Examine the evidence</strong>
                <p>Tap suspicious details in this message to collect clues. Watch out for misleading details.</p>
              </div>
            </div>

            <div className="evidence-toolbar">
              <span><Target size={15} /> EVIDENCE COLLECTION</span>
              <strong>{selectedFlags.length} CLUES MARKED</strong>
            </div>

            <div className="evidence-board">
              <div className="evidence-board-heading">
                <span>CASE EVIDENCE</span>
                <small>{current.flags.filter(flag => selectedFlags.includes(flag)).length} / {current.flags.length} genuine clues found</small>
              </div>
              {selectedFlags.length > 0 ? (
                <div className="evidence-collected">
                  {selectedFlags.map((flag, i) => (
                    <div className="evidence-chip" key={flag}>
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      <strong>{flag}</strong>
                      {!flagSubmitted && (
                        <button type="button" onClick={() => toggleFlag(flag)} aria-label={`Remove ${flag}`}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="evidence-empty">No evidence collected yet. Inspect the message above and mark suspicious details.</p>
              )}
            </div>

            <p className="arena-flag-hint">
              Select every genuine warning sign. Some details may be harmless.
            </p>

            {flagSubmitted ? (
              <div className={`arena-feedback ${flagCorrect ? 'correct' : 'incorrect'}`}>
                <strong>{flagCorrect ? '✓ Excellent detective work!' : '✕ Not quite — review the clues.'}</strong>
                <p><b>What to look for:</b> {current.clue}</p>

                <div className="case-verdict-seal">
                  <div className="case-verdict-seal-icon">
                    {flagCorrect ? <ShieldCheck size={25} /> : <Search size={25} />}
                  </div>
                  <div className="case-verdict-seal-copy">
                    <span>CLUE DETECTION</span>
                    <strong>{current.flags.filter(flag => selectedFlags.includes(flag)).length} / {current.flags.length} clues found</strong>
                    <small>
                      {current.flags.filter(flag => !selectedFlags.includes(flag)).length} missed
                      {' · '}
                      {selectedFlags.filter(flag => !current.flags.includes(flag)).length} false alarms
                    </small>
                  </div>
                  <span className={`case-verdict-stamp ${flagCorrect ? 'perfect' : ''}`}>
                    {flagCorrect ? 'SOLVED' : 'REVIEW'}
                  </span>
                </div>

                <div className="evidence-verdict-list">
                  <strong>YOUR EVIDENCE REPORT</strong>
                  {selectedFlags.map(flag => {
                    const genuine = current.flags.includes(flag)
                    return (
                      <div className={`evidence-verdict-item ${genuine ? 'genuine' : 'decoy'}`} key={flag}>
                        {genuine ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        <span>{flag}</span>
                        <b>{genuine ? 'GENUINE CLUE' : 'HARMLESS DETAIL'}</b>
                      </div>
                    )
                  })}
                  {current.flags.filter(flag => !selectedFlags.includes(flag)).map(flag => (
                    <div className="evidence-verdict-item missed" key={flag}>
                      <Target size={16} />
                      <span>{flag}</span>
                      <b>MISSED CLUE</b>
                    </div>
                  ))}
                  {selectedFlags.length === 0 && current.flags.length === 0 && (
                    <p className="evidence-perfect-note">No suspicious evidence found — this was a clean message.</p>
                  )}
                </div>

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

          </aside>
        </div>

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
