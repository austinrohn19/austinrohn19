import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const DEMO_ACCOUNTS = [
  { email: 'austin@luxelend.test', label: 'Austin R. — renter with seeded history' },
  { email: 'marcus@luxelend.test', label: 'Marcus T. — owner of the Rolex Daytona' },
  { email: 'priya@luxelend.test', label: 'Priya S. — owner of the Hermès Birkin' },
]
const DEMO_PASSWORD = 'luxelend123'

export default function Login() {
  const { login, signup } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [locationField, setLocationField] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await signup({ name, email, password, location: locationField })
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function quickLogin(demoEmail: string) {
    setError(null)
    setBusy(true)
    try {
      await login(demoEmail, DEMO_PASSWORD)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 460, paddingBottom: 70 }}>
      <div className="page-head" style={{ textAlign: 'center' }}>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p>
          {mode === 'login'
            ? 'Sign in to rent, list items and see your history.'
            : 'One account to rent and to list — free to join.'}
        </p>
      </div>

      <div className="panel">
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <>
              <div className="field">
                <label>
                  Full name <span className="req">*</span>
                </label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Lee" autoComplete="name" />
              </div>
              <div className="field">
                <label>Location</label>
                <input
                  value={locationField}
                  onChange={(e) => setLocationField(e.target.value)}
                  placeholder="e.g. Brooklyn, NY"
                />
              </div>
            </>
          )}
          <div className="field">
            <label>
              Email <span className="req">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>
              Password <span className="req">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <div className="notice notice-red">{error}</div>}

          <button className="btn btn-gold" type="submit" disabled={busy}>
            {busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="divider" />
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5, textAlign: 'center', margin: 0 }}>
          {mode === 'login' ? (
            <>
              New to LuxeLend?{' '}
              <a
                href="#signup"
                onClick={(e) => {
                  e.preventDefault()
                  setMode('signup')
                  setError(null)
                }}
                style={{ color: 'var(--gold-bright)' }}
              >
                Create an account
              </a>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault()
                  setMode('login')
                  setError(null)
                }}
                style={{ color: 'var(--gold-bright)' }}
              >
                Sign in
              </a>
            </>
          )}
        </p>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h3 style={{ fontSize: 18 }}>Try a demo account</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>
          All demo accounts use the password <code>{DEMO_PASSWORD}</code>.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DEMO_ACCOUNTS.map((d) => (
            <button key={d.email} className="btn btn-outline btn-sm" disabled={busy} onClick={() => quickLogin(d.email)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 16 }}>
        <Link to="/" style={{ color: 'var(--text-dim)', fontSize: 13.5 }}>
          ← Keep browsing without an account
        </Link>
      </p>
    </div>
  )
}
