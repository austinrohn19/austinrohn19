import type { ReactNode } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Browse from './pages/Browse'
import ListingDetail from './pages/ListingDetail'
import CreateListing from './pages/CreateListing'
import MapPage from './pages/MapPage'
import Bookings from './pages/Bookings'
import UserProfile from './pages/UserProfile'
import Login from './pages/Login'
import { useStore } from './store'
import { initialsOf } from './types'

function RequireAuth({ children }: { children: ReactNode }) {
  const { me, ready } = useStore()
  const location = useLocation()
  if (!ready) return null
  if (!me) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

export default function App() {
  const { me, ready, logout, demo } = useStore()
  const navigate = useNavigate()

  return (
    <>
      {ready && demo && (
        <div className="demo-banner">
          Demo mode — no server attached, so accounts and data live in this browser only. Run the
          repo locally with <code>npm run dev</code> for the full backend.
        </div>
      )}
      <nav className="navbar">
        <div className="container navbar-inner">
          <NavLink to="/" className="brand">
            Luxe<em>Lend</em>
          </NavLink>
          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Browse
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Map &amp; Verification
            </NavLink>
            {me && (
              <>
                <NavLink to="/bookings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                  My Rentals
                </NavLink>
                <NavLink
                  to={`/user/${me.id}`}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  My Profile
                </NavLink>
              </>
            )}
          </div>
          <NavLink to="/list" className="btn btn-gold btn-sm">
            + List an item
          </NavLink>
          {ready &&
            (me ? (
              <div className="nav-user">
                <NavLink to={`/user/${me.id}`} className="nav-avatar" title={me.name}>
                  {initialsOf(me.name)}
                </NavLink>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    logout()
                      .then(() => navigate('/'))
                      .catch(() => {})
                  }}
                >
                  Log out
                </button>
              </div>
            ) : (
              <NavLink to="/login" className="btn btn-outline btn-sm">
                Log in
              </NavLink>
            ))}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Browse />} />
        <Route path="/login" element={<Login />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route
          path="/list"
          element={
            <RequireAuth>
              <CreateListing />
            </RequireAuth>
          }
        />
        <Route path="/map" element={<MapPage />} />
        <Route
          path="/bookings"
          element={
            <RequireAuth>
              <Bookings />
            </RequireAuth>
          }
        />
        <Route path="/user/:id" element={<UserProfile />} />
      </Routes>
    </>
  )
}
