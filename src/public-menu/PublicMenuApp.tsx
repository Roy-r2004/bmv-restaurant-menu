import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, assetUrl, formatPrice, type MenuItem, type PublicMenu } from '../shared/api'
import { DishThumb3D, DishViewer } from '../shared/DishViewer'

export function PublicMenuApp() {
  const { slug = '' } = useParams()
  const [menu, setMenu] = useState<PublicMenu | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    api
      .publicMenu(slug)
      .then((m) => {
        if (cancelled) return
        setMenu(m)
        if (m.items[0]) setActiveId(m.items[0].id)
      })
      .catch((e) => {
        if (cancelled) return
        setError(String(e.message || e))
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const categories = useMemo(() => {
    if (!menu) return [] as string[]
    return Array.from(new Set(menu.items.map((i) => i.category || 'Signature')))
  }, [menu])

  const [filter, setFilter] = useState<string | null>(null)
  const visible = useMemo(() => {
    if (!menu) return []
    if (!filter) return menu.items
    return menu.items.filter((i) => (i.category || 'Signature') === filter)
  }, [menu, filter])

  const active = menu?.items.find((i) => i.id === activeId) || null
  const accent = menu?.business.primary_color || undefined

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink px-5 text-center text-bone">
        <p className="text-danger">{error}</p>
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink px-5 text-center font-display text-2xl text-bone sm:text-3xl">
        Setting the table…
      </div>
    )
  }

  return (
    <div className="grain relative min-h-dvh overflow-x-hidden bg-ink text-bone">
      <div
        className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full opacity-30 blur-3xl sm:h-[28rem] sm:w-[28rem]"
        style={{ background: accent || 'radial-gradient(circle, #c45c26 0%, transparent 70%)' }}
      />

      <header className="relative z-10 mx-auto max-w-6xl px-4 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 sm:pb-6 sm:pt-10">
        <div className="flex items-start justify-between gap-3">
          <div className="animate-rise min-w-0">
            <p className="text-[10px] uppercase tracking-[0.35em] text-copper sm:text-[11px] sm:tracking-[0.4em]">
              Tonight&apos;s room
            </p>
            <h1 className="mt-2 font-display text-[2.35rem] font-semibold leading-[1.05] sm:text-5xl md:text-7xl">
              {menu.business.name}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-bone-dim sm:text-base">
              Spin every plate in 3D. Tap a dish, drag to turn it, ask the concierge anything.
            </p>
          </div>
          <Link
            to="/admin"
            className="shrink-0 pt-1 text-xs text-bone-dim underline-offset-4 hover:underline sm:text-sm"
          >
            Kitchen
          </Link>
        </div>
      </header>

      {/* Mobile-first: 3D stage first (phone hero), then list */}
      <div className="relative z-10 mx-auto grid max-w-6xl gap-6 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:gap-8 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
        <section className="animate-rise space-y-4" style={{ animationDelay: '60ms' }}>
          <DishViewer
            key={active?.id ?? 'empty'}
            modelUrl={assetUrl(active?.model_3d_url)}
            imageUrl={assetUrl(active?.image_url)}
            className="aspect-[1/1] w-full sm:aspect-[5/4] lg:aspect-square"
            interactive
          />

          {active && (
            <div className="rounded-2xl border border-bone/10 bg-plate/80 px-4 py-4 sm:px-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl leading-tight sm:text-3xl">{active.name}</h2>
                <p className="shrink-0 text-base text-copper sm:text-lg">{formatPrice(active.price_cents)}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-bone-dim sm:text-base">{active.description}</p>
              <p className="mt-3 text-xs sm:text-sm">
                <span className="text-bone-dim">Allergens: </span>
                {active.allergens || 'none listed'}
                {!active.ingredients_confirmed && (
                  <span className="ml-2 text-danger">· ask staff to confirm</span>
                )}
              </p>
            </div>
          )}
        </section>

        <section className="animate-rise" style={{ animationDelay: '120ms' }}>
          <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <button
              type="button"
              onClick={() => setFilter(null)}
              className={`shrink-0 rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.18em] transition sm:py-1 sm:text-[11px] ${
                !filter ? 'border-copper bg-copper/15 text-copper' : 'border-bone/15 text-bone-dim'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`shrink-0 rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.18em] transition sm:py-1 sm:text-[11px] ${
                  filter === cat ? 'border-copper bg-copper/15 text-copper' : 'border-bone/15 text-bone-dim'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>

          <ul className="space-y-2.5 sm:space-y-3">
            {visible.map((item, idx) => (
              <MenuRow
                key={item.id}
                item={item}
                active={item.id === activeId}
                onSelect={() => {
                  setActiveId(item.id)
                  // On phone, scroll the 3D stage into view after picking a dish
                  if (window.matchMedia('(max-width: 1023px)').matches) {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                delay={idx * 40}
              />
            ))}
          </ul>
        </section>
      </div>

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="animate-glow fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-30 rounded-full bg-copper px-5 py-3.5 text-center text-sm font-medium text-ink shadow-lg sm:left-auto sm:right-6 sm:w-auto sm:px-5 sm:py-3"
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
        className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition active:scale-[0.99] sm:gap-4 sm:px-4 sm:py-4 ${
          active ? 'border-copper bg-plate' : 'border-bone/10 bg-ink-soft/60 hover:border-bone/20'
        }`}
      >
        <DishThumb3D imageUrl={assetUrl(item.image_url)} active={active} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-display text-lg sm:text-xl">{item.name}</p>
            <p className="shrink-0 text-sm text-copper">{formatPrice(item.price_cents)}</p>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-bone-dim sm:mt-1 sm:truncate sm:text-sm">
            {item.description}
          </p>
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
      setMessages((m) => [...m, { role: 'assistant', text: String((err as Error).message || err) }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-end sm:justify-end sm:p-6">
      <div className="flex h-[min(88dvh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-t-[1.5rem] border border-bone/15 bg-plate shadow-2xl sm:h-[min(34rem,90vh)] sm:rounded-[1.75rem]">
        <div className="flex items-center justify-between border-b border-bone/10 px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-copper">Concierge</p>
            <p className="font-display text-lg sm:text-xl">Menu chat</p>
          </div>
          <button type="button" onClick={onClose} className="min-h-10 min-w-10 text-bone-dim hover:text-bone">
            Close
          </button>
        </div>
        <div className="border-b border-bone/10 px-4 py-3 sm:px-5">
          <input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Your allergies (optional)"
            className="w-full rounded-xl border border-bone/15 bg-ink px-3 py-2.5 text-sm"
          />
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
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
        <form
          onSubmit={send}
          className="flex gap-2 border-t border-bone/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What’s good without dairy?"
            className="min-w-0 flex-1 rounded-full border border-bone/15 bg-ink px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-full bg-copper px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
