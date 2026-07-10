import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../shared/api'

/**
 * BMV platform-owner surface: create restaurant accounts.
 * Restaurant staff then sign in at /admin and manage their own menu.
 */
export function OwnerProvisionApp() {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<{
    name: string
    username: string
    password: string
    slug: string
  } | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setCreated(null)
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const username = String(fd.get('username') || '').trim()
    const password = String(fd.get('password') || '')
    const slug = String(fd.get('slug') || '').trim() || undefined
    if (!name || !username || password.length < 6) {
      setError('Name, username, and password (6+ chars) are required')
      return
    }
    setBusy(true)
    try {
      const biz = await api.createBusiness({
        name,
        admin_username: username,
        admin_password: password,
        public_slug: slug,
      })
      setCreated({
        name: biz.name,
        username,
        password,
        slug: biz.public_slug,
      })
      e.currentTarget.reset()
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grain relative min-h-screen bg-ink px-6 py-16 text-bone">
      <div className="mx-auto max-w-lg animate-rise">
        <p className="text-xs uppercase tracking-[0.35em] text-copper">BMV · Platform owner</p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-5xl">
          Provision a restaurant.
        </h1>
        <p className="mt-4 text-bone-dim">
          You create the account. They sign in at the kitchen, set up their menu, and share their
          public guest link — guests never log in.
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-4 rounded-3xl border border-bone/10 bg-plate p-6">
          <label className="block text-sm text-bone-dim">
            Restaurant name
            <input
              name="name"
              required
              placeholder="Ember & Rye"
              className="mt-1 w-full rounded-xl border border-bone/15 bg-ink px-3 py-2 text-bone"
            />
          </label>
          <label className="block text-sm text-bone-dim">
            Public slug <span className="text-bone/40">(optional — auto from name)</span>
            <input
              name="slug"
              placeholder="ember-rye"
              className="mt-1 w-full rounded-xl border border-bone/15 bg-ink px-3 py-2 text-bone"
            />
          </label>
          <label className="block text-sm text-bone-dim">
            Admin username
            <input
              name="username"
              required
              autoComplete="off"
              placeholder="ember"
              className="mt-1 w-full rounded-xl border border-bone/15 bg-ink px-3 py-2 text-bone"
            />
          </label>
          <label className="block text-sm text-bone-dim">
            Admin password
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-bone/15 bg-ink px-3 py-2 text-bone"
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-full bg-copper px-5 py-3 font-medium text-ink hover:bg-copper-glow disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create restaurant account'}
          </button>
        </form>

        {created && (
          <div className="mt-6 space-y-2 rounded-3xl border border-sage/30 bg-sage/10 p-5 text-sm">
            <p className="font-display text-xl text-bone">{created.name} is ready</p>
            <p>
              Username: <code className="text-copper">{created.username}</code>
            </p>
            <p>
              Password: <code className="text-copper">{created.password}</code>
            </p>
            <p>
              Guest menu:{' '}
              <Link className="text-copper underline" to={`/m/${created.slug}`}>
                /m/{created.slug}
              </Link>
            </p>
            <p className="text-bone-dim">Give them the kitchen link and credentials — they manage the menu.</p>
            <Link
              to="/admin"
              className="mt-2 inline-block rounded-full border border-bone/25 px-4 py-2 text-bone"
            >
              Open kitchen login →
            </Link>
          </div>
        )}

        <p className="mt-8 text-sm text-bone-dim">
          Restaurant staff?{' '}
          <Link to="/admin" className="text-copper underline-offset-4 hover:underline">
            Sign in to your kitchen
          </Link>
        </p>
      </div>
    </div>
  )
}
