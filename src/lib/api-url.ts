const DEFAULT_API_ORIGIN = 'http://localhost:3000'

export function getApiOrigin() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_ORIGIN
  return configured.replace(/\/api\/?$/, '')
}

export function getApiBaseUrl() {
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