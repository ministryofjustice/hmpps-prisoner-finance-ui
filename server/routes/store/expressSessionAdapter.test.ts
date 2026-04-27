import { SessionData } from 'express-session'
import ExpressSessionAdapter from './expressSessionAdapter'
import RedisStore from './redisStore'
import { RedisClient } from '../../data/redisClient'

jest.mock('./redisStore')

describe('ExpressSessionAdapter', () => {
  let adapter: ExpressSessionAdapter
  let mockStore: jest.Mocked<RedisStore>

  beforeEach(() => {
    mockStore = new RedisStore({} as RedisClient) as jest.Mocked<RedisStore>
    adapter = new ExpressSessionAdapter(mockStore)
  })

  describe('get()', () => {
    it('should fetch data, parse it from JSON, and pass it to the callback', async () => {
      const fakeData = JSON.stringify({ user: 'Alice' })
      mockStore.get.mockResolvedValue(fakeData)

      const result = await new Promise((resolve, reject) => {
        adapter.get('session-123', (err, data) => {
          if (err) reject(err)
          else resolve(data)
        })
      })

      expect(mockStore.get).toHaveBeenCalledWith('session-123')
      expect(result).toEqual({ user: 'Alice' }) // It should be a parsed object!
    })

    it('should return null if the store returns nothing', async () => {
      mockStore.get.mockResolvedValue(null)

      const result = await new Promise(resolve => {
        adapter.get('empty-session', (err, data) => resolve(data))
      })

      expect(result).toBeNull()
    })
  })

  describe('set()', () => {
    it('should stringify data, calculate TTL, and pass it to the store', async () => {
      mockStore.set.mockResolvedValue(undefined)

      const sessionData = {
        cookie: { maxAge: 120000 }, // 120 seconds in milliseconds
      } as SessionData

      await new Promise(resolve => {
        adapter.set('session-123', sessionData, () => resolve(true))
      })

      expect(mockStore.set).toHaveBeenCalledWith('session-123', JSON.stringify(sessionData), 120)
    })
  })
})
