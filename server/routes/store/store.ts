export default interface Store {
  set(key: string, value: string, durationSeconds: number): Promise<void>
  get(key: string): Promise<string | null>
  destroy(sid: string): Promise<void>
}
