import Store from './store'

export default class InMemoryStore implements Store {
  map = new Map<string, { value: string; expiry: Date }>()

  async set(key: string, value: string, durationSeconds: number): Promise<void> {
    this.map.set(key, { value, expiry: new Date(Date.now() + durationSeconds * 1000) })
  }

  async get(key: string): Promise<string | null> {
    const result = this.map.get(key)
    if (result && result.value) {
      if (new Date() < result.expiry) {
        return result.value
      }
    }
    return null
  }

  async destroy(sid: string): Promise<void> {
    /* empty */
  }
}
