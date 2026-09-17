export type Category = 'watches' | 'jewelry' | 'handbags' | 'cars' | 'art' | 'other'

export type RateUnit = 'hour' | 'day' | 'week'

export interface LatLng {
  lat: number
  lng: number
}

/** Proof of insurance the owner must hold on the item before it can be listed. */
export interface Insurance {
  provider: string
  policyNumber: string
  coverageAmount: number
  /** ISO date the policy expires — must be in the future to list. */
  expires: string
  /** File name of the uploaded proof-of-insurance document. */
  documentName: string
}

/** Weekly availability window the owner sets for the item. */
export interface Availability {
  /** Days of week the item can be rented, 0 = Sunday … 6 = Saturday. */
  daysOfWeek: number[]
  /** Pickup/return window, 24h clock. */
  startHour: number
  endHour: number
}

export interface Listing {
  id: string
  title: string
  brand: string
  category: Category
  description: string
  estimatedValue: number
  rates: Partial<Record<RateUnit, number>>
  securityDeposit: number
  availability: Availability
  insurance: Insurance
  meetup: {
    location: LatLng
    label: string
  }
  owner: string
  emoji: string
  imageGradient: [string, string]
  verified: boolean
  createdAt: string
}

export interface Booking {
  id: string
  listingId: string
  /** ISO date of the rental start. */
  date: string
  startHour: number
  unit: RateUnit
  quantity: number
  total: number
  deposit: number
  /** Optional verification partner chosen as the meetup point. */
  meetupPartnerId?: string
  renter: string
  createdAt: string
}

export type PartnerType = 'jeweler' | 'dealer' | 'authenticator' | 'watch specialist'

/** Local jeweler/dealer that can authenticate items and host meetups. */
export interface Partner {
  id: string
  name: string
  type: PartnerType
  specialties: Category[]
  location: LatLng
  address: string
  rating: number
  hours: string
}

export const CATEGORY_LABELS: Record<Category, string> = {
  watches: 'Watches',
  jewelry: 'Jewelry',
  handbags: 'Handbags',
  cars: 'Cars',
  art: 'Art & Collectibles',
  other: 'Other',
}

export const RATE_UNIT_LABELS: Record<RateUnit, string> = {
  hour: 'hour',
  day: 'day',
  week: 'week',
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function formatMoney(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export function formatHour(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:00 ${ampm}`
}

/** Distance between two points in miles (haversine). */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Google Maps turn-by-turn navigation link to a point. */
export function directionsUrl(p: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`
}
