import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { useStore } from '../store'
import { pinIcon, TILE_ATTRIBUTION, TILE_URL } from '../components/markers'
import type { Category, LatLng, Listing, RateUnit } from '../types'
import { CATEGORY_LABELS, DAY_NAMES, formatHour } from '../types'

const GRADIENTS: Record<Category, [string, string]> = {
  watches: ['#1d2735', '#3d5a80'],
  jewelry: ['#2b2118', '#b08d57'],
  handbags: ['#3a3231', '#8d7b6c'],
  cars: ['#12261c', '#3fae6a'],
  art: ['#2a1f33', '#8f6bb0'],
  other: ['#20262e', '#9db4c0'],
}

const EMOJI: Record<Category, string> = {
  watches: '⌚',
  jewelry: '💎',
  handbags: '👜',
  cars: '🏎️',
  art: '🖼️',
  other: '✨',
}

function LocationPicker({
  value,
  onChange,
}: {
  value: LatLng | null
  onChange: (p: LatLng) => void
}) {
  const icon = useMemo(() => pinIcon('meetup'), [])
  function ClickHandler() {
    useMapEvents({
      click(e) {
        onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
      },
    })
    return null
  }
  return (
    <div className="map-embed">
      <MapContainer center={[40.748, -73.99]} zoom={12} scrollWheelZoom>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ClickHandler />
        {value && <Marker position={[value.lat, value.lng]} icon={icon} />}
      </MapContainer>
    </div>
  )
}

