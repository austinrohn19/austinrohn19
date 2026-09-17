import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import { PARTNERS } from '../data/seed'
import { useStore } from '../store'
import { pinIcon, TILE_ATTRIBUTION, TILE_URL } from '../components/markers'
import { directionsUrl, formatMoney } from '../types'

type LayerFilter = 'all' | 'listings' | 'partners'

export default function MapPage() {
  const { listings } = useStore()
  const [filter, setFilter] = useState<LayerFilter>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  const showListings = filter !== 'partners'
  const showPartners = filter !== 'listings'

  const partnerIcon = useMemo(() => pinIcon('partner'), [])
  const meetupIcon = useMemo(() => pinIcon('meetup'), [])

  function focus(lat: number, lng: number, id: string) {
    setSelected(id)
    mapRef.current?.flyTo([lat, lng], 15, { duration: 0.8 })
  }

  return (
    <div className="map-page-layout">
      <aside className="map-sidebar">
        <h2>Meetups &amp; Verification</h2>
        <p className="sub">
          Gold pins are item meetup points. Blue pins are vetted jewelers, dealers and
          authentication labs — meet there to have any item verified before the rental starts.
        </p>
        <div className="filter-bar" style={{ paddingTop: 0 }}>
          {(['all', 'listings', 'partners'] as LayerFilter[]).map((f) => (
            <button
              key={f}
              className={`chip${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Everything' : f === 'listings' ? 'Item meetups' : 'Verification partners'}
            </button>
          ))}
        </div>

        {showPartners &&
          PARTNERS.map((p) => (
            <div
              key={p.id}
              className={`poi-item${selected === p.id ? ' selected' : ''}`}
              onClick={() => focus(p.location.lat, p.location.lng, p.id)}
            >
              <div className="name">🔍 {p.name}</div>
              <div className="meta">
                {p.type} · ★ {p.rating.toFixed(1)} · {p.hours}
              </div>
              <div className="meta">{p.address}</div>
              <a
                className="popup-link"
                href={directionsUrl(p.location)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Navigate there →
              </a>
            </div>
          ))}

        {showListings &&
          listings.map((l) => (
            <div
              key={l.id}
              className={`poi-item${selected === l.id ? ' selected' : ''}`}
              onClick={() => focus(l.meetup.location.lat, l.meetup.location.lng, l.id)}
            >
              <div className="name">
                {l.emoji} {l.title}
              </div>
              <div className="meta">Meetup: {l.meetup.label}</div>
              <Link className="popup-link" to={`/listing/${l.id}`} onClick={(e) => e.stopPropagation()}>
                View listing →
              </Link>
            </div>
          ))}
      </aside>

      <MapContainer
        center={[40.748, -73.99]}
        zoom={13}
        ref={mapRef}
        scrollWheelZoom
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        {showPartners &&
          PARTNERS.map((p) => (
            <Marker key={p.id} position={[p.location.lat, p.location.lng]} icon={partnerIcon}>
              <Popup>
                <div className="popup-title">{p.name}</div>
                <div className="popup-sub">
                  {p.type} · ★ {p.rating.toFixed(1)}
                  <br />
                  {p.address}
                  <br />
                  {p.hours}
                </div>
                <a className="popup-link" href={directionsUrl(p.location)} target="_blank" rel="noreferrer">
                  Get directions →
                </a>
              </Popup>
            </Marker>
          ))}

        {showListings &&
          listings.map((l) => (
            <Marker
              key={l.id}
              position={[l.meetup.location.lat, l.meetup.location.lng]}
              icon={meetupIcon}
            >
              <Popup>
                <div className="popup-title">
                  {l.emoji} {l.title}
                </div>
                <div className="popup-sub">
                  Meetup point: {l.meetup.label}
                  <br />
                  {l.rates.day !== undefined
                    ? `${formatMoney(l.rates.day)}/day`
                    : l.rates.hour !== undefined
                      ? `${formatMoney(l.rates.hour)}/hr`
                      : ''}
                </div>
                <Link className="popup-link" to={`/listing/${l.id}`}>
                  View listing →
                </Link>
                {' · '}
                <a
                  className="popup-link"
                  href={directionsUrl(l.meetup.location)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Navigate →
                </a>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  )
}
