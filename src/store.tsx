import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Booking, Listing, RateUnit, User } from './types'

export type Me = (User & { email: string }) | null

export interface NewListingInput
  extends Omit<Listing, 'id' | 'ownerId' | 'verified' | 'createdAt' | 'authenticatedBy' | 'authenticatedOn'> {}

export interface NewBookingInput {
  listingId: string
  date: string
  startHour: number
  unit: RateUnit
  quantity: number
}

interface ServerState {
  me: Me
  users: User[]
  listings: Listing[]
  bookings: Booking[]
}

interface StoreValue extends ServerState {
  /** False until the first /api/state fetch resolves. */
  ready: boolean
  getUser: (id: string) => User | undefined
  getListing: (id: string) => Listing | undefined
  bookingsFor: (listingId: string) => Booking[]
  login: (email: string, password: string) => Promise<void>
  signup: (input: { name: string; email: string; password: string; location?: string }) => Promise<void>
  logout: () => Promise<void>
  addListing: (input: NewListingInput) => Promise<Listing>
  addBooking: (input: NewBookingInput) => Promise<Booking>
}

const StoreContext = createContext<StoreValue | null>(null)

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ServerState>({
    me: null,
    users: [],
    listings: [],
    bookings: [],
  })
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    const next = await api<ServerState>('/api/state')
    setState(next)
    setReady(true)
  }, [])

  useEffect(() => {
    refresh().catch((err) => {
      console.error('Failed to load app state — is the API server running?', err)
      setReady(true)
    })
  }, [refresh])

  const login = useCallback(
    async (email: string, password: string) => {
      await api('/api/auth/login', { email, password })
      await refresh()
    },
    [refresh],
  )

  const signup = useCallback(
    async (input: { name: string; email: string; password: string; location?: string }) => {
      await api('/api/auth/signup', input)
      await refresh()
    },
    [refresh],
  )

  const logout = useCallback(async () => {
    await api('/api/auth/logout', {})
    await refresh()
  }, [refresh])

  const addListing = useCallback(
    async (input: NewListingInput) => {
      const { listing } = await api<{ listing: Listing }>('/api/listings', input)
      await refresh()
      return listing
    },
    [refresh],
  )

  const addBooking = useCallback(
    async (input: NewBookingInput) => {
      const { booking } = await api<{ booking: Booking }>('/api/bookings', input)
      await refresh()
      return booking
    },
    [refresh],
  )

  const getUser = useCallback(
    (id: string) => state.users.find((u) => u.id === id),
    [state.users],
  )

  const getListing = useCallback(
    (id: string) => state.listings.find((l) => l.id === id),
    [state.listings],
  )

  const bookingsFor = useCallback(
    (listingId: string) => state.bookings.filter((b) => b.listingId === listingId),
    [state.bookings],
  )

  const value = useMemo(
    () => ({
      ...state,
      ready,
      getUser,
      getListing,
      bookingsFor,
      login,
      signup,
      logout,
      addListing,
      addBooking,
    }),
    [state, ready, getUser, getListing, bookingsFor, login, signup, logout, addListing, addBooking],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
