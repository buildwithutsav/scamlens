import { useEffect, useState } from 'react'
import { recognize } from 'tesseract.js'
import {
  Search, ShieldAlert, ShieldCheck, AlertTriangle,
  Link2, KeyRound, Clock, CreditCard, UserRound,
  Trash2, ArrowRight, RotateCcw, Globe
} from 'lucide-react'
import './Investigate.css'

type Signal = {
  title: string
  explanation: string
  severity: 'high' | 'medium'
  icon: 'clock' | 'key' | 'payment' | 'link' | 'identity'
}

const rules: {
  pattern: RegExp
  signal: Omit<Signal, 'explanation'>
  explanation: string
}[] = [
  {
    pattern: /\b(urgent|immediately|right now|act now|within \d+ (minutes|hours)|account will be blocked|expire[sd] today)\b/i,
    signal: { title: 'Pressure or urgency', severity: 'medium', icon: 'clock' },
    explanation: 'The message pressures you to act quickly. Scammers often use urgency to stop people from verifying a request.'
  },
  {
    pattern: /\b(otp|one.time password|upi pin|password|cvv|card number|login credentials|verification code)\b/i,
    signal: { title: 'Sensitive information requested', severity: 'high', icon: 'key' },
    explanation: 'The message mentions sensitive credentials. Never share an OTP, UPI PIN, CVV or password with someone who contacts you.'
  },
  {
    pattern: /\b(pay now|processing fee|registration fee|security deposit|send money|transfer money|claim fee|payment required|upi payment)\b/i,
    signal: { title: 'Payment request', severity: 'high', icon: 'payment' },
    explanation: 'It appears to request money or a fee. Verify the organisation independently before making any payment.'
  },
  {
    pattern: /\b(click here|click the link|open this link|verify your account|update your kyc|kyc update|bit\.ly|tinyurl|t\.co)\b/i,
    signal: { title: 'Suspicious link or account verification', severity: 'medium', icon: 'link' },
    explanation: 'The message encourages clicking a link or verifying an account. Visit the official website yourself instead of following message links.'
  },
  {
    pattern: /\b(you have won|congratulations|lottery|prize money|lucky winner|free gift|cashback reward|claim your reward)\b/i,
    signal: { title: 'Unexpected reward or prize', severity: 'medium', icon: 'identity' },
    explanation: 'Unexpected prizes and rewards are commonly used as bait. Be suspicious if claiming them requires payment or personal information.'
  },
  {
    pattern: /\b(bank official|customer care|support team|police officer|government officer|income tax department|rbi|account suspended|arrest warrant)\b/i,
    signal: { title: 'Authority or organisation impersonation', severity: 'medium', icon: 'identity' },
    explanation: 'The sender refers to an institution or authority. The wording alone cannot verify who sent it—contact the organisation using an independently verified channel.'
  },
]

function SignalIcon({ type }: { type: Signal['icon'] }) {
  if (type === 'clock') return <Clock size={18} />
  if (type === 'key') return <KeyRound size={18} />
  if (type === 'payment') return <CreditCard size={18} />
  if (type === 'link') return <Link2 size={18} />
  return <UserRound size={18} />
}

