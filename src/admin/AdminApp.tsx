import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, assetUrl, formatPrice, type MenuItem } from '../shared/api'
import { DishViewer } from '../shared/DishViewer'

const STORAGE_KEY = 'plate_admin_session'

type Session = {
  apiKey: string
  businessId: number
  businessName: string
  publicSlug: string
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function AdminApp() {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [items, setItems] = useState<MenuItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId],
  )

  async function refresh(s: Session) {
    const list = await api.listMenuItems(s.businessId, s.apiKey)
    setItems(list.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id))
  }

  useEffect(() => {
    if (!session) return
    refresh(session).catch((e) => setError(String(e.message || e)))
  }, [session])

  function persist(s: Session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    setSession(s)
  }

  async function onGate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const username = String(fd.get('username') || '').trim()
    const password = String(fd.get('password') || '')
    setBusy(true)
    try {
      const logged = await api.login(username, password)
      if (!logged.public_slug) {
        throw new Error('This account has no public menu slug yet')
      }
      persist({
        apiKey: logged.api_key,
        businessId: logged.business_id,
        businessName: logged.name,
        publicSlug: logged.public_slug,
      })
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  if (!session) {
    return (
      <div className="grain relative min-h-screen bg-ink px-6 py-16">
        <div className="mx-auto max-w-lg animate-rise">
          <p className="text-xs uppercase tracking-[0.35em] text-copper">Plate · Kitchen</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-bone">
            Your restaurant kitchen.
          </h1>
          <p className="mt-4 text-bone-dim">
            Sign in with the username and password BMV set up for your store. Manage your menu here —
            guests open your public link with no login.
          </p>
          <form onSubmit={onGate} className="mt-10 space-y-4 rounded-3xl border border-bone/10 bg-plate p-6">
            <label className="block text-sm text-bone-dim">
              Username
              <input
                name="username"
                autoComplete="username"
                required
                placeholder="ember"
                className="mt-1 w-full rounded-xl border border-bone/15 bg-ink px-3 py-2 text-bone"
              />
            </label>
            <label className="block text-sm text-bone-dim">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 w-full rounded-xl border border-bone/15 bg-ink px-3 py-2 text-bone"
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              disabled={busy}
              className="animate-glow w-full rounded-full bg-copper px-5 py-3 font-medium text-ink transition hover:bg-copper-glow"
            >
              {busy ? 'Opening…' : 'Enter kitchen'}
            </button>
          </form>
          <p className="mt-6 text-sm text-bone-dim">
            BMV staff provisioning a new restaurant?{' '}
            <Link to="/owner" className="text-copper underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grain min-h-screen bg-ink text-bone">
      <header className="sticky top-0 z-20 border-b border-bone/10 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-copper">Plate kitchen</p>
            <h1 className="font-display text-2xl text-bone">{session.businessName}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              to={`/m/${session.publicSlug}`}
              className="rounded-full border border-copper/40 px-4 py-2 text-copper transition hover:bg-copper/10"
            >
              Guest menu → /m/{session.publicSlug}
            </Link>
            <button
              className="text-bone-dim underline-offset-4 hover:underline"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY)
                setSession(null)
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_1.1fr]">
        <section className="animate-rise space-y-6">
          <AiDraftPanel
            session={session}
            onCreated={async () => {
              await refresh(session)
            }}
            onError={setError}
          />
          <ManualAddPanel
            session={session}
            onCreated={async () => {
              await refresh(session)
            }}
            onError={setError}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <ul className="space-y-3">
            {items.map((item, idx) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    selectedId === item.id
                      ? 'border-copper bg-plate'
                      : 'border-bone/10 bg-ink-soft hover:border-bone/25'
                  }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl">{item.name}</p>
                      <p className="mt-1 text-sm text-bone-dim">
                        {item.category || 'Uncategorized'} · {formatPrice(item.price_cents)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {!item.ingredients_confirmed && (
                        <span className="rounded-full bg-danger/20 px-2 py-0.5 text-[11px] uppercase tracking-wider text-danger">
                          Confirm ingredients
                        </span>
                      )}
                      {item.model_3d_url && (
                        <span className="rounded-full bg-sage/20 px-2 py-0.5 text-[11px] uppercase tracking-wider text-sage">
                          3D ready
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {items.length === 0 && (
              <p className="rounded-2xl border border-dashed border-bone/20 p-8 text-center text-bone-dim">
                No dishes yet — draft from a photo or add one by hand.
              </p>
            )}
          </ul>
        </section>

        <section className="animate-rise lg:sticky lg:top-24 lg:self-start">
          {selected ? (
            <ItemEditor
              item={selected}
              session={session}
              onSaved={async () => {
                await refresh(session)
              }}
              onError={setError}
            />
          ) : (
            <div className="flex h-80 items-center justify-center rounded-[2rem] border border-bone/10 bg-plate text-bone-dim">
              Select a dish to edit, confirm allergens, and attach 3D.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function AiDraftPanel({
  session,
  onCreated,
  onError,
}: {
  session: Session
  onCreated: () => Promise<void>
  onError: (m: string | null) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<{
    name: string
    description: string
    allergens: string
    photoUrl: string
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [price, setPrice] = useState('18')

  async function runDraft() {
    if (!file) return
    setBusy(true)
    onError(null)
    try {
      const up = await api.upload(file, session.apiKey)
      const photoUrl = assetUrl(up.url)!
      const suggestion = await api.draftFromPhoto(session.businessId, photoUrl, session.apiKey)
      setDraft({
        name: suggestion.suggested_name,
        description: suggestion.suggested_description || '',
        allergens: suggestion.suggested_allergens || '',
        photoUrl,
      })
    } catch (e) {
      onError(String((e as Error).message || e))
    } finally {
      setBusy(false)
    }
  }

  async function saveDraft() {
    if (!draft) return
    setBusy(true)
    try {
      await api.createMenuItem(
        {
          business_id: session.businessId,
          name: draft.name,
          description: draft.description || null,
          allergens: draft.allergens || null,
          price_cents: Math.round(parseFloat(price || '0') * 100),
          category: 'Mains',
          ingredients_confirmed: false,
          image_url: draft.photoUrl,
          is_available: true,
        },
        session.apiKey,
      )
      setDraft(null)
      setFile(null)
      await onCreated()
    } catch (e) {
      onError(String((e as Error).message || e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-copper/25 bg-gradient-to-br from-plate to-ink-soft p-5">
      <h2 className="font-display text-2xl">AI plate draft</h2>
      <p className="mt-1 text-sm text-bone-dim">
        Upload a dish photo. AI suggests name & ingredients — you must confirm before allergy safety
        trusts them.
      </p>
      <input
        type="file"
        accept="image/*"
        className="mt-4 block w-full text-sm text-bone-dim"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        type="button"
        disabled={!file || busy}
        onClick={runDraft}
        className="mt-3 rounded-full bg-copper px-4 py-2 text-sm font-medium text-ink disabled:opacity-40"
      >
        {busy ? 'Reading plate…' : 'Draft from photo'}
      </button>
      {draft && (
        <div className="mt-4 space-y-2 border-t border-bone/10 pt-4">
          <input
            className="w-full rounded-xl border border-bone/15 bg-ink px-3 py-2"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <textarea
            className="w-full rounded-xl border border-bone/15 bg-ink px-3 py-2"
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-bone/15 bg-ink px-3 py-2"
            value={draft.allergens}
            onChange={(e) => setDraft({ ...draft, allergens: e.target.value })}
            placeholder="allergens"
          />
          <input
            className="w-full rounded-xl border border-bone/15 bg-ink px-3 py-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="price USD"
          />
          <button
            type="button"
            disabled={busy}
            onClick={saveDraft}
            className="rounded-full border border-bone/30 px-4 py-2 text-sm"
          >
            Save as unconfirmed dish
          </button>
        </div>
      )}
    </div>
  )
}

function ManualAddPanel({
  session,
  onCreated,
  onError,
}: {
  session: Session
  onCreated: () => Promise<void>
  onError: (m: string | null) => void
}) {
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      await api.createMenuItem(
        {
          business_id: session.businessId,
          name: String(fd.get('name')),
          description: String(fd.get('description') || '') || null,
          allergens: String(fd.get('allergens') || '') || null,
          category: String(fd.get('category') || '') || null,
          price_cents: Math.round(parseFloat(String(fd.get('price') || '0')) * 100),
          ingredients_confirmed: true,
          is_available: true,
        },
        session.apiKey,
      )
      e.currentTarget.reset()
      await onCreated()
    } catch (err) {
      onError(String((err as Error).message || err))
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[1.75rem] border border-bone/10 bg-plate p-5">
      <h2 className="font-display text-xl">Add by hand</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input name="name" required placeholder="Dish name" className="rounded-xl border border-bone/15 bg-ink px-3 py-2" />
        <input name="price" required placeholder="Price (USD)" className="rounded-xl border border-bone/15 bg-ink px-3 py-2" />
        <input name="category" placeholder="Category" className="rounded-xl border border-bone/15 bg-ink px-3 py-2" />
        <input name="allergens" placeholder="Allergens" className="rounded-xl border border-bone/15 bg-ink px-3 py-2" />
        <input name="description" placeholder="Description" className="sm:col-span-2 rounded-xl border border-bone/15 bg-ink px-3 py-2" />
      </div>
      <button type="submit" className="mt-3 rounded-full border border-bone/25 px-4 py-2 text-sm">
        Add dish
      </button>
    </form>
  )
}

function ItemEditor({
  item,
  session,
  onSaved,
  onError,
}: {
  item: MenuItem
  session: Session
  onSaved: () => Promise<void>
  onError: (m: string | null) => void
}) {
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description || '')
  const [allergens, setAllergens] = useState(item.allergens || '')
  const [category, setCategory] = useState(item.category || '')
  const [price, setPrice] = useState(String(item.price_cents / 100))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setName(item.name)
    setDescription(item.description || '')
    setAllergens(item.allergens || '')
    setCategory(item.category || '')
    setPrice(String(item.price_cents / 100))
  }, [item])

  async function save() {
    setBusy(true)
    onError(null)
    try {
      await api.updateMenuItem(
        item.id,
        {
          name,
          description: description || null,
          allergens: allergens || null,
          category: category || null,
          price_cents: Math.round(parseFloat(price || '0') * 100),
        },
        session.apiKey,
      )
      await onSaved()
    } catch (e) {
      onError(String((e as Error).message || e))
    } finally {
      setBusy(false)
    }
  }

  async function onUpload(kind: 'image' | 'model', file: File) {
    setBusy(true)
    try {
      const up = await api.upload(file, session.apiKey)
      const url = assetUrl(up.url)
      await api.updateMenuItem(
        item.id,
        kind === 'image' ? { image_url: url } : { model_3d_url: url },
        session.apiKey,
      )
      await onSaved()
    } catch (e) {
      onError(String((e as Error).message || e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-[2rem] border border-bone/10 bg-plate p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {item.image_url ? (
            <img
              src={assetUrl(item.image_url) || undefined}
              alt={item.name}
              className="aspect-square w-full rounded-[1.5rem] object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-[1.5rem] bg-ink-soft text-bone-dim">
              No photo
            </div>
          )}
          <label className="mt-3 block text-sm text-bone-dim">
            Replace photo
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full"
              onChange={(e) => e.target.files?.[0] && onUpload('image', e.target.files[0])}
            />
          </label>
        </div>
        <DishViewer
          modelUrl={assetUrl(item.model_3d_url)}
          imageUrl={assetUrl(item.image_url)}
          className="aspect-square w-full min-h-[14rem]"
          generating={busy}
          onRequestGenerate={
            item.image_url
              ? async () => {
                  setBusy(true)
                  onError(null)
                  try {
                    await api.generate3d(item.id, session.apiKey)
                    await onSaved()
                  } catch (e) {
                    onError(String((e as Error).message || e))
                  } finally {
                    setBusy(false)
                  }
                }
              : undefined
          }
        />
      </div>

      <div className="mt-6 grid gap-3">
        <input className="rounded-xl border border-bone/15 bg-ink px-3 py-2 font-display text-xl" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className="rounded-xl border border-bone/15 bg-ink px-3 py-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="rounded-xl border border-bone/15 bg-ink px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
          <input className="rounded-xl border border-bone/15 bg-ink px-3 py-2" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
        </div>
        <input className="rounded-xl border border-bone/15 bg-ink px-3 py-2" value={allergens} onChange={(e) => setAllergens(e.target.value)} placeholder="Allergens" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={save} className="rounded-full bg-copper px-4 py-2 text-sm font-medium text-ink">
          Save changes
        </button>
        {!item.ingredients_confirmed && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await api.confirmIngredients(item.id, session.businessId, session.apiKey)
                await onSaved()
              } catch (e) {
                onError(String((e as Error).message || e))
              } finally {
                setBusy(false)
              }
            }}
            className="rounded-full border border-danger/50 px-4 py-2 text-sm text-danger"
          >
            Confirm ingredients (safety)
          </button>
        )}
        <label className="rounded-full border border-bone/25 px-4 py-2 text-sm">
          Upload .glb
          <input
            type="file"
            accept=".glb,model/gltf-binary"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onUpload('model', e.target.files[0])}
          />
        </label>
        <button
          type="button"
          disabled={busy || !item.image_url}
          onClick={async () => {
            setBusy(true)
            onError(null)
            try {
              await api.generate3d(item.id, session.apiKey)
              await onSaved()
            } catch (e) {
              onError(String((e as Error).message || e))
            } finally {
              setBusy(false)
            }
          }}
          className="rounded-full border border-sage/40 px-4 py-2 text-sm text-sage"
        >
          {busy ? 'Building mesh…' : 'Generate real 3D (fal TripoSR / Meshy)'}
        </button>
      </div>
    </div>
  )
}
