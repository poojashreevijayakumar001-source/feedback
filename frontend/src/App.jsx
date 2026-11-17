import { useEffect, useState } from 'react'
import { api } from './api.js'

const CATEGORIES = ['General', 'Product', 'Service', 'Website', 'Suggestion', 'Complaint']
const STATUSES = ['New', 'Reviewed', 'Resolved']

const Stars = ({ value, onChange }) => (
  <span className="stars">
    {[1, 2, 3, 4, 5].map((n) => (
      <span key={n} className={n <= value ? 'on' : ''} onClick={() => onChange && onChange(n)} style={{ cursor: onChange ? 'pointer' : 'default' }}>★</span>
    ))}
  </span>
)

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'user' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setErr('')
    try { onLogin(await api(`/auth/${mode}`, { method: 'POST', body: f })) }
    catch (x) { setErr(x.message) }
  }

  return (
    <div className="auth">
      <form className="card" onSubmit={submit}>
        <h1>VoiceBox</h1>
        <p className="muted">{mode === 'login' ? 'Sign in to share your feedback' : 'Create your account'}</p>
        {mode === 'register' && <input placeholder="Full name" value={f.name} onChange={set('name')} required />}
        <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input type="password" placeholder="Password" value={f.password} onChange={set('password')} required minLength={6} />
        {mode === 'register' && (
          <select value={f.role} onChange={set('role')}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        )}
        {err && <div className="err">{err}</div>}
        <button className="btn">{mode === 'login' ? 'Login' : 'Register'}</button>
        <a className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'New here? Register' : 'Have an account? Login'}
        </a>
      </form>
    </div>
  )
}

function Dashboard({ user, token, onLogout }) {
  const isAdmin = user.role === 'admin'
  const [items, setItems] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({ category: CATEGORIES[0], rating: 5, message: '' })
  const [replies, setReplies] = useState({})
  const [msg, setMsg] = useState('')

  const load = () => {
    api(isAdmin ? `/feedback${filter ? `?category=${filter}` : ''}` : '/feedback/my', { token }).then(setItems).catch((e) => setMsg(e.message))
    if (isAdmin) api('/feedback/stats', { token }).then(setStats)
  }
  useEffect(() => { load() }, [filter])

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    try {
      await api('/feedback', { method: 'POST', body: form, token })
      setForm({ category: CATEGORIES[0], rating: 5, message: '' })
      setMsg('Thank you! Your feedback was submitted.')
      load()
    } catch (x) { setMsg(x.message) }
  }
  async function update(id, body) { await api(`/feedback/${id}`, { method: 'PATCH', body, token }); load() }

  return (
    <div className="wrap">
      <header>
        <h1>VoiceBox</h1>
        <div><span className="muted">{user.name} · {user.role}</span><button className="btn ghost" onClick={onLogout}>Logout</button></div>
      </header>

      {isAdmin && stats && (
        <div className="stats">
          <div className="stat"><b>{stats.total}</b>Total</div>
          <div className="stat"><b>{stats.average}</b>Avg rating</div>
          <div className="stat"><b>{stats.new}</b>New</div>
          <div className="stat"><b>{stats.resolved}</b>Resolved</div>
        </div>
      )}

      {!isAdmin && (
        <form className="card stack" onSubmit={submit}>
          <h3>Share your feedback</h3>
          <div className="row">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <Stars value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} />
          </div>
          <textarea rows={4} placeholder="Tell us what you think..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          <button className="btn">Submit Feedback</button>
        </form>
      )}
      {msg && <div className={msg.startsWith('Thank') ? 'ok' : 'err'}>{msg}</div>}

      {isAdmin && (
        <select className="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      )}

      <div className="list">
        {items.length === 0 && <p className="muted">No feedback yet.</p>}
        {items.map((f) => (
          <div className="card item" key={f._id}>
            <div className="head">
              <div><span className="chip">{f.category}</span> <Stars value={f.rating} /></div>
              <span className={`tag ${f.status}`}>{f.status}</span>
            </div>
            <p>{f.message}</p>
            <div className="muted small">{isAdmin && `${f.user?.name} · `}{new Date(f.createdAt).toLocaleDateString()}</div>
            {f.reply && <div className="reply"><b>Admin reply:</b> {f.reply}</div>}
            {isAdmin && (
              <div className="row admin">
                <select value={f.status} onChange={(e) => update(f._id, { status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                <input placeholder="Write a reply" value={replies[f._id] ?? ''} onChange={(e) => setReplies({ ...replies, [f._id]: e.target.value })} />
                <button className="btn sm" onClick={() => { update(f._id, { reply: replies[f._id] }); setReplies({ ...replies, [f._id]: '' }) }}>Reply</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('session') || 'null'))
  const login = (s) => { localStorage.setItem('session', JSON.stringify(s)); setSession(s) }
  const logout = () => { localStorage.removeItem('session'); setSession(null) }
  return session ? <Dashboard user={session.user} token={session.token} onLogout={logout} /> : <Auth onLogin={login} />
}
