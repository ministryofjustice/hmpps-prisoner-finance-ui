import RedisStore from './redisStore'
import { RedisClient } from '../../data/redisClient'

describe('RedisStore', () => {
  let store: RedisStore
  let mockClient: jest.Mocked<RedisClient>

  beforeEach(() => {
    mockClient = {
      isOpen: true, // Pretend it's already connected to skip ensureConnected logic
      connect: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      on: jest.fn(),
    } as unknown as jest.Mocked<RedisClient>
    store = new RedisStore(mockClient as unknown as RedisClient)
  })

  describe('get()', () => {
    it('should request the correct key with the prefix', async () => {
      mockClient.get.mockResolvedValue('fake-string-data')

      const result = await store.get('123')

      // assert prefix here
      expect(mockClient.get).toHaveBeenCalledWith('123')
      expect(result).toBe('fake-string-data')
    })
  })

  describe('set()', () => {
    it('should pass the EX flag for expiration', async () => {
      await store.set('123', 'my-data', 86400)

      expect(mockClient.set).toHaveBeenCalledWith('123', 'my-data', { EX: 86400 })
    })
  })
})
