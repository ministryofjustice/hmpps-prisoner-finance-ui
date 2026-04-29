import logger from '../../../logger'
import { RedisClient } from '../../data/redisClient'
import Store from './store'

export default class RedisStore implements Store {
  private readonly prefix = ''

  constructor(private readonly client: RedisClient) {
    logger.info(`${this.prefix}Create RedisStore`)
    client.on('error', error => {
      logger.error(error, `${this.prefix}Redis error`)
    })
  }

  private async ensureConnected() {
    if (!this.client.isOpen) {
      await this.client.connect()
    }
  }

  public async set(key: string, value: string, durationSeconds: number): Promise<void> {
    await this.ensureConnected()
    await this.client.set(`${this.prefix}${key}`, value, { EX: durationSeconds })
  }

  public async get(key: string): Promise<string | null> {
    await this.ensureConnected()
    const result = await this.client.get(`${this.prefix}${key}`)

    if (typeof result === 'string') {
      return result
    }
    if (result === null) {
      return null
    }
    return Buffer.from(result).toString('utf-8')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async destroy(sid: string): Promise<void> {
    /* empty */
  }
}