export default function CreateListing() {
  const { addListing } = useStore()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  // item details
  const [title, setTitle] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState<Category>('watches')
  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [deposit, setDeposit] = useState('')

  // rates
  const [hourRate, setHourRate] = useState('')
  const [dayRate, setDayRate] = useState('')
  const [weekRate, setWeekRate] = useState('')

  // schedule
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [startHour, setStartHour] = useState(9)
  const [endHour, setEndHour] = useState(18)

  // insurance (required)
  const [insProvider, setInsProvider] = useState('')
  const [insPolicy, setInsPolicy] = useState('')
  const [insCoverage, setInsCoverage] = useState('')
  const [insExpires, setInsExpires] = useState('')
  const [insFile, setInsFile] = useState<string | null>(null)

  // meetup
  const [meetupLabel, setMeetupLabel] = useState('')
  const [meetupLoc, setMeetupLoc] = useState<LatLng | null>(null)

  const [submitted, setSubmitted] = useState(false)

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
  }

  const errors: string[] = []
  if (submitted) {
    if (!title.trim()) errors.push('Give your item a title.')
    if (!brand.trim()) errors.push('Enter the brand or maker.')
    if (!value || Number(value) <= 0) errors.push('Enter the estimated value.')
    if (!hourRate && !dayRate && !weekRate) errors.push('Set at least one rate (hourly, daily or weekly).')
    if (days.length === 0) errors.push('Select at least one available day.')
    if (endHour <= startHour) errors.push('The pickup window must end after it starts.')
    if (!insProvider.trim() || !insPolicy.trim()) errors.push('Insurance carrier and policy number are required.')
    if (!insCoverage || Number(insCoverage) < Number(value || 0))
      errors.push('Insurance coverage must be at least the item value.')
    if (!insExpires) {
      errors.push('Enter the policy expiration date.')
    } else if (new Date(insExpires + 'T00:00:00') <= new Date()) {
      errors.push('Your insurance policy must be active (expiration in the future).')
    }
    if (!insFile) errors.push('Upload your proof-of-insurance document — listings without it cannot go live.')
    if (!meetupLoc) errors.push('Drop a pin on the map for your preferred meetup location.')
    if (!meetupLabel.trim()) errors.push('Describe the meetup location (e.g. "Diamond District, W 47th St").')
  }

  function submit() {
    setSubmitted(true)

    const rates: Partial<Record<RateUnit, number>> = {}
    if (hourRate) rates.hour = Number(hourRate)
    if (dayRate) rates.day = Number(dayRate)
    if (weekRate) rates.week = Number(weekRate)

    const valid =
      title.trim() &&
      brand.trim() &&
      Number(value) > 0 &&
      Object.keys(rates).length > 0 &&
      days.length > 0 &&
      endHour > startHour &&
      insProvider.trim() &&
      insPolicy.trim() &&
      Number(insCoverage) >= Number(value) &&
      insExpires &&
      new Date(insExpires + 'T00:00:00') > new Date() &&
      insFile &&
      meetupLoc &&
      meetupLabel.trim()

    if (!valid) return

    const listing: Listing = {
      id: `l-user-${Date.now()}`,
      title: title.trim(),
      brand: brand.trim(),
      category,
      description: description.trim() || 'No description provided.',
      estimatedValue: Number(value),
      rates,
      securityDeposit: Number(deposit) || Math.round(Number(value) * 0.15),
      availability: { daysOfWeek: days, startHour, endHour },
      insurance: {
        provider: insProvider.trim(),
        policyNumber: insPolicy.trim(),
        coverageAmount: Number(insCoverage),
        expires: insExpires,
        documentName: insFile!,
      },
      meetup: { location: meetupLoc!, label: meetupLabel.trim() },
      ownerId: 'u-you',
      emoji: EMOJI[category],
      imageGradient: GRADIENTS[category],
      verified: false,
      createdAt: new Date().toISOString(),
    }
    addListing(listing)
    navigate(`/listing/${listing.id}`)
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="container" style={{ maxWidth: 820, paddingBottom: 70 }}>
      <div className="page-head">
        <h1>List a luxury item</h1>
        <p>
          Set your own schedule and rates. Proof of insurance that <strong>you hold on the
          item</strong> is required before the listing can go live.
        </p>
      </div>

      <div className="panel">
        <div className="form-section">
          <h3>1 · Item details</h3>
          <div className="form-grid">
            <div className="field full">
              <label>
                Title <span className="req">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Audemars Piguet Royal Oak 15500ST"
              />
            </div>
            <div className="field">
              <label>
                Brand / maker <span className="req">*</span>
              </label>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Audemars Piguet" />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>
                Estimated value (USD) <span className="req">*</span>
              </label>
              <input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} placeholder="45000" />
            </div>
            <div className="field">
              <label>Security deposit (USD)</label>
              <input
                type="number"
                min={0}
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="Defaults to 15% of value"
              />
            </div>
            <div className="field full">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Condition, box & papers, occasion ideas…"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>2 · Rates</h3>
          <p className="hint">Set a rate per hour, day and/or week — at least one is required.</p>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="field">
              <label>Per hour ($)</label>
              <input type="number" min={0} value={hourRate} onChange={(e) => setHourRate(e.target.value)} placeholder="—" />
            </div>
            <div className="field">
              <label>Per day ($)</label>
              <input type="number" min={0} value={dayRate} onChange={(e) => setDayRate(e.target.value)} placeholder="—" />
            </div>
            <div className="field">
              <label>Per week ($)</label>
              <input type="number" min={0} value={weekRate} onChange={(e) => setWeekRate(e.target.value)} placeholder="—" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>3 · Schedule &amp; availability</h3>
          <p className="hint">Pick the days renters can book, and your pickup/return window.</p>
          <div className="day-dots" style={{ marginBottom: 14 }}>
            {DAY_NAMES.map((d, i) => (
              <button
                key={d}
                type="button"
                className={`day-dot${days.includes(i) ? ' on' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => toggleDay(i)}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Window opens</label>
              <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}>
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Window closes</label>
              <select value={endHour} onChange={(e) => setEndHour(Number(e.target.value))}>
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>4 · Proof of insurance</h3>
          <div className="insurance-callout">
            <strong>Required to list.</strong> You must personally hold an active policy covering
            this item (e.g. Jewelers Mutual, Chubb Valuable Articles, Hagerty for vehicles) with
            coverage of at least the item's value, and upload the proof document.
          </div>
          <div className="form-grid">
            <div className="field">
              <label>
                Insurance carrier <span className="req">*</span>
              </label>
              <input value={insProvider} onChange={(e) => setInsProvider(e.target.value)} placeholder="e.g. Jewelers Mutual" />
            </div>
            <div className="field">
              <label>
                Policy number <span className="req">*</span>
              </label>
              <input value={insPolicy} onChange={(e) => setInsPolicy(e.target.value)} placeholder="e.g. JM-12345-NY" />
            </div>
            <div className="field">
              <label>
                Coverage amount (USD) <span className="req">*</span>
              </label>
              <input type="number" min={0} value={insCoverage} onChange={(e) => setInsCoverage(e.target.value)} placeholder="≥ item value" />
            </div>
            <div className="field">
              <label>
                Policy expiration <span className="req">*</span>
              </label>
              <input type="date" value={insExpires} onChange={(e) => setInsExpires(e.target.value)} />
            </div>
            <div className="field full">
              <label>
                Proof-of-insurance document <span className="req">*</span>
              </label>
              <div
                className={`file-drop${insFile ? ' has-file' : ''}`}
                onClick={() => fileRef.current?.click()}
              >
                {insFile ? `📄 ${insFile} — attached` : '📎 Click to upload your policy declaration page (PDF, image)'}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                onChange={(e) => setInsFile(e.target.files?.[0]?.name ?? null)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>5 · Meetup location</h3>
          <p className="hint">
            Click the map to drop your preferred handoff pin. Renters can also propose meeting at
            a nearby verification partner (jeweler / dealer) — see the Map &amp; Verification page.
          </p>
          <LocationPicker value={meetupLoc} onChange={setMeetupLoc} />
          <div className="field" style={{ marginTop: 12 }}>
            <label>
              Location description <span className="req">*</span>
            </label>
            <input
              value={meetupLabel}
              onChange={(e) => setMeetupLabel(e.target.value)}
              placeholder='e.g. "Lobby of the Baccarat Hotel, W 53rd St"'
            />
          </div>
        </div>

        {errors.length > 0 && (
          <div className="notice notice-red" style={{ marginBottom: 14 }}>
            <strong>Before this can go live:</strong>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <button className="btn btn-gold" style={{ width: '100%' }} onClick={submit}>
          Publish listing
        </button>
      </div>
    </div>
  )
}
