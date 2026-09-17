import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import { useStore } from '../store'
import type { Category } from '../types'
import { CATEGORY_LABELS } from '../types'

const CATEGORIES: (Category | 'all')[] = ['all', 'watches', 'jewelry', 'handbags', 'cars', 'art', 'other']

export default function Browse() {
  const { listings } = useStore()
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return listings.filter((l) => {
      if (category !== 'all' && l.category !== category) return false
      if (!q) return true
      return (
        l.title.toLowerCase().includes(q) ||
        l.brand.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      )
    })
  }, [listings, category, query])

  return (
    <>
      <header className="hero">
        <div className="container">
          <h1>
            Rent the <em>extraordinary</em>.
          </h1>
          <p>
            A peer-to-peer marketplace for luxury watches, jewelry, handbags and cars.
            Every item is backed by owner-held insurance, and every handoff can happen at
            a vetted local jeweler or dealer for on-the-spot authentication.
          </p>
          <Link to="/list" className="btn btn-gold">
            List your luxury item
          </Link>
          <div className="hero-badges">
            <span className="hero-badge">🛡 Proof of insurance required on every listing</span>
            <span className="hero-badge">📍 Verified meetup &amp; authentication network</span>
            <span className="hero-badge">🕑 Hourly, daily &amp; weekly rates</span>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="filter-bar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`chip${category === c ? ' active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c === 'all' ? 'All items' : CATEGORY_LABELS[c]}
            </button>
          ))}
          <input
            className="search-input"
            placeholder="Search brands, models…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty">No items match that search — try another category.</div>
        ) : (
          <div className="grid">
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        LuxeLend — every rental is insured by its owner and verifiable at a local partner. Demo build.
      </footer>
    </>
  )
}
