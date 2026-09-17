import seed from '../server/seed.json'
import type { Booking, Listing, RateUnit, User } from './types'
import { serviceFeeFor } from './types'

/**
 * In-browser stand-in for the API server, used on static hosting (e.g. GitHub
 * Pages) where no backend is available. Mirrors the server's responses and
 * rules; data lives in this browser's localStorage only.
 */

type DemoUser = User & { email: string; password: string }

interface DemoState {
  users: DemoUser[]
  listings: Listing[]
  bookings: Booking[]
  meId: string | null
}

const KEY = 'luxelend-demo-v1'
const DEMO_PASSWORD = 'luxelend123'

function freshState(): DemoState {
  return {
    users: (seed.users as (User & { email: string })[]).map((u) => ({
      ...u,
      password: DEMO_PASSWORD,
    })),
    listings: seed.listings as unknown as Listing[],
    bookings: seed.bookings as Booking[],
    meId: null,
  }
}

function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DemoState
  } catch {
    // unavailable or corrupted storage — run from a fresh in-memory state
  }
  return freshState()
}

let state = load()

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // private mode etc. — demo continues in memory
  }
}

function publicUser(u: DemoUser): User {
  return {
    id: u.id,
    name: u.name,
    memberSince: u.memberSince,
    rating: u.rating,
    location: u.location,
    bio: u.bio,
  }
}

function me(): (User & { email: string }) | null {
  const u = state.users.find((x) => x.id === state.meId)
  return u ? { ...publicUser(u), email: u.email } : null
}

export function demoState() {
  return {
    me: me(),
    users: state.users.map(publicUser),
    listings: state.listings,
    bookings: state.bookings,
  }
}

export function demoLogin(email: string, password: string) {
  const u = state.users.find((x) => x.email === email.trim().toLowerCase())
  if (!u || u.password !== password) throw new Error('Wrong email or password.')
  state.meId = u.id
  save()
}

export function demoSignup(input: { name: string; email: string; password: string; location?: string }) {
  const email = input.email.trim().toLowerCase()
  if (!input.name || input.name.trim().length < 2) throw new Error('Enter your name.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
  if (!input.password || input.password.length < 8)
    throw new Error('Password must be at least 8 characters.')
  if (state.users.some((x) => x.email === email))
    throw new Error('An account with that email already exists.')
  const u: DemoUser = {
    id: 'u-' + Math.random().toString(16).slice(2, 12),
    name: input.name.trim(),
    email,
    password: input.password,
    memberSince: new Date().toISOString().slice(0, 10),
    rating: 5.0,
    location: input.location?.trim().slice(0, 80) ?? '',
    bio: '',
  }
  state.users.push(u)
  state.meId = u.id
  save()
}

export function demoLogout() {
  state.meId = null
  save()
}

function coveredDates(b: Pick<Booking, 'date' | 'unit' | 'quantity'>): string[] {
  const days = b.unit === 'hour' ? 1 : b.unit === 'day' ? b.quantity : b.quantity * 7
  const out: string[] = []
  const d = new Date(b.date + 'T00:00:00')
  for (let i = 0; i < days; i++) {
    out.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return out
}

export function demoAddBooking(input: {
  listingId: string
  date: string
  startHour: number
  unit: RateUnit
  quantity: number
}): Booking {
  const current = me()
  if (!current) throw new Error('Please log in first.')
  const listing = state.listings.find((l) => l.id === input.listingId)
  if (!listing) throw new Error('Listing not found.')
  if (listing.ownerId === current.id) throw new Error("You can't rent your own item.")
  const rate = listing.rates[input.unit]
  if (rate === undefined) throw new Error('That rate is not offered for this item.')

  const wanted = coveredDates(input)
  const clash = state.bookings
    .filter((b) => b.listingId === input.listingId)
    .some((b) => {
      const overlap = coveredDates(b).some((d) => wanted.includes(d))
      if (!overlap) return false
      if (input.unit === 'hour' && b.unit === 'hour' && b.date === input.date) {
        return (
          input.startHour < b.startHour + b.quantity &&
          b.startHour < input.startHour + input.quantity
        )
      }
      return true
    })
  if (clash) throw new Error('That slot is already booked — try another date or time.')

  const total = rate * input.quantity
  const booking: Booking = {
    id: 'b-' + Math.random().toString(16).slice(2, 12),
    listingId: input.listingId,
    date: input.date,
    startHour: input.startHour,
    unit: input.unit,
    quantity: input.quantity,
    total,
    serviceFee: serviceFeeFor(total),
    deposit: listing.securityDeposit,
    renterId: current.id,
    createdAt: new Date().toISOString(),
  }
  state.bookings = [booking, ...state.bookings]
  save()
  return booking
}

export function demoAddListing(
  input: Omit<Listing, 'id' | 'ownerId' | 'verified' | 'createdAt' | 'authenticatedBy' | 'authenticatedOn'>,
): Listing {
  const current = me()
  if (!current) throw new Error('Please log in first.')
  const listing: Listing = {
    ...input,
    id: 'l-' + Math.random().toString(16).slice(2, 12),
    ownerId: current.id,
    verified: false,
    createdAt: new Date().toISOString(),
  }
  state.listings = [listing, ...state.listings]
  save()
  return listing
}
