import { useState } from 'react'
import {
  ShieldCheck, Trophy, Target, BookOpen, Star,
  LockKeyhole, CheckCircle2, ArrowRight, Sparkles,
} from 'lucide-react'
import './Profile.css'

type Props = {
  totalXP: number
  rank: string
  level: number
  levelProgress: number
  xpInLevel: number
  cases: number
  correct: number
  onNavigate: (page: 'Arena' | 'Learn' | 'Investigate') => void
}

export default function Profile({
  totalXP, rank, level, levelProgress, xpInLevel,
  cases, correct, onNavigate,
}: Props) {
  const [completedLessons] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('scamlens-learn-completed') || '[]')
    } catch {
      return []
    }
  })

  const [unlockedAchievements] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('scamlens-achievements') || '[]')
      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  })

  const accuracy = cases ? Math.round(correct / cases * 100) : null

  const achievements = [
    {
      title: 'First Lesson',
      description: 'Complete your first learning lesson',
      earned: unlockedAchievements.includes('First Lesson'),
      icon: <BookOpen />,
    },
    {
      title: 'Case Solver',
      description: 'Complete your first Arena round',
      earned: unlockedAchievements.includes('Case Solver'),
      icon: <Target />,
    },
    {
      title: 'Sharp Eye',
      description: 'Reach 80% accuracy across at least 5 cases',
      earned: unlockedAchievements.includes('Sharp Eye'),
      icon: <ShieldCheck />,
    },
    {
      title: 'Knowledge Keeper',
      description: 'Complete all 4 learning lessons',
      earned: unlockedAchievements.includes('Knowledge Keeper'),
      icon: <Star />,
    },
    {
      title: 'ScamLens Master',
      description: 'Earn 1,000 XP',
      earned: unlockedAchievements.includes('ScamLens Master'),
      icon: <Trophy />,
    },
  ]

  const earnedCount = achievements.filter(item => item.earned).length

  return (
    <section className="profile-page">
      <header className="profile-heading">
        <div>
          <span className="section-kicker">SCAMLENS / YOUR JOURNEY</span>
          <h1>Your detective profile.</h1>
          <p>Every lesson and every case makes you harder to fool.</p>
        </div>
        <div className="profile-heading-icon"><ShieldCheck size={27} /></div>
      </header>

      <section className="profile-hero">
        <div className="profile-avatar"><ShieldCheck size={43} /></div>
        <div className="profile-identity">
          <span className="profile-eyebrow">YOUR DETECTIVE RANK</span>
          <h2>{rank}</h2>
          <p>Level {level} · ScamLens Detective</p>
        </div>
        <div className="profile-xp-pill"><Sparkles size={16} /> {totalXP.toLocaleString()} XP</div>
      </section>

      <section className="profile-level-card">
        <div className="profile-level-top">
          <div>
            <span className="profile-eyebrow">LEVEL PROGRESS</span>
            <h3>Keep investigating.</h3>
          </div>
          <strong>LEVEL {level}</strong>
        </div>
        <div className="profile-progress-track">
          <span style={{ width: `${levelProgress}%` }} />
        </div>
        <div className="profile-progress-label">
          <span>{totalXP >= 1000 ? 'Maximum level reached' : `${xpInLevel} / 200 XP`}</span>
          <span>{Math.round(levelProgress)}%</span>
        </div>
      </section>

      <div className="profile-stats-grid">
        <article className="profile-stat">
          <div className="profile-stat-icon xp"><Sparkles size={20} /></div>
          <span>Total XP</span>
          <strong>{totalXP.toLocaleString()}</strong>
          <small>Experience earned</small>
        </article>
        <article className="profile-stat">
          <div className="profile-stat-icon cases"><Target size={20} /></div>
          <span>Cases attempted</span>
          <strong>{cases}</strong>
          <small>Across Arena rounds</small>
        </article>
        <article className="profile-stat">
          <div className="profile-stat-icon accuracy"><ShieldCheck size={20} /></div>
          <span>Arena accuracy</span>
          <strong>{accuracy === null ? '—' : `${accuracy}%`}</strong>
          <small>{accuracy === null ? 'Play a round to begin' : `${correct} correct answers`}</small>
        </article>
        <article className="profile-stat">
          <div className="profile-stat-icon lessons"><BookOpen size={20} /></div>
          <span>Lessons completed</span>
          <strong>{completedLessons.length}/4</strong>
          <small>Learning progress</small>
        </article>
      </div>

      <section className="profile-achievements">
        <div className="profile-section-heading">
          <div>
            <span className="section-kicker">MILESTONES</span>
            <h2>Your achievements</h2>
          </div>
          <span className="profile-earned-count">{earnedCount}/{achievements.length} earned</span>
        </div>

        <div className="profile-achievement-grid">
          {achievements.map(item => (
            <article className={`profile-achievement ${item.earned ? 'earned' : 'locked'}`} key={item.title}>
              <div className="achievement-icon">{item.earned ? item.icon : <LockKeyhole />}</div>
              <div className="achievement-copy">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <span>{item.earned ? <><CheckCircle2 size={13} /> Earned</> : 'Not unlocked yet'}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-next-step">
        <div className="profile-next-icon"><Trophy size={23} /></div>
        <div>
          <span className="profile-eyebrow">YOUR NEXT MOVE</span>
          <h3>{completedLessons.length < 4 ? 'Build your cyber awareness.' : cases < 5 ? 'Put your knowledge to the test.' : 'Keep sharpening your instincts.'}</h3>
          <p>{completedLessons.length < 4 ? 'Finish the remaining lessons to earn your Knowledge Keeper achievement.' : 'Practice spotting suspicious patterns and improve your detective accuracy.'}</p>
        </div>
        <button onClick={() => onNavigate(completedLessons.length < 4 ? 'Learn' : 'Arena')}>
          Continue <ArrowRight size={16} />
        </button>
      </section>
    </section>
  )
}
