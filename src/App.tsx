import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminApp } from './admin/AdminApp'
import { PublicMenuApp } from './public-menu/PublicMenuApp'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<AdminApp />} />
      <Route path="/m/:slug" element={<PublicMenuApp />} />
    </Routes>
  )
}
