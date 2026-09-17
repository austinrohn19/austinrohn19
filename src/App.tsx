import { NavLink, Route, Routes } from 'react-router-dom'
import Browse from './pages/Browse'
import ListingDetail from './pages/ListingDetail'
import CreateListing from './pages/CreateListing'
import MapPage from './pages/MapPage'
import Bookings from './pages/Bookings'
import UserProfile from './pages/UserProfile'

export default function App() {
  return (
    <>
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
            <NavLink to="/bookings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              My Rentals
            </NavLink>
            <NavLink to="/user/u-you" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              My Profile
            </NavLink>
          </div>
          <NavLink to="/list" className="btn btn-gold btn-sm">
            + List an item
          </NavLink>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Browse />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/list" element={<CreateListing />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/user/:id" element={<UserProfile />} />
      </Routes>
    </>
  )
}
