import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminApp } from './admin/AdminApp'
import { PublicMenuApp } from './public-menu/PublicMenuApp'
import { GuestHome } from './public-menu/GuestHome'

const defaultSlug = (import.meta.env.VITE_DEFAULT_SLUG as string | undefined)?.trim()

export default function App() {
  return (
    <Routes>
      {/* Guest menu is the product surface — no login. Optional default slug for single-tenant deploys. */}
      <Route
        path="/"
        element={
          defaultSlug ? <Navigate to={`/m/${defaultSlug}`} replace /> : <GuestHome />
        }
      />
      <Route path="/admin" element={<AdminApp />} />
      <Route path="/m/:slug" element={<PublicMenuApp />} />
    </Routes>
  )
}
