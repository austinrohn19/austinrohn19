import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { PARTNERS } from '../data/seed'
import { useStore } from '../store'
import { pinIcon, TILE_ATTRIBUTION, TILE_URL } from '../components/markers'
import type { Booking, RateUnit } from '../types'
import {
  CATEGORY_LABELS,
  DAY_NAMES,
  RATE_UNIT_LABELS,
  directionsUrl,
  distanceMiles,
  formatHour,
  formatMoney,
} from '../types'

/** ISO dates covered by a booking (a week booking covers 7 days per unit, etc.). */
function coveredDates(b: Booking): string[] {
  const days = b.unit === 'hour' ? 1 : b.unit === 'day' ? b.quantity : b.quantity * 7
  const out: string[] = []
  const d = new Date(b.date + 'T00:00:00')
  for (let i = 0; i < days; i++) {
    out.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return out
}

export default function ListingDetail() {
  const { id } = useParams()
  const { getListing, bookingsFor, addBooking } = useStore()
  const listing = getListing(id ?? '')

  const availableUnits = useMemo(
    () => (listing ? (Object.keys(listing.rates) as RateUnit[]) : []),
    [listing],
  )

  const [unit, setUnit] = useState<RateUnit | null>(null)
  const [date, setDate] = useState('')
  const [startHour, setStartHour] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [confirmed, setConfirmed] = useState<Booking | null>(null)

  if (!listing) {
    return (
      <div className="container">
        <div className="empty">
          Listing not found. <Link to="/">Back to browse</Link>
        </div>
      </div>
    )
  }

  const activeUnit = unit ?? availableUnits[0]
  const existing = bookingsFor(listing.id)
  const [c1, c2] = listing.imageGradient
  const av = listing.availability

  const nearestPartners = [...PARTNERS]
    .map((p) => ({ p, dist: distanceMiles(p.location, listing.meetup.location) }))
    .sort((a, b) => {
      const aMatch = a.p.specialties.includes(listing.category) ? 0 : 1
      const bMatch = b.p.specialties.includes(listing.category) ? 0 : 1
      return aMatch - bMatch || a.dist - b.dist
    })
    .slice(0, 3)

  const rate = listing.rates[activeUnit] ?? 0
  const total = rate * quantity

  const hourOptions: number[] = []
  for (let h = av.startHour; h < av.endHour; h++) hourOptions.push(h)

  // --- validation -----------------------------------------------------------
  let error: string | null = null
  if (date) {
    const day = new Date(date + 'T00:00:00').getDay()
    if (!av.daysOfWeek.includes(day)) {
      error = `This item is only available on ${av.daysOfWeek.map((d) => DAY_NAMES[d]).join(', ')}.`
    } else if (new Date(date + 'T00:00:00') < new Date(new Date().toDateString())) {
      error = 'Pick a date in the future.'
    } else if (activeUnit === 'hour') {
      if (startHour === null) {
        error = 'Choose a start time.'
      } else if (startHour + quantity > av.endHour) {
        error = `The owner's window ends at ${formatHour(av.endHour)} — shorten the rental or start earlier.`
      }
    }

    if (!error) {
      const wanted = coveredDates({
        id: '',
        listingId: listing.id,
        date,
        startHour: startHour ?? av.startHour,
        unit: activeUnit,
        quantity,
        total: 0,
        deposit: 0,
        renter: '',
        createdAt: '',
      })
      const clash = existing.some((b) => {
        const theirs = coveredDates(b)
        const dateOverlap = theirs.some((d) => wanted.includes(d))
        if (!dateOverlap) return false
        if (activeUnit === 'hour' && b.unit === 'hour' && b.date === date) {
          const aStart = startHour ?? av.startHour
          return aStart < b.startHour + b.quantity && b.startHour < aStart + quantity
        }
        return true
      })
      if (clash) error = 'That slot is already booked — try another date or time.'
    }
  }

  const canBook = Boolean(date) && !error && (activeUnit !== 'hour' || startHour !== null)

  function book() {
    if (!listing || !canBook) return
    const booking: Booking = {
      id: `b-${Date.now()}`,
      listingId: listing.id,
      date,
      startHour: startHour ?? listing.availability.startHour,
      unit: activeUnit,
      quantity,
      total,
      deposit: listing.securityDeposit,
      renter: 'You',
      createdAt: new Date().toISOString(),
    }
    addBooking(booking)
    setConfirmed(booking)
  }

  return (
    <div className="container">
      <div className="detail-layout">
        <div>
          <div
            className="detail-media"
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
          >
            {listing.emoji}
          </div>

          <div className="panel" style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span className="pill pill-gold">{CATEGORY_LABELS[listing.category]}</span>
              <span className="pill pill-insured">🛡 Owner-held insurance on file</span>
              {listing.verified && <span className="pill pill-verified">✓ Authenticated</span>}
            </div>
            <h3 style={{ fontSize: 28 }}>{listing.title}</h3>
            <p style={{ color: 'var(--text-dim)' }}>{listing.description}</p>
            <div className="kv">
              <span className="k">Owner</span>
              <span className="v">{listing.owner}</span>
            </div>
            <div className="kv">
              <span className="k">Estimated value</span>
              <span className="v">{formatMoney(listing.estimatedValue)}</span>
            </div>
            <div className="kv">
              <span className="k">Security deposit (refundable)</span>
              <span className="v">{formatMoney(listing.securityDeposit)}</span>
            </div>
          </div>

          <div className="panel">
            <h3>🛡 Proof of insurance</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13.5, marginTop: 0 }}>
              Every LuxeLend listing requires the owner to hold and upload an active policy
              covering the item. This one is on file and verified.
            </p>
            <div className="kv">
              <span className="k">Carrier</span>
              <span className="v">{listing.insurance.provider}</span>
            </div>
            <div className="kv">
              <span className="k">Policy #</span>
              <span className="v">{listing.insurance.policyNumber}</span>
            </div>
            <div className="kv">
              <span className="k">Coverage</span>
              <span className="v">{formatMoney(listing.insurance.coverageAmount)}</span>
            </div>
            <div className="kv">
              <span className="k">Valid through</span>
              <span className="v">{listing.insurance.expires}</span>
            </div>
            <div className="kv">
              <span className="k">Document</span>
              <span className="v">📄 {listing.insurance.documentName}</span>
            </div>
          </div>

          <div className="panel">
            <h3>📍 Meetup &amp; verification</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13.5, marginTop: 0 }}>
              Handoff at <strong>{listing.meetup.label}</strong>, or meet at a nearby partner to
              have the item authenticated on the spot before your rental begins.
            </p>
            <div className="map-embed">
              <MapContainer
                center={[listing.meetup.location.lat, listing.meetup.location.lng]}
                zoom={14}
                scrollWheelZoom={false}
              >
                <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
                <Marker
                  position={[listing.meetup.location.lat, listing.meetup.location.lng]}
                  icon={pinIcon('meetup', listing.emoji)}
                >
                  <Popup>
                    <div className="popup-title">Meetup point</div>
                    <div className="popup-sub">{listing.meetup.label}</div>
                    <a
                      className="popup-link"
                      href={directionsUrl(listing.meetup.location)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Navigate →
                    </a>
                  </Popup>
                </Marker>
                {nearestPartners.map(({ p }) => (
                  <Marker key={p.id} position={[p.location.lat, p.location.lng]} icon={pinIcon('partner')}>
                    <Popup>
                      <div className="popup-title">{p.name}</div>
                      <div className="popup-sub">{p.type} · {p.address}</div>
                      <a className="popup-link" href={directionsUrl(p.location)} target="_blank" rel="noreferrer">
                        Get directions →
                      </a>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <div className="divider" />
            {nearestPartners.map(({ p, dist }) => (
              <div className="kv" key={p.id}>
                <span className="k">
                  🔍 {p.name} <span style={{ color: 'var(--text-faint)' }}>({p.type})</span>
                </span>
                <span className="v">
                  {dist.toFixed(1)} mi ·{' '}
                  <a
                    href={directionsUrl(p.location)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--gold-bright)' }}
                  >
                    navigate
                  </a>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- booking column ---------- */}
        <div>
          <div className="panel">
            <h3>Reserve this item</h3>

            <div className="kv" style={{ borderBottom: 'none', paddingTop: 0 }}>
              <span className="k">Available days</span>
            </div>
            <div className="day-dots" style={{ marginBottom: 10 }}>
              {DAY_NAMES.map((d, i) => (
                <span key={d} className={`day-dot${av.daysOfWeek.includes(i) ? ' on' : ''}`}>
                  {d}
                </span>
              ))}
            </div>
            <div className="kv">
              <span className="k">Pickup window</span>
              <span className="v">
                {formatHour(av.startHour)} – {formatHour(av.endHour)}
              </span>
            </div>

            <div className="divider" />

            <div className="field" style={{ marginBottom: 12 }}>
              <label>Rate</label>
              <select
                value={activeUnit}
                onChange={(e) => {
                  setUnit(e.target.value as RateUnit)
                  setQuantity(1)
                }}
              >
                {availableUnits.map((u) => (
                  <option key={u} value={u}>
                    {formatMoney(listing.rates[u]!)} per {RATE_UNIT_LABELS[u]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field" style={{ marginBottom: 12 }}>
              <label>Start date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            {activeUnit === 'hour' && (
              <div className="field" style={{ marginBottom: 12 }}>
                <label>Start time</label>
                <select
                  value={startHour ?? ''}
                  onChange={(e) => setStartHour(e.target.value === '' ? null : Number(e.target.value))}
                >
                  <option value="">Select…</option>
                  {hourOptions.map((h) => (
                    <option key={h} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="field" style={{ marginBottom: 12 }}>
              <label>
                Duration ({RATE_UNIT_LABELS[activeUnit]}
                {quantity > 1 ? 's' : ''})
              </label>
              <input
                type="number"
                min={1}
                max={activeUnit === 'hour' ? av.endHour - av.startHour : 30}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>

            <div className="divider" />
            <div className="kv">
              <span className="k">
                {formatMoney(rate)} × {quantity} {RATE_UNIT_LABELS[activeUnit]}
                {quantity > 1 ? 's' : ''}
              </span>
              <span className="v">{formatMoney(total)}</span>
            </div>
            <div className="kv">
              <span className="k">Refundable deposit</span>
              <span className="v">{formatMoney(listing.securityDeposit)}</span>
            </div>
            <div className="kv">
              <span className="k">Due today</span>
              <span className="v" style={{ color: 'var(--gold-bright)', fontSize: 17 }}>
                {formatMoney(total + listing.securityDeposit)}
              </span>
            </div>

            {error && <div className="notice notice-red">{error}</div>}
            {confirmed && (
              <div className="notice notice-green">
                ✓ Reserved! View it under <Link to="/bookings" style={{ textDecoration: 'underline' }}>My Rentals</Link>.
                Meet at {listing.meetup.label} — or ask the owner to meet at a verification
                partner shown on the map.
              </div>
            )}

            <button
              className="btn btn-gold"
              style={{ width: '100%', marginTop: 14 }}
              disabled={!canBook}
              onClick={book}
            >
              Reserve now
            </button>
            <p style={{ color: 'var(--text-faint)', fontSize: 12, marginBottom: 0 }}>
              You won't be charged in this demo. Deposits are released after the item is
              returned and inspected.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
