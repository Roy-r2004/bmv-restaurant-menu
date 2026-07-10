import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/** Public entry with zero auth — guests only need the restaurant slug (or a direct /m/:slug link). */
export function GuestHome() {
  const navigate = useNavigate()
  const [slug, setSlug] = useState('')

  function openMenu(e: FormEvent) {
    e.preventDefault()
    const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!clean) return
    navigate(`/m/${clean}`)
  }

  return (
    <div className="grain relative flex min-h-screen flex-col justify-center bg-ink px-6 py-16 text-bone">
      <div className="pointer-events-none absolute right-0 top-10 h-72 w-72 rounded-full bg-copper/20 blur-3xl" />
      <div className="relative z-10 mx-auto w-full max-w-xl animate-rise">
        <p className="text-xs uppercase tracking-[0.4em] text-copper">Plate</p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight md:text-6xl">
          Tonight&apos;s menu, no login.
        </h1>
        <p className="mt-4 text-bone-dim">
          Open any restaurant&apos;s tasting room with their public link. Staff use the kitchen —
          guests never need an account.
        </p>
        <form onSubmit={openMenu} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="restaurant-slug"
            className="flex-1 rounded-full border border-bone/15 bg-plate px-5 py-3 text-bone"
            aria-label="Restaurant slug"
          />
          <button
            type="submit"
            className="rounded-full bg-copper px-6 py-3 font-medium text-ink transition hover:bg-copper-glow"
          >
            View menu
          </button>
        </form>
        <p className="mt-8 text-sm text-bone-dim">
          Restaurant owner?{' '}
          <Link to="/admin" className="text-copper underline-offset-4 hover:underline">
            Sign in to the kitchen
          </Link>
        </p>
      </div>
    </div>
  )
}
