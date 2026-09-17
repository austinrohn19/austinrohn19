import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Booking, Listing } from './types'
import { SEED_LISTINGS } from './data/seed'

const STORAGE_KEY = 'luxelend-v1'

interface PersistedState {
  userListings: Listing[]
  bookings: Booking[]
}

interface StoreValue {
  listings: Listing[]
  bookings: Booking[]
  addListing: (listing: Listing) => void
  addBooking: (booking: Booking) => void
  getListing: (id: string) => Listing | undefined
  bookingsFor: (listingId: string) => Booking[]
}

const StoreContext = createContext<StoreValue | null>(null)

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState
      return {
        userListings: Array.isArray(parsed.userListings) ? parsed.userListings : [],
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      }
    }
  } catch {
    // corrupted or unavailable storage — start fresh
  }
  return { userListings: [], bookings: [] }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadPersisted)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage may be unavailable (private mode) — app still works in memory
    }
  }, [state])

  const listings = useMemo(
    () => [...state.userListings, ...SEED_LISTINGS],
    [state.userListings],
  )

  const addListing = useCallback((listing: Listing) => {
    setState((s) => ({ ...s, userListings: [listing, ...s.userListings] }))
  }, [])

  const addBooking = useCallback((booking: Booking) => {
    setState((s) => ({ ...s, bookings: [booking, ...s.bookings] }))
  }, [])

  const getListing = useCallback(
    (id: string) => listings.find((l) => l.id === id),
    [listings],
  )

  const bookingsFor = useCallback(
    (listingId: string) => state.bookings.filter((b) => b.listingId === listingId),
    [state.bookings],
  )

  const value = useMemo(
    () => ({
      listings,
      bookings: state.bookings,
      addListing,
      addBooking,
      getListing,
      bookingsFor,
    }),
    [listings, state.bookings, addListing, addBooking, getListing, bookingsFor],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
