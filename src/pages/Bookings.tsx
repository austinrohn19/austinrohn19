import { Link } from 'react-router-dom'
import { ContractDetails, ReceiptDetails } from '../components/RentalDocs'
import { getUser } from '../data/seed'
import { useStore } from '../store'
import { RATE_UNIT_LABELS, formatHour, formatMoney } from '../types'

export default function Bookings() {
  const { bookings, getListing } = useStore()
  const mine = bookings.filter((b) => b.renterId === 'u-you')

  return (
    <div className="container" style={{ paddingBottom: 70 }}>
      <div className="page-head">
        <h1>My Rentals</h1>
        <p>
          Your reservations with meetup details, receipts and rental agreements. Your full
          history also lives on{' '}
          <Link to="/user/u-you" style={{ color: 'var(--gold-bright)' }}>
            your profile
          </Link>
          .
        </p>
      </div>

      {mine.length === 0 ? (
        <div className="empty">
          No rentals yet. <Link to="/" style={{ color: 'var(--gold-bright)' }}>Browse the marketplace →</Link>
        </div>
      ) : (
        mine.map((b) => {
          const l = getListing(b.listingId)
          if (!l) return null
          return (
            <div className="history-row" key={b.id}>
              <div className="history-main">
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
                <div style={{ flex: 1 }}>
                  <div className="t">
                    <Link to={`/listing/${l.id}`}>{l.title}</Link>
                  </div>
                  <div className="m">
                    {b.date}
                    {b.unit === 'hour' ? ` · starts ${formatHour(b.startHour)}` : ''} · {b.quantity}{' '}
                    {RATE_UNIT_LABELS[b.unit]}
                    {b.quantity > 1 ? 's' : ''} · meetup: {l.meetup.label} · owner{' '}
                    <Link to={`/user/${l.ownerId}`} style={{ color: 'var(--gold-bright)' }}>
                      {getUser(l.ownerId)?.name ?? 'LuxeLend member'}
                    </Link>
                  </div>
                  <div className="m">
                    🛡 Covered by {l.insurance.provider} · deposit {formatMoney(b.deposit)} (refundable)
                  </div>
                </div>
                <div className="booking-total">{formatMoney(b.total + b.serviceFee)}</div>
              </div>
              <div className="history-docs">
                <ReceiptDetails booking={b} listing={l} perspective="renter" />
                <ContractDetails booking={b} listing={l} />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
