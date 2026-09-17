import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { RATE_UNIT_LABELS, formatHour, formatMoney } from '../types'

export default function Bookings() {
  const { bookings, getListing } = useStore()

  return (
    <div className="container" style={{ paddingBottom: 70 }}>
      <div className="page-head">
        <h1>My Rentals</h1>
        <p>Your reservations, with meetup details for each handoff.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="empty">
          No rentals yet. <Link to="/" style={{ color: 'var(--gold-bright)' }}>Browse the marketplace →</Link>
        </div>
      ) : (
        bookings.map((b) => {
          const l = getListing(b.listingId)
          if (!l) return null
          return (
            <div className="booking-row" key={b.id}>
              <div
                className="booking-emoji"
                style={{
                  background: `linear-gradient(135deg, ${l.imageGradient[0]}, ${l.imageGradient[1]})`,
                  borderRadius: 12,
                  width: 56,
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {l.emoji}
              </div>
              <div className="booking-info">
                <div className="t">
                  <Link to={`/listing/${l.id}`}>{l.title}</Link>
                </div>
                <div className="m">
                  {b.date}
                  {b.unit === 'hour' ? ` · starts ${formatHour(b.startHour)}` : ''} · {b.quantity}{' '}
                  {RATE_UNIT_LABELS[b.unit]}
                  {b.quantity > 1 ? 's' : ''} · meetup: {l.meetup.label}
                </div>
                <div className="m">
                  🛡 Covered by {l.insurance.provider} · deposit {formatMoney(b.deposit)} (refundable)
                </div>
              </div>
              <div className="booking-total">{formatMoney(b.total)}</div>
            </div>
          )
        })
      )}
    </div>
  )
}
