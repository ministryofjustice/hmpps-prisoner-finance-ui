import session from 'express-session'
import express, { Router } from 'express'
import { randomUUID } from 'crypto'
import { createRedisClient } from '../data/redisClient'
import config from '../config'
import logger from '../../logger'

import { ExpressSessionAdapter } from '../routes/store/expressSessionAdapter'
import InMemoryStore from '../routes/store/inMemoryStore'
import RedisStore from '../routes/store/redisStore'
import Store from '../routes/store/store'

export default function setUpWebSession(): Router {
  let store: Store
  if (config.redis.enabled) {
    const client = createRedisClient()
    client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))
    store = new RedisStore(client)
  } else {
    store = new InMemoryStore()
  }

  const adaptedStore = new ExpressSessionAdapter(store)

  const router = express.Router()
  router.use(
    session({
      store: adaptedStore,
      name: 'hmpps-prisoner-finance-ui.session',
      cookie: { secure: config.https, sameSite: 'lax', maxAge: config.session.expiryMinutes * 60 * 1000 },
      secret: config.session.secret,
      resave: false, // redis implements touch so shouldn't need this
      saveUninitialized: false,
      rolling: true,
    }),
  )

  router.use((req, res, next) => {
    const headerName = 'X-Request-Id'
    const oldValue = req.get(headerName)
    const id = oldValue === undefined ? randomUUID() : oldValue

    res.set(headerName, id)
    req.id = id

    next()
  })

  return router
}
