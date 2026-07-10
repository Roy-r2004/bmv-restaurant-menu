import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminApp } from './admin/AdminApp'
import { PublicMenuApp } from './public-menu/PublicMenuApp'
import { GuestHome } from './public-menu/GuestHome'
import { OwnerProvisionApp } from './owner/OwnerProvisionApp'

const defaultSlug = (import.meta.env.VITE_DEFAULT_SLUG as string | undefined)?.trim()

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          defaultSlug ? <Navigate to={`/m/${defaultSlug}`} replace /> : <GuestHome />
        }
      />
      <Route path="/admin" element={<AdminApp />} />
      <Route path="/owner" element={<OwnerProvisionApp />} />
      <Route path="/m/:slug" element={<PublicMenuApp />} />
    </Routes>
  )
}
