import L from 'leaflet'

export type PinKind = 'listing' | 'partner' | 'meetup'

const PIN_EMOJI: Record<PinKind, string> = {
  listing: '💎',
  partner: '🔍',
  meetup: '🤝',
}

/** CSS-styled div icon so we avoid Leaflet's bundler-broken default image icons. */
export function pinIcon(kind: PinKind, emoji?: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="pin pin-${kind}"><span>${emoji ?? PIN_EMOJI[kind]}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -30],
  })
}

export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
