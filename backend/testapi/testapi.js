// Run with: npm test   (start the server first: npm run dev). Needs Node 18+
const BASE = process.env.API_URL || 'http://localhost:5000/api'
const stamp = Date.now()

async function call(path, method = 'GET', body, token) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: r.status, data: await r.json() }
}
const check = (name, ok) => { console.log(ok ? 'PASS' : 'FAIL', '-', name); if (!ok) process.exitCode = 1 }

let r = await call('/health'); check('health', r.status === 200)
r = await call('/auth/register', 'POST', { name: 'Admin', email: `admin${stamp}@mail.com`, password: '123456', role: 'admin' }); check('register admin', r.status === 201)
const admin = r.data.token
r = await call('/auth/register', 'POST', { name: 'User', email: `user${stamp}@mail.com`, password: '123456' }); check('register user', r.status === 201)
const user = r.data.token
r = await call('/feedback/my'); check('blocked without token', r.status === 401)
r = await call('/feedback', 'POST', { category: 'Product', rating: 4, message: 'Nice app' }, user); check('submit feedback', r.status === 201)
const id = r.data._id
r = await call('/feedback', 'GET', null, user); check('user cannot see all feedback', r.status === 403)
r = await call('/feedback', 'GET', null, admin); check('admin sees all feedback', r.status === 200 && r.data.length >= 1)
r = await call('/feedback/' + id, 'PATCH', { reply: 'Thanks!', status: 'Resolved' }, admin); check('admin replies', r.data.status === 'Resolved')
r = await call('/feedback/stats', 'GET', null, admin); check('stats', r.status === 200 && r.data.total >= 1)
