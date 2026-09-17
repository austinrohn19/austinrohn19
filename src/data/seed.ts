import type { Partner } from '../types'

/**
 * Verification network: local jewelers, dealers and authenticators around
 * Manhattan that can inspect items and host secure meetups.
 */
export const PARTNERS: Partner[] = [
  {
    id: 'p-diamond-district',
    name: 'Diamond District Appraisal House',
    type: 'jeweler',
    specialties: ['jewelry', 'watches'],
    location: { lat: 40.757, lng: -73.9819 },
    address: '21 W 47th St, New York, NY 10036',
    rating: 4.9,
    hours: 'Mon–Sat 10 AM – 6 PM',
  },
  {
    id: 'p-meridian-watch',
    name: 'Meridian Watch Atelier',
    type: 'watch specialist',
    specialties: ['watches'],
    location: { lat: 40.7614, lng: -73.9776 },
    address: '712 Madison Ave, New York, NY 10065',
    rating: 4.8,
    hours: 'Tue–Sat 11 AM – 7 PM',
  },
  {
    id: 'p-vault-verify',
    name: 'Vault & Verify Authentication Lab',
    type: 'authenticator',
    specialties: ['handbags', 'jewelry', 'other'],
    location: { lat: 40.7233, lng: -74.003 },
    address: '119 Spring St, New York, NY 10012',
    rating: 4.7,
    hours: 'Mon–Sun 10 AM – 8 PM',
  },
  {
    id: 'p-manhattan-motors',
    name: 'Manhattan Motorcars Inspection Bay',
    type: 'dealer',
    specialties: ['cars'],
    location: { lat: 40.748, lng: -74.0027 },
    address: '270 11th Ave, New York, NY 10001',
    rating: 4.6,
    hours: 'Mon–Fri 9 AM – 7 PM, Sat 10 AM – 5 PM',
  },
  {
    id: 'p-heritage-gem',
    name: 'Heritage Gem Laboratory',
    type: 'jeweler',
    specialties: ['jewelry'],
    location: { lat: 40.7589, lng: -73.9851 },
    address: '1177 6th Ave, New York, NY 10036',
    rating: 4.8,
    hours: 'Mon–Fri 9 AM – 6 PM',
  },
  {
    id: 'p-crown-consign',
    name: 'Crown Luxury Consignment & Authentication',
    type: 'authenticator',
    specialties: ['handbags', 'watches', 'art', 'other'],
    location: { lat: 40.7359, lng: -73.9911 },
    address: '873 Broadway, New York, NY 10003',
    rating: 4.5,
    hours: 'Mon–Sun 11 AM – 7 PM',
  },
]
