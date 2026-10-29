export const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

export async function mockSubmit<T>(payload: T): Promise<{ ok: true; data: T; reference: string }> {
  await mockDelay()
  return { ok: true, data: payload, reference: `DEMO-${Date.now().toString().slice(-6)}` }
}

// Demo storage is intentionally separate from real /api/v1 services.
export const demoStorage = {
  get<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback }
  },
  set<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)) },
}
