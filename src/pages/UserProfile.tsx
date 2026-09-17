import { Link, useParams } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import { ContractDetails, ReceiptDetails } from '../components/RentalDocs'
import { getUser, PARTNERS } from '../data/seed'
import { useStore } from '../store'
import {
  RATE_UNIT_LABELS,
  directionsUrl,
  formatHour,
  formatMoney,
  initialsOf,
  ownerFeeFor,
} from '../types'

export default function UserProfile() {
  const { id } = useParams()
  const { listings, bookings } = useStore()
  const user = getUser(id ?? '')

  if (!user) {
    return (
      <div className="container">
        <div className="empty">
          User not found. <Link to="/">Back to browse</Link>
        </div>
      </div>
    )
  }

  const isYou = user.id === 'u-you'
  const owned = listings.filter((l) => l.ownerId === user.id)
  const ownedIds = new Set(owned.map((l) => l.id))
  const rented = bookings.filter((b) => b.renterId === user.id)
  const hosted = bookings.filter((b) => ownedIds.has(b.listingId))

  const totalSpent = rented.reduce((s, b) => s + b.total + b.serviceFee, 0)
  const totalEarned = hosted.reduce((s, b) => s + b.total - ownerFeeFor(b.total), 0)

  const authentications = [
    ...owned.map((l) => ({
      listing: l,
      role: isYou ? 'Listed by you' : `Listed by ${user.name}`,
    })),
    ...rented
      .map((b) => listings.find((l) => l.id === b.listingId))
      .filter((l): l is NonNullable<typeof l> => Boolean(l))
      .map((l) => ({ listing: l, role: isYou ? 'Rented by you' : `Rented by ${user.name}` })),
  ]
    .filter(({ listing }) => listing.authenticatedBy)
    .filter(
      // dedupe: an item can appear as both owned and rented
      (entry, i, arr) => arr.findIndex((e) => e.listing.id === entry.listing.id) === i,
    )

  const findListing = (listingId: string) => listings.find((l) => l.id === listingId)

  return (
    <div className="container" style={{ paddingBottom: 70 }}>
      {/* ---------- header ---------- */}
      <div className="panel profile-head" style={{ marginTop: 28 }}>
        <div className="avatar">{initialsOf(user.name)}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 32 }}>
            {user.name}
            {isYou && <span className="pill pill-gold" style={{ marginLeft: 10, verticalAlign: 'middle' }}>Your account</span>}
          </h1>
          <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            ★ {user.rating.toFixed(1)} · {user.location} · Member since{' '}
            {new Date(user.memberSince + 'T00:00:00').toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <p style={{ color: 'var(--text-dim)', margin: '8px 0 0', maxWidth: 640 }}>{user.bio}</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="n">{owned.length}</div>
          <div className="l">Items listed</div>
        </div>
        <div className="stat">
          <div className="n">{rented.length}</div>
          <div className="l">Items rented</div>
        </div>
        <div className="stat">
          <div className="n">{hosted.length}</div>
          <div className="l">Rentals hosted</div>
        </div>
        <div className="stat">
          <div className="n">{formatMoney(totalEarned)}</div>
          <div className="l">Earned (net)</div>
        </div>
        <div className="stat">
          <div className="n">{formatMoney(totalSpent)}</div>
          <div className="l">Spent</div>
        </div>
      </div>

      {/* ---------- items listed ---------- */}
      <section className="profile-section">
        <h2>Items listed{isYou ? ' by you' : ''}</h2>
        {owned.length === 0 ? (
          <div className="empty" style={{ padding: '24px 0' }}>
            No items listed yet.
            {isYou && (
              <>
                {' '}
                <Link to="/list" style={{ color: 'var(--gold-bright)' }}>
                  List your first item →
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid" style={{ paddingBottom: 0 }}>
            {owned.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- rentals as renter ---------- */}
      <section className="profile-section">
        <h2>Rental history — items {isYou ? 'you' : user.name} rented</h2>
        {rented.length === 0 ? (
          <div className="empty" style={{ padding: '24px 0' }}>No rentals yet.</div>
        ) : (
          rented.map((b) => {
            const l = findListing(b.listingId)
            if (!l) return null
            return (
              <div className="history-row" key={b.id}>
                <div className="history-main">
                  <span className="history-emoji">{l.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div className="t">
                      <Link to={`/listing/${l.id}`}>{l.title}</Link>
                    </div>
                    <div className="m">
                      {b.date}
                      {b.unit === 'hour' ? ` · ${formatHour(b.startHour)}` : ''} · {b.quantity}{' '}
                      {RATE_UNIT_LABELS[b.unit]}
                      {b.quantity > 1 ? 's' : ''} · owner{' '}
                      <Link to={`/user/${l.ownerId}`} style={{ color: 'var(--gold-bright)' }}>
                        {getUser(l.ownerId)?.name ?? 'Unknown'}
                      </Link>
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
      </section>

      {/* ---------- rentals as owner ---------- */}
      <section className="profile-section">
        <h2>Rented out — bookings on {isYou ? 'your' : `${user.name}'s`} items</h2>
        {hosted.length === 0 ? (
          <div className="empty" style={{ padding: '24px 0' }}>No bookings on listed items yet.</div>
        ) : (
          hosted.map((b) => {
            const l = findListing(b.listingId)
            if (!l) return null
            return (
              <div className="history-row" key={b.id}>
                <div className="history-main">
                  <span className="history-emoji">{l.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div className="t">
                      <Link to={`/listing/${l.id}`}>{l.title}</Link>
                    </div>
                    <div className="m">
                      {b.date} · {b.quantity} {RATE_UNIT_LABELS[b.unit]}
                      {b.quantity > 1 ? 's' : ''} · rented by{' '}
                      <Link to={`/user/${b.renterId}`} style={{ color: 'var(--gold-bright)' }}>
                        {getUser(b.renterId)?.name ?? 'Unknown'}
                      </Link>
                    </div>
                  </div>
                  <div className="booking-total">
                    +{formatMoney(b.total - ownerFeeFor(b.total))}
                  </div>
                </div>
                <div className="history-docs">
                  <ReceiptDetails booking={b} listing={l} perspective="owner" />
                  <ContractDetails booking={b} listing={l} />
                </div>
              </div>
            )
          })
        )}
      </section>

      {/* ---------- authentications ---------- */}
      <section className="profile-section">
        <h2>Authentications — jewelers &amp; dealers that verified these items</h2>
        {authentications.length === 0 ? (
          <div className="empty" style={{ padding: '24px 0' }}>
            No authenticated items yet. Items can be verified at any partner on the{' '}
            <Link to="/map" style={{ color: 'var(--gold-bright)' }}>
              Map &amp; Verification
            </Link>{' '}
            page.
          </div>
        ) : (
          <div className="panel" style={{ padding: '8px 22px' }}>
            {authentications.map(({ listing, role }) => {
              const partner = PARTNERS.find((p) => p.id === listing.authenticatedBy)
              if (!partner) return null
              return (
                <div className="kv" key={listing.id}>
                  <span className="k">
                    {listing.emoji}{' '}
                    <Link to={`/listing/${listing.id}`} style={{ color: 'var(--text)' }}>
                      {listing.title}
                    </Link>{' '}
                    <span style={{ color: 'var(--text-faint)' }}>({role})</span>
                  </span>
                  <span className="v">
                    ✓ {partner.name} · {listing.authenticatedOn} ·{' '}
                    <a
                      href={directionsUrl(partner.location)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--gold-bright)' }}
                    >
                      navigate
                    </a>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ---------- terms ---------- */}
      <section className="profile-section">
        <h2>Terms &amp; agreements</h2>
        <div className="panel">
          <details className="doc" open={false}>
            <summary>
              📋 LuxeLend Platform Terms (v1.2) — accepted{' '}
              {new Date(user.memberSince + 'T00:00:00').toLocaleDateString()}
            </summary>
            <div className="doc-body contract">
              <p>
                <strong>1 · Proof of insurance.</strong> Owners must personally hold an active
                policy covering each listed item for at least its declared value, and keep the
                proof document on file. Listings with lapsed coverage are suspended.
              </p>
              <p>
                <strong>2 · Authentication.</strong> Either party may require verification of an
                item at a LuxeLend partner (jeweler, dealer or authentication lab) before a
                rental begins. Verified items carry the ✓ Authenticated badge.
              </p>
              <p>
                <strong>3 · Deposits &amp; liability.</strong> Security deposits are held for the
                rental period and released after return and inspection. Renters are liable up to
                the deposit; excess claims run through the owner's insurance.
              </p>
              <p>
                <strong>4 · Fees.</strong> Renters pay a 12% service fee per booking; owners pay
                a 3% payout fee. Listing is free.
              </p>
              <p>
                <strong>5 · Meetups.</strong> Handoffs occur at the listing's meetup point or a
                mutually agreed verification partner. Off-platform exchanges void LuxeLend
                protections.
              </p>
            </div>
          </details>
          <p style={{ color: 'var(--text-faint)', fontSize: 12.5, margin: '10px 0 0' }}>
            Per-rental contracts are attached to each rental above and remain available here for
            the life of the account.
          </p>
        </div>
      </section>
    </div>
  )
}
