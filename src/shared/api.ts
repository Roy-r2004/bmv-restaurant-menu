const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://127.0.0.1:8010/api'
const ASSET_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${ASSET_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`
}

export type MenuItem = {
  id: number
  business_id?: number
  name: string
  description: string | null
  price_cents: number
  category: string | null
  allergens: string | null
  ingredients_confirmed: boolean
  is_available?: boolean
  image_url: string | null
  model_3d_url: string | null
  sort_order: number
  created_at?: string
}

export type PublicMenu = {
  business: {
    name: string
    public_slug: string
    logo_url: string | null
    primary_color: string | null
  }
  items: MenuItem[]
}

function authHeaders(apiKey?: string): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) h['X-API-Key'] = apiKey
  return h
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText
    try {
      const j = await res.json()
      detail = j.detail || JSON.stringify(j)
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return res.json() as Promise<T>
}

export const api = {
  createBusiness: (body: {
    name: string
    vertical?: string
    admin_username: string
    admin_password: string
    public_slug?: string
  }) =>
    fetch(`${API_BASE}/businesses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ vertical: 'restaurant', ...body }),
    }).then((r) =>
      parse<{
        id: number
        name: string
        public_slug: string
        api_key: string
        admin_username: string | null
      }>(r),
    ),

  login: (username: string, password: string) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ username, password }),
    }).then((r) =>
      parse<{
        api_key: string
        business_id: number
        name: string
        public_slug: string | null
        vertical: string
      }>(r),
    ),

  listMenuItems: (businessId: number, apiKey: string) =>
    fetch(`${API_BASE}/businesses/${businessId}/menu-items`, {
      headers: authHeaders(apiKey),
    }).then((r) => parse<MenuItem[]>(r)),

  createMenuItem: (body: Record<string, unknown>, apiKey: string) =>
    fetch(`${API_BASE}/menu-items`, {
      method: 'POST',
      headers: authHeaders(apiKey),
      body: JSON.stringify(body),
    }).then((r) => parse<MenuItem>(r)),

  updateMenuItem: (id: number, body: Record<string, unknown>, apiKey: string) =>
    fetch(`${API_BASE}/menu-items/${id}`, {
      method: 'PATCH',
      headers: authHeaders(apiKey),
      body: JSON.stringify(body),
    }).then((r) => parse<MenuItem>(r)),

  confirmIngredients: (id: number, businessId: number, apiKey: string) =>
    fetch(`${API_BASE}/menu-items/${id}/confirm-ingredients`, {
      method: 'POST',
      headers: authHeaders(apiKey),
      body: JSON.stringify({ business_id: businessId }),
    }).then((r) => parse<MenuItem>(r)),

  draftFromPhoto: (businessId: number, photoUrl: string, apiKey: string) =>
    fetch(`${API_BASE}/menu-items/draft-from-photo`, {
      method: 'POST',
      headers: authHeaders(apiKey),
      body: JSON.stringify({ business_id: businessId, photo_url: photoUrl }),
    }).then((r) =>
      parse<{
        suggested_name: string
        suggested_description: string | null
        suggested_allergens: string | null
      }>(r),
    ),

  upload: async (file: File, apiKey: string) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: fd,
    })
    return parse<{ url: string; filename: string }>(res)
  },

  generate3d: (id: number, apiKey: string) =>
    fetch(`${API_BASE}/menu-items/${id}/generate-3d`, {
      method: 'POST',
      headers: authHeaders(apiKey),
    }).then((r) => parse<MenuItem>(r)),

  updateSlug: (businessId: number, publicSlug: string, apiKey: string) =>
    fetch(`${API_BASE}/businesses/${businessId}/public-slug`, {
      method: 'PATCH',
      headers: authHeaders(apiKey),
      body: JSON.stringify({ public_slug: publicSlug }),
    }).then((r) => parse<{ public_slug: string }>(r)),

  publicMenu: (slug: string) =>
    fetch(`${API_BASE}/public/${slug}/menu`).then((r) => parse<PublicMenu>(r)),

  publicItem: (slug: string, id: number) =>
    fetch(`${API_BASE}/public/${slug}/menu-items/${id}`).then((r) => parse<MenuItem>(r)),

  publicChat: (
    slug: string,
    body: {
      message: string
      guest_client_id?: number | null
      allergies?: string
      guest_name?: string
    },
  ) =>
    fetch(`${API_BASE}/public/${slug}/chat`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then((r) => parse<{ reply: string; guest_client_id: number }>(r)),
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}