export default function Investigate() {
  const [message, setMessage] = useState('')
  const [signals, setSignals] = useState<Signal[] | null>(null)
  const [analysed, setAnalysed] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlResult, setUrlResult] = useState<{ host: string; signals: Signal[] } | null>(null)
  const [urlError, setUrlError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState('')
  const [ocrError, setOcrError] = useState('')

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('')
      return
    }

    const previewUrl = URL.createObjectURL(imageFile)
    setImagePreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [imageFile])

  const extractScreenshotText = async () => {
    if (!imageFile || ocrBusy) return

    setOcrBusy(true)
    setOcrProgress(0)
    setOcrError('')
    setOcrStatus('Preparing screenshot...')

    try {
      const result = await recognize(imageFile, 'eng', {
        logger: info => {
          if (info.status) setOcrStatus(info.status)
          if (typeof info.progress === 'number') {
            setOcrProgress(Math.round(info.progress * 100))
          }
        },
      })

      const extracted = result.data.text.trim()

      if (!extracted) {
        setOcrError('No readable text was found. Try a clearer screenshot with larger text.')
        setOcrStatus('')
        return
      }

      setMessage(extracted)
      setSignals(null)
      setAnalysed(false)
      setOcrStatus('Text extracted. Review it below before analysing.')
      setOcrProgress(100)
    } catch {
      setOcrError('Text extraction failed. Try another image or paste the message manually.')
      setOcrStatus('')
    } finally {
      setOcrBusy(false)
    }
  }



  const analyseMessage = () => {
    if (!message.trim()) return

    const found: Signal[] = rules
      .filter(rule => rule.pattern.test(message))
      .map(rule => ({
        ...rule.signal,
        explanation: rule.explanation,
      }))

    if (/https?:\/\/|www\./i.test(message)) {
      if (!found.some(signal => signal.icon === 'link')) {
        found.push({
          title: 'Contains a web link',
          explanation: 'The message contains a URL. A link is not automatically malicious, but check the exact domain carefully before opening it.',
          severity: 'medium',
          icon: 'link',
        })
      }
    }

    setSignals(found)
    setAnalysed(true)
  }


  const analyseUrl = () => {
    setUrlError('')
    setUrlResult(null)

    const raw = urlInput.trim()
    if (!raw) return

    let parsed: URL

    try {
      parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`)
    } catch {
      setUrlError('This does not look like a valid URL. Check the spelling and try again.')
      return
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      setUrlError('Only HTTP and HTTPS web addresses can be inspected.')
      return
    }

    const host = parsed.hostname.toLowerCase().replace(/\.$/, '')
    const found: Signal[] = []

    const add = (title: string, explanation: string, severity: Signal['severity'], icon: Signal['icon']) => {
      found.push({ title, explanation, severity, icon })
    }

    if (parsed.username || parsed.password) {
      add(
        'Embedded login information',
        'This URL contains credentials before the hostname. That structure can be used to disguise the real destination.',
        'high',
        'key'
      )
    }

    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      add(
        'IP address used as the destination',
        'The link points directly to an IP address instead of a recognisable domain. This is unusual for many legitimate public-facing services.',
        'high',
        'link'
      )
    }

    const shorteners = [
      'bit.ly', 'tinyurl.com', 't.co', 'is.gd', 'cutt.ly',
      'shorturl.at', 'rebrand.ly', 'ow.ly'
    ]

    if (shorteners.some(domain => host === domain || host.endsWith(`.${domain}`))) {
      add(
        'URL shortener detected',
        'Shortened links hide the final destination. Do not open the link unless you can independently verify where it leads.',
        'medium',
        'link'
      )
    }

    const brands = [
      { name: 'Google', token: 'google', domains: ['google.com', 'google.co.in'] },
      { name: 'Microsoft', token: 'microsoft', domains: ['microsoft.com'] },
      { name: 'Apple', token: 'apple', domains: ['apple.com'] },
      { name: 'Amazon', token: 'amazon', domains: ['amazon.in', 'amazon.com'] },
      { name: 'SBI', token: 'sbi', domains: ['sbi.co.in', 'onlinesbi.sbi'] },
      { name: 'HDFC Bank', token: 'hdfc', domains: ['hdfcbank.com'] },
      { name: 'ICICI Bank', token: 'icici', domains: ['icicibank.com'] },
      { name: 'Paytm', token: 'paytm', domains: ['paytm.com'] },
      { name: 'PhonePe', token: 'phonepe', domains: ['phonepe.com'] },
      { name: 'Flipkart', token: 'flipkart', domains: ['flipkart.com'] },
    ]

    for (const brand of brands) {
      const legitimateDomain = brand.domains.some(
        domain => host === domain || host.endsWith(`.${domain}`)
      )

      const hasBrandLikeLabel = host.split('.').some(label =>
        label === brand.token ||
        label.startsWith(`${brand.token}-`) ||
        label.endsWith(`-${brand.token}`) ||
        label.includes(`${brand.token}-`) ||
        label.includes(`-${brand.token}`)
      )

      if (hasBrandLikeLabel && !legitimateDomain) {
        add(
          `Possible ${brand.name} impersonation`,
          `The hostname contains "${brand.name}" but does not use one of the recognised domains in this basic check. This may be an attempt to imitate the brand.`,
          'high',
          'identity'
        )
      }
    }

    if (host.startsWith('xn--') || host.split('.').some(label => label.startsWith('xn--'))) {
      add(
        'Internationalised domain encoding',
        'The hostname contains a punycode label. Some deceptive domains use visually similar characters to imitate familiar websites.',
        'medium',
        'link'
      )
    }

    if (/^http:$/.test(parsed.protocol)) {
      add(
        'Connection does not use HTTPS',
        'This URL uses HTTP rather than HTTPS, so the connection does not provide the usual transport encryption. HTTPS itself would not prove a site is legitimate.',
        'medium',
        'key'
      )
    }

    if (parsed.port && !['80', '443'].includes(parsed.port)) {
      add(
        'Unusual port number',
        'The URL specifies a non-standard web port. This is not automatically malicious, but it deserves extra scrutiny.',
        'medium',
        'link'
      )
    }

    if (/(login|signin|verify|verification|update-kyc|kyc|secure-account|password|wallet)/i.test(parsed.pathname + parsed.search)) {
      add(
        'Sensitive account action in URL',
        'The URL path or query refers to login, verification, KYC or account credentials. Check the destination independently before entering any information.',
        'medium',
        'key'
      )
    }


    setUrlResult({ host, signals: found })
  }

  const reset = () => {
    setMessage('')
    setSignals(null)
    setAnalysed(false)
  }

  const loadExample = () => {
    setMessage(
      'URGENT! Your bank account will be blocked today. Verify your KYC immediately by clicking this link and sharing your OTP to avoid suspension.'
    )
    setSignals(null)
    setAnalysed(false)
  }

  const highCount = signals?.filter(signal => signal.severity === 'high').length ?? 0
  const mediumCount = signals?.filter(signal => signal.severity === 'medium').length ?? 0

  const resultTitle =
    highCount > 0 ? 'High-risk warning signs found' :
    mediumCount > 0 ? 'Some warning signs found' :
    'No common warning signs detected'

  const resultDescription =
    highCount > 0
      ? 'This message contains serious warning signs. Do not share information or make payments based on it.'
      : mediumCount > 0
        ? 'This message contains patterns that deserve caution. Verify the sender and request independently.'
        : 'Our checks did not find the patterns covered by this basic scanner. That does not prove the message is genuine or safe.'

  return (
    <div className="investigate-page">
      <div className="investigate-heading">
        <div>
          <span className="section-kicker">SCAMLENS / CASE INVESTIGATION</span>
          <h1>Let's inspect the clues.</h1>
          <p>Got a suspicious message? Bring it here. We'll help you examine it.</p>
        </div>
        <div className="investigate-heading-icon"><Search size={25} /></div>
      </div>

      <section className="investigate-panel message-investigate-panel">
        <div className="case-file-stamp">CASE FILE 001 <span>MESSAGE EVIDENCE</span></div>
        <div className="investigate-panel-title">
          <div className="investigate-panel-icon"><ShieldAlert size={20} /></div>
          <div>
            <h2>Message investigation</h2>
            <p>SMS · WhatsApp · Email · Other text messages</p>
          </div>
        </div>

        <label htmlFor="message-input">Paste the message you want to inspect</label>
        <textarea
          id="message-input"
          value={message}
          onChange={event => {
            setMessage(event.target.value)
            setAnalysed(false)
            setSignals(null)
          }}
          placeholder="Paste the suspicious message here...

Example: Your account will be blocked. Click this link to verify your details..."
          maxLength={10000}
        />

        <div className="ocr-upload">
          <div className="ocr-upload-heading">
            <div>
              <strong>Have a screenshot instead?</strong>
              <p>Upload a message screenshot and extract its text locally.</p>
            </div>
            <span className="ocr-tag">OCR</span>
          </div>

          <label className="ocr-file-label" htmlFor="screenshot-input">
            <Search size={16} />
            {imageFile ? 'Choose a different screenshot' : 'Choose screenshot'}
          </label>
          <input
            id="screenshot-input"
            className="ocr-file-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp"
            disabled={ocrBusy}
            onChange={event => {
              const file = event.target.files?.[0] ?? null
              setOcrError('')
              setOcrStatus('')
              setOcrProgress(0)

              if (file && file.size > 10 * 1024 * 1024) {
                setOcrError('Image is too large. Please choose an image under 10 MB.')
                setImageFile(null)
                event.target.value = ''
                return
              }

              setImageFile(file)
            }}
          />

          {imagePreview && (
            <div className="ocr-preview-wrap">
              <img className="ocr-preview" src={imagePreview} alt="Screenshot selected for text extraction" />
              <span>{imageFile?.name}</span>
            </div>
          )}

          {ocrBusy && (
            <div className="ocr-progress" role="status" aria-live="polite">
              <div className="ocr-progress-copy">
                <span>{ocrStatus || 'Extracting text...'}</span>
                <strong>{ocrProgress}%</strong>
              </div>
              <div className="ocr-progress-track">
                <div className="ocr-progress-fill" style={{ width: `${ocrProgress}%` }} />
              </div>
            </div>
          )}

          {ocrStatus && !ocrBusy && <p className="ocr-status">{ocrStatus}</p>}
          {ocrError && <p className="ocr-error" role="alert">{ocrError}</p>}

          <button
            type="button"
            className="ocr-extract-button"
            onClick={extractScreenshotText}
            disabled={!imageFile || ocrBusy}
          >
            <Search size={16} />
            {ocrBusy ? 'Extracting text...' : 'Extract text from screenshot'}
          </button>
          <p className="ocr-disclaimer">
            English OCR only for now. Text recognition can make mistakes—check the extracted message before analysing it.
          </p>
        </div>

        <div className="investigate-input-footer">
          <span>{message.length.toLocaleString()} / 10,000 characters</span>
          <button className="example-button" onClick={loadExample}>
            Try an example <ArrowRight size={14} />
          </button>
        </div>

        <div className="privacy-note">
          <ShieldCheck size={17} />
          <span>Basic local analysis: your text is checked in this browser and is not sent to a server by this feature.</span>
        </div>

        <div className="investigate-actions">
          <button
            className="analyse-button"
            onClick={analyseMessage}
            disabled={!message.trim()}
          >
            <Search size={17} /> Analyse message
          </button>
          <button className="clear-button" onClick={reset}>
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </section>


      <section className="investigate-panel url-investigate-panel">
        <div className="investigate-panel-title">
          <div className="investigate-panel-icon url-panel-icon"><Globe size={20} /></div>
          <div>
            <h2>Website link investigation</h2>
            <p>Inspect a URL before opening it</p>
          </div>
        </div>

        <label htmlFor="url-input">Paste the website address</label>
        <input
          id="url-input"
          className="url-input"
          type="text"
          value={urlInput}
          onChange={event => {
            setUrlInput(event.target.value)
            setUrlResult(null)
            setUrlError('')
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') analyseUrl()
          }}
          placeholder="https://example.com"
          maxLength={2000}
          autoComplete="off"
          spellCheck={false}
        />

        <div className="privacy-note">
          <ShieldCheck size={17} />
          <span>This check runs locally in your browser. It does not open the website or verify its live reputation.</span>
        </div>

        {urlError && <p className="url-error" role="alert">{urlError}</p>}

        <div className="investigate-actions">
          <button className="analyse-button" onClick={analyseUrl} disabled={!urlInput.trim()}>
            <Search size={17} /> Analyse URL
          </button>
          <button
            className="clear-button"
            onClick={() => {
              setUrlInput('')
              setUrlResult(null)
              setUrlError('')
            }}
          >
            <Trash2 size={16} /> Clear
          </button>
        </div>

        {urlResult && (
          <div className="url-result" aria-live="polite">
            {(() => {
              const high = urlResult.signals.some(signal => signal.severity === 'high')
              const caution = urlResult.signals.length > 0 && !high

              return (
                <>
                  <div className={`url-verdict ${high ? 'url-verdict-high' : caution ? 'url-verdict-caution' : 'url-verdict-clear'}`}>
                    <span className="section-kicker">DOMAIN INSPECTION / COMPLETE</span>
                    <div className="url-verdict-main">
                      <div className="url-verdict-icon">
                        {high ? <ShieldAlert size={22} /> : caution ? <AlertTriangle size={22} /> : <Search size={22} />}
                      </div>
                      <div>
                        <h3>{high ? 'High-concern patterns found' : caution ? 'Some patterns need a closer look' : 'No matching warning patterns'}</h3>
                        <p>
                          {high
                            ? 'This address contains patterns commonly associated with deceptive links. Avoid entering information.'
                            : caution
                              ? 'Some URL characteristics deserve attention. Verify the destination independently.'
                              : 'The current checks did not match known warning patterns. This does not confirm that the website is safe.'}
                        </p>
                      </div>
                    </div>
                    <div className="url-verdict-meta">
                      <span>{urlResult.signals.length} {urlResult.signals.length === 1 ? 'finding' : 'findings'}</span>
                      <span>LOCAL RULE-BASED CHECK</span>
                    </div>
                  </div>

                  <div className="url-host">
                    <div className="url-host-top">
                      <span className="section-kicker">DESTINATION HOSTNAME</span>
                      <span className="url-protocol-tag">URL PARSED</span>
                    </div>
                    <strong>{urlResult.host}</strong>
                    <p>Hostname extracted from the address you entered</p>
                  </div>

                  <div className="url-evidence-heading">
                    <div>
                      <span className="section-kicker">INVESTIGATION NOTES</span>
                      <h3>{urlResult.signals.length ? 'Patterns detected' : 'No matching clues'}</h3>
                    </div>
                    <span className="rule-label">STRUCTURE ANALYSIS</span>
                  </div>

                  {urlResult.signals.length > 0 ? (
                    <div className="url-evidence-list">
                      {urlResult.signals.map((signal, index) => (
                        <article className="url-evidence-card" key={`${signal.title}-${index}`}>
                          <div className={`signal-icon signal-${signal.severity}`}>
                            <SignalIcon type={signal.icon} />
                          </div>
                          <div className="signal-copy">
                            <div className="signal-title-row">
                              <h4>{signal.title}</h4>
                              <span className={`signal-tag tag-${signal.severity}`}>
                                {signal.severity === 'high' ? 'HIGH CONCERN' : 'CAUTION'}
                              </span>
                            </div>
                            <p>{signal.explanation}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="url-no-findings">
                      <Search size={21} />
                      <div>
                        <strong>Nothing matched this rule set</strong>
                        <p>A newly created scam domain or a convincing imitation may not trigger these checks.</p>
                      </div>
                    </div>
                  )}

                  <div className="url-limit-note">
                    <ShieldCheck size={16} />
                    <p>These checks inspect URL structure only. They do not contact the website, check its ownership, query live threat-intelligence databases, or guarantee safety. HTTPS is not proof of legitimacy.</p>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </section>

      {analysed && signals && (
        <section className="investigation-result" aria-live="polite">
          <div className={`result-banner ${highCount ? 'result-high' : mediumCount ? 'result-medium' : 'result-unknown'}`}>
            <div className="result-banner-icon">
              {highCount ? <ShieldAlert size={23} /> : mediumCount ? <AlertTriangle size={23} /> : <Search size={23} />}
            </div>
            <div>
              <span className="section-kicker">INVESTIGATION SUMMARY</span>
              <h2>{resultTitle}</h2>
              <p>{resultDescription}</p>
            </div>
          </div>

          <div className="result-counts">
            <div><strong>{signals.length}</strong><span>Signals found</span></div>
            <div><strong>{highCount}</strong><span>High concern</span></div>
            <div><strong>{mediumCount}</strong><span>Needs caution</span></div>
          </div>

          <div className="signals-heading">
            <div>
              <span className="section-kicker">THE EVIDENCE</span>
              <h3>{signals.length ? 'Clues we noticed' : 'No matching clues'}</h3>
            </div>
            <span className="rule-label">Rule-based checks</span>
          </div>

          {signals.length ? (
            <div className="signals-list">
              {signals.map((signal, index) => (
                <article className="signal-card" key={`${signal.title}-${index}`}>
                  <div className={`signal-icon signal-${signal.severity}`}>
                    <SignalIcon type={signal.icon} />
                  </div>
                  <div className="signal-copy">
                    <div className="signal-title-row">
                      <h4>{signal.title}</h4>
                      <span className={`signal-tag tag-${signal.severity}`}>
                        {signal.severity === 'high' ? 'HIGH CONCERN' : 'CAUTION'}
                      </span>
                    </div>
                    <p>{signal.explanation}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="no-signals">
              <Search size={22} />
              <p>No patterns from the current rule set matched this message. New scam techniques may not be detected.</p>
            </div>
          )}

          <div className="safety-advice">
            <h3><ShieldCheck size={18} /> What should you do?</h3>
            <ul>
              <li>Do not share OTPs, passwords, UPI PINs or card details.</li>
              <li>Do not pay fees or transfer money under pressure.</li>
              <li>Verify claims using the organisation's official app, website or phone number.</li>
              <li>Do not open unexpected links or attachments.</li>
              <li>If you have already lost money in India, contact your bank immediately and report cyber fraud at 1930 or cybercrime.gov.in.</li>
            </ul>
          </div>

          <button className="scan-again-button" onClick={reset}>
            <RotateCcw size={16} /> Investigate another message
          </button>
        </section>
      )}

      <div className="investigate-disclaimer">
        <AlertTriangle size={16} />
        <p><strong>Important:</strong> This is an educational first-pass scanner, not a definitive fraud detector. It checks message wording against a limited set of patterns. A real scam may not trigger any warning, and a legitimate message may contain similar wording. Always verify independently.</p>
      </div>
    </div>
  )
}
