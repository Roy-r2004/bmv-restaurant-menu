import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, assetUrl, formatPrice, type MenuItem, type PublicMenu } from '../shared/api'
import { DishViewer } from '../shared/DishViewer'

export function PublicMenuApp() {
  const { slug = '' } = useParams()
  const [menu, setMenu] = useState<PublicMenu | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    if (!slug) return
    api
      .publicMenu(slug)
      .then((m) => {
        setMenu(m)
        if (m.items[0]) setActiveId(m.items[0].id)
      })
      .catch((e) => setError(String(e.message || e)))
  }, [slug])

  const categories = useMemo(() => {
    if (!menu) return [] as string[]
    const set = new Set(menu.items.map((i) => i.category || 'Signature'))
    return Array.from(set)
  }, [menu])

  const active = menu?.items.find((i) => i.id === activeId) || null
  const accent = menu?.business.primary_color || undefined

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 text-bone">
        <p className="text-danger">{error}</p>
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink font-display text-3xl text-bone">
        Setting the table…
      </div>
    )
  }

  return (
    <div className="grain relative min-h-screen overflow-x-hidden bg-ink text-bone">
      <div
        className="pointer-events-none absolute -left-24 top-0 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
        style={{ background: accent || 'radial-gradient(circle, #c45c26 0%, transparent 70%)' }}
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-end justify-between px-6 pb-8 pt-10">
        <div className="animate-rise">
          <p className="text-[11px] uppercase tracking-[0.4em] text-copper">Tonight&apos;s room</p>
          <h1 className="mt-3 max-w-xl font-display text-5xl font-semibold leading-[1.05] md:text-7xl">
            {menu.business.name}
          </h1>
          <p className="mt-4 max-w-md text-bone-dim">
            A living menu — browse plates, spin the 3D course, ask the concierge anything about the
            kitchen.
          </p>
        </div>
        <Link to="/admin" className="hidden text-sm text-bone-dim underline-offset-4 hover:underline md:inline">
          Kitchen login
        </Link>
      </header>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 pb-28 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="animate-rise space-y-8" style={{ animationDelay: '80ms' }}>
          {active?.image_url ? (
            <div className="relative overflow-hidden rounded-[2rem]">
              <img
                src={assetUrl(active.image_url) || undefined}
                alt={active.name}
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <p className="font-display text-4xl">{active.name}</p>
                <p className="mt-2 text-copper">{formatPrice(active.price_cents)}</p>
              </div>
            </div>
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center rounded-[2rem] bg-plate text-bone-dim">
              Choose a dish
            </div>
          )}

          <DishViewer
            modelUrl={assetUrl(active?.model_3d_url)}
            className="mx-auto aspect-square w-full max-w-md animate-float"
          />
        </div>

        <div className="animate-rise" style={{ animationDelay: '160ms' }}>
          <nav className="mb-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-bone/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-bone-dim"
              >
                {cat}
              </span>
            ))}
          </nav>

          <ul className="space-y-3">
            {menu.items.map((item, idx) => (
              <MenuRow
                key={item.id}
                item={item}
                active={item.id === activeId}
                onSelect={() => setActiveId(item.id)}
                delay={idx * 50}
              />
            ))}
          </ul>

          {active && (
            <article className="mt-10 border-t border-bone/10 pt-8">
              <h2 className="font-display text-3xl">{active.name}</h2>
              <p className="mt-3 leading-relaxed text-bone-dim">{active.description}</p>
              <p className="mt-4 text-sm">
                <span className="text-bone-dim">Allergens: </span>
                {active.allergens || 'none listed'}
                {!active.ingredients_confirmed && (
                  <span className="ml-2 text-danger">· ask staff to confirm</span>
                )}
              </p>
            </article>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="animate-glow fixed bottom-6 right-6 z-30 rounded-full bg-copper px-5 py-3 font-medium text-ink shadow-lg"
      >
        Ask the concierge
      </button>

      {chatOpen && (
        <ConciergeChat slug={slug} onClose={() => setChatOpen(false)} restaurantName={menu.business.name} />
      )}
    </div>
  )
}

function MenuRow({
  item,
  active,
  onSelect,
  delay,
}: {
  item: MenuItem
  active: boolean
  onSelect: () => void
  delay: number
}) {
  return (
    <li style={{ animationDelay: `${delay}ms` }} className="animate-rise">
      <button
        type="button"
        onClick={onSelect}
        className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition ${
          active ? 'border-copper bg-plate' : 'border-transparent hover:border-bone/15 hover:bg-ink-soft'
        }`}
      >
        <div className="h-16 w-16 overflow-hidden rounded-xl bg-ink-soft">
          {item.image_url ? (
            <img src={assetUrl(item.image_url) || undefined} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-bone-dim">—</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate font-display text-xl">{item.name}</p>
            <p className="shrink-0 text-sm text-copper">{formatPrice(item.price_cents)}</p>
          </div>
          <p className="mt-1 truncate text-sm text-bone-dim">{item.description}</p>
        </div>
      </button>
    </li>
  )
}

function ConciergeChat({
  slug,
  onClose,
  restaurantName,
}: {
  slug: string
  onClose: () => void
  restaurantName: string
}) {
  const storageKey = `plate_guest_${slug}`
  const [guestId, setGuestId] = useState<number | null>(() => {
    const v = localStorage.getItem(storageKey)
    return v ? Number(v) : null
  })
  const [allergies, setAllergies] = useState('')
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: `Welcome to ${restaurantName}. Ask me what pairs well, what’s mild, or what to avoid for allergies.`,
    },
  ])

  async function send(e: FormEvent) {
    e.preventDefault()
    const message = input.trim()
    if (!message || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: message }])
    setBusy(true)
    try {
      const res = await api.publicChat(slug, {
        message,
        guest_client_id: guestId,
        allergies: allergies || undefined,
      })
      setGuestId(res.guest_client_id)
      localStorage.setItem(storageKey, String(res.guest_client_id))
      setMessages((m) => [...m, { role: 'assistant', text: res.reply }])
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: String((err as Error).message || err) },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end bg-ink/50 p-4 backdrop-blur-sm md:p-8">
      <div className="flex h-[min(34rem,90vh)] w-full max-w-md flex-col overflow-hidden rounded-[1.75rem] border border-bone/15 bg-plate shadow-2xl">
        <div className="flex items-center justify-between border-b border-bone/10 px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-copper">Concierge</p>
            <p className="font-display text-xl">Menu chat</p>
          </div>
          <button type="button" onClick={onClose} className="text-bone-dim hover:text-bone">
            Close
          </button>
        </div>
        <div className="border-b border-bone/10 px-5 py-3">
          <input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Your allergies (optional)"
            className="w-full rounded-xl border border-bone/15 bg-ink px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === 'user' ? 'ml-auto bg-copper text-ink' : 'bg-ink-soft text-bone'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-bone/10 p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What’s good without dairy?"
            className="flex-1 rounded-full border border-bone/15 bg-ink px-4 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-copper px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
