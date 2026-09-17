import { PARTNERS } from '../data/seed'
import { useStore } from '../store'
import type { Booking, Listing } from '../types'
import {
  OWNER_FEE_RATE,
  RATE_UNIT_LABELS,
  SERVICE_FEE_RATE,
  formatHour,
  formatMoney,
  ownerFeeFor,
} from '../types'

function docId(prefix: string, bookingId: string): string {
  return `${prefix}-${bookingId.replace(/^b-/, '').toUpperCase()}`
}

/** Itemized receipt — the renter's payment or the owner's payout. */
export function ReceiptDetails({
  booking,
  listing,
  perspective,
}: {
  booking: Booking
  listing: Listing
  perspective: 'renter' | 'owner'
}) {
  const rate = listing.rates[booking.unit] ?? booking.total / booking.quantity
  const ownerFee = ownerFeeFor(booking.total)

  return (
    <details className="doc">
      <summary>
        🧾 {perspective === 'renter' ? 'Receipt' : 'Payout statement'} ·{' '}
        {docId('LL-R', booking.id)}
      </summary>
      <div className="doc-body">
        <div className="doc-meta">
          Issued {new Date(booking.createdAt).toLocaleDateString()} ·{' '}
          {perspective === 'renter' ? 'Paid with Visa •• 4242 (demo)' : 'Payout to bank •• 8071 (demo)'}
        </div>
        <table className="receipt-table">
          <tbody>
            <tr>
              <td>
                Rental — {formatMoney(rate)} × {booking.quantity}{' '}
                {RATE_UNIT_LABELS[booking.unit]}
                {booking.quantity > 1 ? 's' : ''}
              </td>
              <td>{formatMoney(booking.total)}</td>
            </tr>
            {perspective === 'renter' ? (
              <>
                <tr>
                  <td>LuxeLend service fee ({Math.round(SERVICE_FEE_RATE * 100)}%)</td>
                  <td>{formatMoney(booking.serviceFee)}</td>
                </tr>
                <tr>
                  <td>Security deposit (refunded on return)</td>
                  <td>{formatMoney(booking.deposit)}</td>
                </tr>
                <tr className="total">
                  <td>Total charged</td>
                  <td>{formatMoney(booking.total + booking.serviceFee + booking.deposit)}</td>
                </tr>
                <tr>
                  <td>Deposit refund after inspection</td>
                  <td>−{formatMoney(booking.deposit)}</td>
                </tr>
              </>
            ) : (
              <>
                <tr>
                  <td>LuxeLend owner fee ({Math.round(OWNER_FEE_RATE * 100)}%)</td>
                  <td>−{formatMoney(ownerFee)}</td>
                </tr>
                <tr className="total">
                  <td>Net payout</td>
                  <td>{formatMoney(booking.total - ownerFee)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </details>
  )
}

/** The rental agreement generated for a booking, accepted by both parties. */
export function ContractDetails({
  booking,
  listing,
}: {
  booking: Booking
  listing: Listing
}) {
  const { getUser } = useStore()
  const owner = getUser(listing.ownerId)
  const renter = getUser(booking.renterId)
  const authenticator = PARTNERS.find((p) => p.id === listing.authenticatedBy)
  const accepted = new Date(booking.createdAt).toLocaleDateString()

  return (
    <details className="doc">
      <summary>📜 Rental agreement · {docId('LL-C', booking.id)}</summary>
      <div className="doc-body contract">
        <h4>LuxeLend Rental Agreement</h4>
        <p>
          <strong>Parties.</strong> {owner?.name ?? 'The Owner'} (&ldquo;Owner&rdquo;) and{' '}
          {renter?.name ?? 'The Renter'} (&ldquo;Renter&rdquo;), through the LuxeLend platform.
        </p>
        <p>
          <strong>Item.</strong> {listing.title} by {listing.brand}, declared value{' '}
          {formatMoney(listing.estimatedValue)}.
        </p>
        <p>
          <strong>Rental period.</strong> Beginning {booking.date}
          {booking.unit === 'hour' ? ` at ${formatHour(booking.startHour)}` : ''} for{' '}
          {booking.quantity} {RATE_UNIT_LABELS[booking.unit]}
          {booking.quantity > 1 ? 's' : ''}. Pickup and return within the Owner's window of{' '}
          {formatHour(listing.availability.startHour)}–{formatHour(listing.availability.endHour)}.
        </p>
        <p>
          <strong>Payment.</strong> Rental total {formatMoney(booking.total)} plus platform
          service fee {formatMoney(booking.serviceFee)}. A refundable security deposit of{' '}
          {formatMoney(booking.deposit)} is held and released after return and inspection.
        </p>
        <p>
          <strong>Insurance.</strong> Owner warrants an active policy held in Owner's own name —{' '}
          {listing.insurance.provider}, policy {listing.insurance.policyNumber}, coverage{' '}
          {formatMoney(listing.insurance.coverageAmount)}, valid through{' '}
          {listing.insurance.expires} — and that proof of insurance is on file with LuxeLend.
        </p>
        <p>
          <strong>Authentication.</strong>{' '}
          {authenticator
            ? `Item authenticated by ${authenticator.name} (${authenticator.type}) on ${listing.authenticatedOn}. Either party may request re-verification at a LuxeLend partner at handoff.`
            : 'Either party may request verification of the item at a LuxeLend partner (jeweler, dealer or authentication lab) at handoff before the rental begins.'}
        </p>
        <p>
          <strong>Renter obligations.</strong> Renter shall return the item in the condition
          received, at the agreed meetup location ({listing.meetup.label}) or a mutually agreed
          LuxeLend verification partner. Renter is liable for loss or damage up to the deposit;
          amounts beyond the deposit are handled under the Owner's policy, with the Renter
          responsible for the policy deductible.
        </p>
        <p>
          <strong>Acceptance.</strong> Executed electronically by both parties via LuxeLend on{' '}
          {accepted}.
        </p>
      </div>
    </details>
  )
}
