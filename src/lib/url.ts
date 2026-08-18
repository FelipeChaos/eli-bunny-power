// URL pública centralizada: evita hardcodear localhost en varios archivos.
const PROD_URL = 'https://felipechaos.github.io/eli-bunny-power/'

export function getAppUrl(): string {
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${origin}/`
    }
  }
  return PROD_URL
}
