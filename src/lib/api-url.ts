const DEV_DEFAULT_API_ORIGIN = 'http://localhost:3001'

function resolveConfiguredApiOrigin() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL

  if (configured && configured.trim()) {
    return configured
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEV_DEFAULT_API_ORIGIN
  }

  throw new Error('Missing NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL in production')
}

export function getApiOrigin() {
  const configured = resolveConfiguredApiOrigin()
  const trimmed = configured.trim().replace(/\/+$/, '')
  return trimmed.replace(/(?:\/api)+$/i, '')
}

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return '/api'
  }

  return `${getApiOrigin()}/api`
}

export function resolveMediaUrl(path?: string | null) {
  if (!path) return undefined

  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiOrigin()}${normalizedPath}`
}