import { Link } from 'react-router-dom'
import type { Listing } from '../types'
import { CATEGORY_LABELS, formatMoney } from '../types'

export default function ListingCard({ listing }: { listing: Listing }) {
  const [c1, c2] = listing.imageGradient
  return (
    <Link to={`/listing/${listing.id}`} className="card">
      <div
        className="card-media"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      >
        <div className="ribbon">
          <span className="pill pill-insured">🛡 Insured</span>
          {listing.verified && <span className="pill pill-verified">✓ Verified</span>}
        </div>
        <span>{listing.emoji}</span>
      </div>
      <div className="card-body">
        <div className="card-brand">
          {listing.brand} · {CATEGORY_LABELS[listing.category]}
        </div>
        <div className="card-title">{listing.title}</div>
        <div className="card-rates">
          {listing.rates.hour !== undefined && (
            <span className="rate">
              <strong>{formatMoney(listing.rates.hour)}</strong>/hr
            </span>
          )}
          {listing.rates.day !== undefined && (
            <span className="rate">
              <strong>{formatMoney(listing.rates.day)}</strong>/day
            </span>
          )}
          {listing.rates.week !== undefined && (
            <span className="rate">
              <strong>{formatMoney(listing.rates.week)}</strong>/wk
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
