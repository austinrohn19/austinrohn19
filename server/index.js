import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data')
const PORT = Number(process.env.PORT) || 5177
const JWT_SECRET = process.env.JWT_SECRET || 'luxelend-dev-secret-change-in-prod'
const COOKIE = 'luxelend_token'
const DEMO_PASSWORD = 'luxelend123'
const SERVICE_FEE_RATE = 0.12

const CATEGORIES = ['watches', 'jewelry', 'handbags', 'cars', 'art', 'other']
const RATE_UNITS = ['hour', 'day', 'week']

// ---------- database -------------------------------------------------------

fs.mkdirSync(DATA_DIR, { recursive: true })
const db = new Database(path.join(DATA_DIR, 'luxelend.db'))
db.pragma('journal_mode = WAL')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  member_since TEXT NOT NULL,
  rating REAL NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  renter_id TEXT NOT NULL REFERENCES users(id),
  json TEXT NOT NULL
);
`)

if (db.prepare('SELECT COUNT(*) AS c FROM users').get().c === 0) {
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed.json'), 'utf8'))
  const demoHash = bcrypt.hashSync(DEMO_PASSWORD, 10)
  const insertUser = db.prepare(
    'INSERT INTO users (id, email, password_hash, name, member_since, rating, location, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  )
  const insertListing = db.prepare('INSERT INTO listings (id, owner_id, json) VALUES (?, ?, ?)')
  const insertBooking = db.prepare('INSERT INTO bookings (id, listing_id, renter_id, json) VALUES (?, ?, ?, ?)')
  db.transaction(() => {
    for (const u of seed.users)
      insertUser.run(u.id, u.email, demoHash, u.name, u.memberSince, u.rating, u.location, u.bio)
    for (const l of seed.listings) insertListing.run(l.id, l.ownerId, JSON.stringify(l))
    for (const b of seed.bookings) insertBooking.run(b.id, b.listingId, b.renterId, JSON.stringify(b))
  })()
  console.log(`Seeded database (${seed.users.length} users — password "${DEMO_PASSWORD}")`)
}

const q = {
  userById: db.prepare('SELECT * FROM users WHERE id = ?'),
  userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  allUsers: db.prepare('SELECT * FROM users'),
  allListings: db.prepare('SELECT json FROM listings'),
  listingById: db.prepare('SELECT json FROM listings WHERE id = ?'),
  allBookings: db.prepare('SELECT json FROM bookings'),
  bookingsForListing: db.prepare('SELECT json FROM bookings WHERE listing_id = ?'),
  insertUser: db.prepare(
    'INSERT INTO users (id, email, password_hash, name, member_since, rating, location, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ),
  insertListing: db.prepare('INSERT INTO listings (id, owner_id, json) VALUES (?, ?, ?)'),
  insertBooking: db.prepare('INSERT INTO bookings (id, listing_id, renter_id, json) VALUES (?, ?, ?, ?)'),
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    memberSince: row.member_since,
    rating: row.rating,
    location: row.location,
    bio: row.bio,
  }
}

// ---------- auth helpers ----------------------------------------------------

function setAuthCookie(res, userId) {
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' })
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 3600 * 1000,
  })
}

function userIdFrom(req) {
  const token = req.cookies?.[COOKIE]
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET).sub
  } catch {
    return null
  }
}

function requireAuth(req, res, next) {
  const id = userIdFrom(req)
  if (!id || !q.userById.get(id)) {
    return res.status(401).json({ error: 'Please log in first.' })
  }
  req.userId = id
  next()
}

// ---------- booking date math (mirrors the client) --------------------------

function coveredDates(b) {
  const days = b.unit === 'hour' ? 1 : b.unit === 'day' ? b.quantity : b.quantity * 7
  const out = []
  const d = new Date(b.date + 'T00:00:00Z')
  for (let i = 0; i < days; i++) {
    out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

function conflicts(existing, wanted) {
  const wantedDates = coveredDates(wanted)
  return existing.some((b) => {
    const dateOverlap = coveredDates(b).some((d) => wantedDates.includes(d))
    if (!dateOverlap) return false
    if (wanted.unit === 'hour' && b.unit === 'hour' && b.date === wanted.date) {
      return (
        wanted.startHour < b.startHour + b.quantity &&
        b.startHour < wanted.startHour + wanted.quantity
      )
    }
    return true
  })
}

// ---------- app -------------------------------------------------------------

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, location, bio } = req.body ?? {}
  if (typeof name !== 'string' || name.trim().length < 2)
    return res.status(400).json({ error: 'Enter your name.' })
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Enter a valid email address.' })
  if (typeof password !== 'string' || password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  if (q.userByEmail.get(email.toLowerCase()))
    return res.status(409).json({ error: 'An account with that email already exists.' })

  const id = 'u-' + crypto.randomBytes(5).toString('hex')
  q.insertUser.run(
    id,
    email.toLowerCase(),
    bcrypt.hashSync(password, 10),
    name.trim(),
    new Date().toISOString().slice(0, 10),
    5.0,
    typeof location === 'string' ? location.trim().slice(0, 80) : '',
    typeof bio === 'string' ? bio.trim().slice(0, 400) : '',
  )
  setAuthCookie(res, id)
  res.json({ user: { ...publicUser(q.userById.get(id)), email: email.toLowerCase() } })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {}
  const row = typeof email === 'string' ? q.userByEmail.get(email.toLowerCase()) : undefined
  if (!row || typeof password !== 'string' || !bcrypt.compareSync(password, row.password_hash))
    return res.status(401).json({ error: 'Wrong email or password.' })
  setAuthCookie(res, row.id)
  res.json({ user: { ...publicUser(row), email: row.email } })
})

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE)
  res.json({ ok: true })
})

/** Everything the client needs to render: users, listings, bookings, session. */
app.get('/api/state', (req, res) => {
  const meId = userIdFrom(req)
  const meRow = meId ? q.userById.get(meId) : undefined
  res.json({
    me: meRow ? { ...publicUser(meRow), email: meRow.email } : null,
    users: q.allUsers.all().map(publicUser),
    listings: q.allListings.all().map((r) => JSON.parse(r.json)),
    bookings: q.allBookings.all().map((r) => JSON.parse(r.json)),
  })
})

app.post('/api/listings', requireAuth, (req, res) => {
  const l = req.body ?? {}
  const errors = []

  if (typeof l.title !== 'string' || !l.title.trim()) errors.push('Title is required.')
  if (typeof l.brand !== 'string' || !l.brand.trim()) errors.push('Brand is required.')
  if (!CATEGORIES.includes(l.category)) errors.push('Invalid category.')
  const value = Number(l.estimatedValue)
  if (!(value > 0)) errors.push('Estimated value must be positive.')

  const rates = {}
  for (const unit of RATE_UNITS) {
    const r = Number(l.rates?.[unit])
    if (r > 0) rates[unit] = r
  }
  if (Object.keys(rates).length === 0) errors.push('Set at least one rate.')

  const av = l.availability ?? {}
  const days = Array.isArray(av.daysOfWeek)
    ? [...new Set(av.daysOfWeek.map(Number).filter((d) => d >= 0 && d <= 6))].sort()
    : []
  if (days.length === 0) errors.push('Pick at least one available day.')
  const startHour = Number(av.startHour)
  const endHour = Number(av.endHour)
  if (!(startHour >= 0 && endHour <= 24 && endHour > startHour))
    errors.push('Invalid pickup window.')

  // Proof of insurance is mandatory: policy in the owner's own name,
  // coverage at least the item value, unexpired, document attached.
  const ins = l.insurance ?? {}
  if (typeof ins.provider !== 'string' || !ins.provider.trim())
    errors.push('Insurance carrier is required.')
  if (typeof ins.policyNumber !== 'string' || !ins.policyNumber.trim())
    errors.push('Insurance policy number is required.')
  if (!(Number(ins.coverageAmount) >= value))
    errors.push('Insurance coverage must be at least the item value.')
  if (
    typeof ins.expires !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(ins.expires) ||
    new Date(ins.expires + 'T00:00:00Z') <= new Date()
  )
    errors.push('Insurance policy must be active (expiration in the future).')
  if (typeof ins.documentName !== 'string' || !ins.documentName.trim())
    errors.push('Proof-of-insurance document is required.')

  const meetup = l.meetup ?? {}
  const lat = Number(meetup.location?.lat)
  const lng = Number(meetup.location?.lng)
  if (!(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180))
    errors.push('Pick a meetup location on the map.')
  if (typeof meetup.label !== 'string' || !meetup.label.trim())
    errors.push('Describe the meetup location.')

  if (errors.length > 0) return res.status(400).json({ error: errors.join(' ') })

  const listing = {
    id: 'l-' + crypto.randomBytes(5).toString('hex'),
    title: l.title.trim(),
    brand: l.brand.trim(),
    category: l.category,
    description:
      typeof l.description === 'string' && l.description.trim()
        ? l.description.trim().slice(0, 2000)
        : 'No description provided.',
    estimatedValue: value,
    rates,
    securityDeposit: Number(l.securityDeposit) > 0 ? Number(l.securityDeposit) : Math.round(value * 0.15),
    availability: { daysOfWeek: days, startHour, endHour },
    insurance: {
      provider: ins.provider.trim(),
      policyNumber: ins.policyNumber.trim(),
      coverageAmount: Number(ins.coverageAmount),
      expires: ins.expires,
      documentName: ins.documentName.trim(),
    },
    meetup: { location: { lat, lng }, label: meetup.label.trim() },
    ownerId: req.userId,
    emoji: typeof l.emoji === 'string' ? l.emoji.slice(0, 8) : '✨',
    imageGradient:
      Array.isArray(l.imageGradient) && l.imageGradient.length === 2
        ? l.imageGradient.map(String)
        : ['#20262e', '#9db4c0'],
    verified: false,
    createdAt: new Date().toISOString(),
  }
  q.insertListing.run(listing.id, listing.ownerId, JSON.stringify(listing))
  res.json({ listing })
})

app.post('/api/bookings', requireAuth, (req, res) => {
  const { listingId, date, startHour, unit, quantity } = req.body ?? {}
  const row = typeof listingId === 'string' ? q.listingById.get(listingId) : undefined
  if (!row) return res.status(404).json({ error: 'Listing not found.' })
  const listing = JSON.parse(row.json)

  if (listing.ownerId === req.userId)
    return res.status(400).json({ error: "You can't rent your own item." })
  if (!RATE_UNITS.includes(unit) || listing.rates[unit] === undefined)
    return res.status(400).json({ error: 'That rate is not offered for this item.' })

  const qty = Number(quantity)
  if (!Number.isInteger(qty) || qty < 1 || qty > 60)
    return res.status(400).json({ error: 'Invalid duration.' })
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: 'Invalid date.' })

  const av = listing.availability
  const day = new Date(date + 'T00:00:00Z').getUTCDay()
  if (!av.daysOfWeek.includes(day))
    return res.status(400).json({ error: 'The item is not available on that day of the week.' })
  if (new Date(date + 'T23:59:59Z') < new Date())
    return res.status(400).json({ error: 'Pick a date in the future.' })

  let start = av.startHour
  if (unit === 'hour') {
    start = Number(startHour)
    if (!Number.isInteger(start) || start < av.startHour || start + qty > av.endHour)
      return res.status(400).json({ error: "Choose a start time inside the owner's window." })
  }

  const wanted = { date, startHour: start, unit, quantity: qty }
  const existing = q.bookingsForListing.all(listingId).map((r) => JSON.parse(r.json))
  if (conflicts(existing, wanted))
    return res.status(409).json({ error: 'That slot is already booked — try another date or time.' })

  const total = listing.rates[unit] * qty
  const booking = {
    id: 'b-' + crypto.randomBytes(5).toString('hex'),
    listingId,
    date,
    startHour: start,
    unit,
    quantity: qty,
    total,
    serviceFee: Math.round(total * SERVICE_FEE_RATE),
    deposit: listing.securityDeposit,
    renterId: req.userId,
    createdAt: new Date().toISOString(),
  }
  q.insertBooking.run(booking.id, listingId, req.userId, JSON.stringify(booking))
  res.json({ booking })
})

// ---------- static frontend (production) ------------------------------------

const dist = path.join(ROOT, 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`LuxeLend API listening on http://localhost:${PORT}`)
})
