


import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Home,
  Search,
  Swords,
  BookOpen,
  UserRound,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  Zap,
  Trophy,
  Target,
  Clock3,
  ChevronRight,
  Sparkles,
  LockKeyhole,
  ScanSearch,
  CircleHelp,
  Star,
  Menu,
  X,
} from 'lucide-react'
import './App.css'
import Investigate from './Investigate'
import Arena from './Arena'
import Learn from './Learn'
import Profile from './Profile'

type NavItem = 'Home' | 'Investigate' | 'Arena' | 'Learn' | 'Profile'

const navigation: { label: NavItem; icon: ReactNode }[] = [
  { label: 'Home', icon: <Home size={19} /> },
  { label: 'Investigate', icon: <Search size={19} /> },
  { label: 'Arena', icon: <Swords size={19} /> },
  { label: 'Learn', icon: <BookOpen size={19} /> },
  { label: 'Profile', icon: <UserRound size={19} /> },
]

function Stat({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <p>{label}</p>
        <h3>{value}</h3>
        <span>{detail}</span>
      </div>
    </div>
  )
}

function getLocalDateKey() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function App() {
  const [active, setActive] = useState<NavItem>('Home')
  const [rewardNotice, setRewardNotice] = useState<{
    title: string
    detail: string
    type: 'xp' | 'level'
  } | null>(null)
  
  const [totalXP, setTotalXP] = useState(() => {
    const saved = Number(localStorage.getItem('scamlens-xp'))
    return Number.isFinite(saved) && saved >= 240 ? saved : 240
  })
  const [arenaStats, setArenaStats] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('scamlens-arena-stats') || '{}')
      return {
        cases: Number(saved.cases) || 0,
        correct: Number(saved.correct) || 0,
      }
    } catch {
      return { cases: 0, correct: 0 }
    }
  })
  const [mobileMenu, setMobileMenu] = useState(false)
  const [lessonsCompleted] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('scamlens-learn-completed') || '[]')
      return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string').length : 0
    } catch {
      return 0
    }
  })
  const [dailyMissionCompleted, setDailyMissionCompleted] = useState(
    () => localStorage.getItem('scamlens-daily-mission-date') === getLocalDateKey()
  )
  const [selectedChallenge, setSelectedChallenge] = useState<number | null>(null)

  const navigate = (page: NavItem) => {
    setActive(page)
    setMobileMenu(false)
  }

      const awardXP = (amount: number, source: string) => {
    const updated = totalXP + amount
    const oldLevel = Math.min(Math.floor(totalXP / 200) + 1, 5)
    const newLevel = Math.min(Math.floor(updated / 200) + 1, 5)

    setTotalXP(updated)
    localStorage.setItem('scamlens-xp', String(updated))

    setRewardNotice(
      newLevel > oldLevel
        ? {
            title: `Level ${newLevel} unlocked!`,
            detail: 'Your detective skills are growing.',
            type: 'level',
          }
        : {
            title: `+${amount} XP earned`,
            detail: source,
            type: 'xp',
          }
    )
  }

  const addXP = (amount: number) => awardXP(amount, 'Lesson completed')

  const recordArenaRound = (result: { cases: number; correct: number; xp: number }) => {
    const todayKey = getLocalDateKey()
    const missionAlreadyCompleted =
      localStorage.getItem('scamlens-daily-mission-date') === todayKey
    const missionBonus = missionAlreadyCompleted ? 0 : 50

    if (!missionAlreadyCompleted) {
      localStorage.setItem('scamlens-daily-mission-date', todayKey)
      setDailyMissionCompleted(true)
    }

   awardXP(result.xp + missionBonus, missionBonus > 0
  ? `Arena round completed · includes +${missionBonus} daily bonus`
  : 'Arena round completed')

    setArenaStats(previous => {
      const updated = {
        cases: previous.cases + result.cases,
        correct: previous.correct + result.correct,
      }
      localStorage.setItem('scamlens-arena-stats', JSON.stringify(updated))
      return updated
    })

    return missionBonus
  }

  const accuracy = arenaStats.cases === 0
    ? '—'
    : `${Math.round((arenaStats.correct / arenaStats.cases) * 100)}%`

  const ranks = [
    'Rookie Detective',
    'Clue Finder',
    'Scam Tracker',
    'Cyber Investigator',
    'Scam Master',
  ]
  const level = Math.min(Math.floor(totalXP / 200) + 1, 5)
  const rank = ranks[level - 1]
  const levelProgress = totalXP >= 1000 ? 100 : (totalXP % 200) / 200 * 100
  const xpInLevel = totalXP >= 1000 ? 200 : totalXP % 200
  const progressText = totalXP >= 1000
    ? 'Maximum level reached'
    : `${xpInLevel} / 200 XP to next level`

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <ScanSearch size={25} />
          </div>
          <div>
            <h2>ScamLens</h2>
            <span>THE DETECTIVE CLUB</span>
          </div>
          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-label">YOUR WORKSPACE</div>
        <nav className="side-nav">
          {navigation.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${active === item.label ? 'active' : ''}`}
              onClick={() => navigate(item.label)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.label === 'Arena' && <span className="nav-new">NEW</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon"><Sparkles size={18} /></div>
            <h4>Stay one step ahead.</h4>
            <p>Every clue you learn makes the internet a little safer.</p>
            <button onClick={() => navigate('Learn')}>
              Explore tips <ArrowRight size={15} />
            </button>
          </div>
          <div className="sidebar-user">
            <div className="avatar">U</div>
            <div className="user-details">
              <strong>Detective</strong>
              <span>Rookie investigator</span>
            </div>
            <button aria-label="Open profile" onClick={() => navigate('Profile')}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenu(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <span className="breadcrumb">YOUR SPACE /</span>
              <strong>{active}</strong>
            </div>
          </div>
        </header>

        <div className="dashboard">
          {active === 'Home' ? (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><Sparkles size={14} /> YOUR DAILY BRIEFING</div>
                  <h1>Hey, Detective!</h1>
                  <p className="welcome-subtitle">
                    Ready to spot the clues others might miss?
                  </p>
                </div>
                <div className="date-chip">CASE FILE #001</div>
              </section>

              <section className="hero-card">
                <div className="hero-copy">
                  <span className="hero-tag"><ShieldCheck size={14} /> TODAY'S MISSION</span>
                  <h2>Trust your instincts.<br />Verify the clues.</h2>
                  <p>
                    A suspicious message has landed in your inbox.
                    Think you can uncover what's hiding behind it?
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => navigate('Investigate')}
                  >
                    Investigate a message <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="hero-art" aria-label="ScamLens detective mascot">
                  <div className="hero-spark spark-one">✦</div>
                  <div className="hero-spark spark-two">✧</div>
                  <div className="mascot-shadow" />
                  <div className="mascot">
                    <div className="mascot-hat" />
                    <div className="mascot-face">
                      <div className="mascot-eyes"><i /><i /></div>
                      <div className="mascot-nose" />
                      <div className="mascot-smile" />
                    </div>
                    <div className="mascot-coat" />
                    <div className="mascot-magnifier"><Search size={29} /></div>
                  </div>
                  <div className="mascot-note">Let's crack this case!</div>
                </div>
              </section>

              <section className="stats-grid">
                <Stat
                  icon={<Zap size={20} />}
                  label="TOTAL XP"
                  value={String(totalXP)}
                  detail="Earn XP in the Arena"
                />
                <Stat
                  icon={<Target size={20} />}
                  label="CASES SOLVED"
                  value={String(arenaStats.cases)}
                  detail="Cases completed in Arena"
                />
                <Stat
                  icon={<Trophy size={20} />}
                  label="ACCURACY"
                  value={accuracy}
                  detail="Correct Arena decisions"
                />
                <Stat
                  icon={<BookOpen size={20} />}
                  label="LESSONS COMPLETED"
                  value={String(lessonsCompleted)}
                  detail="Learning modules finished"
                />
              </section>

              <section className="dashboard-lower">
                <div className="progress-card">
                  <div className="section-heading">
                    <div>
                      <span className="section-kicker">YOUR JOURNEY</span>
                      <h3>Detective progress</h3>
                    </div>
                    <span className="level-pill">LEVEL {level}</span>
                  </div>
                  <div className="level-row">
                    <div className="level-avatar"><Search size={23} /></div>
                    <div>
                      <strong>{rank}</strong>
                      <p>{progressText}</p>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${levelProgress}%` }} />
                  </div>
                  <div className="progress-foot">
                    <span>Keep collecting clues!</span>
                    <strong>{Math.round(levelProgress)}%</strong>
                  </div>
                  <div className="achievement-row">
                    <div className="achievement-icon"><Star size={18} /></div>
                    <div>
                      <strong>First steps</strong>
                      <p>Your detective journey has begun.</p>
                    </div>
                    <span className="earned-label">EARNED</span>
                  </div>
                </div>

                <div className="mission-card">
                  <div className="section-heading">
                    <div>
                      <span className="section-kicker">DAILY CHALLENGE</span>
                      <h3>Today's mission</h3>
                    </div>
                    <span className="mission-icon"><Target size={20} /></span>
                  </div>
                  <div className="mission-illustration">
                    <div className="mission-paper">
                      <LockKeyhole size={25} />
                      <span>?</span>
                    </div>
                    <div>
                      <strong>Spot the fake job offer</strong>
                      <p>Finish all six cases to complete today's mission.</p>
                    </div>
                  </div>
                  <div className="mission-footer">
                    <span><Zap size={15} /> +50 XP reward</span>
                    <button
                      className={dailyMissionCompleted ? 'completed-button' : 'text-button'}
                      onClick={() => navigate('Arena')}
                    >
                      {dailyMissionCompleted ? 'Completed today' : 'Take challenge'} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </section>

              <section className="challenges-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">PICK YOUR NEXT MOVE</span>
                    <h3>Ready for a challenge?</h3>
                  </div>
                  <button className="view-all" onClick={() => navigate('Arena')}>
                    View all <ArrowRight size={15} />
                  </button>
                </div>
                <div className="challenge-grid">
                  <button
                    className={`challenge-card challenge-pink ${selectedChallenge === 1 ? 'challenge-selected' : ''}`}
                    onClick={() => {
                      setSelectedChallenge(1)
                      navigate('Arena')
                    }}
                  >
                    <div className="challenge-icon"><Swords size={23} /></div>
                    <span className="challenge-time"><Clock3 size={13} /> 2 MIN</span>
                    <h4>Scam or Safe?</h4>
                    <p>Test your instincts with real-world scenarios.</p>
                    <span className="challenge-link">Play now <ArrowUpRight size={15} /></span>
                  </button>
                  <button
                    className={`challenge-card challenge-yellow ${selectedChallenge === 2 ? 'challenge-selected' : ''}`}
                    onClick={() => {
                      setSelectedChallenge(2)
                      navigate('Learn')
                    }}
                  >
                    <div className="challenge-icon"><Search size={23} /></div>
                    <span className="challenge-time"><Clock3 size={13} /> 3 MIN</span>
                    <h4>Find the red flags</h4>
                    <p>Look closer. Every suspicious detail matters.</p>
                    <span className="challenge-link">Start hunt <ArrowUpRight size={15} /></span>
                  </button>
                  <button
                    className={`challenge-card challenge-purple ${selectedChallenge === 3 ? 'challenge-selected' : ''}`}
                    onClick={() => {
                      setSelectedChallenge(3)
                      navigate('Investigate')
                    }}
                  >
                    <div className="challenge-icon"><ScanSearch size={23} /></div>
                    <span className="challenge-time"><Clock3 size={13} /> 1 MIN</span>
                    <h4>Inspect a message</h4>
                    <p>Put your detective skills to work.</p>
                    <span className="challenge-link">Investigate <ArrowUpRight size={15} /></span>
                  </button>
                </div>
              </section>

              <section className="bottom-tip">
                <div className="bottom-tip-icon"><CircleHelp size={21} /></div>
                <div>
                  <strong>A little reminder</strong>
                  <p>Never share your OTP or UPI PIN with anyone — not even someone claiming to be from your bank.</p>
                </div>
                <button onClick={() => navigate('Learn')} aria-label="Learn more">
                  <ArrowUpRight size={19} />
                </button>
              </section>
            </>
          ) : active === 'Investigate' ? (
            <Investigate />
          ) : active === 'Arena' ? (
            <Arena onRoundComplete={recordArenaRound} />
          ) : active === 'Learn' ? (
            <Learn onLessonComplete={addXP} />
          ) : (
            <Profile
              totalXP={totalXP}
              rank={rank}
              level={level}
              levelProgress={levelProgress}
              xpInLevel={xpInLevel}
              cases={arenaStats.cases}
              correct={arenaStats.correct}
              onNavigate={navigate}
            />
          )}

          {rewardNotice && (
            <div className={`reward-toast ${rewardNotice.type === 'level' ? 'reward-toast-level' : ''}`} role="status">
              <div className="reward-toast-icon">
                {rewardNotice.type === 'level' ? <Trophy size={21} /> : <Zap size={21} />}
              </div>
              <div className="reward-toast-copy">
                <strong>{rewardNotice.title}</strong>
                <span>{rewardNotice.detail}</span>
              </div>
              <button
                className="reward-toast-close"
                onClick={() => setRewardNotice(null)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          )}

          <footer className="app-footer">
            <span>SCAMLENS © 2026</span>
            <span>Stay curious. Stay safe. <ShieldCheck size={14} /></span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
