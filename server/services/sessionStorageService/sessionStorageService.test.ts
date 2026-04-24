/*
import session, { MemoryStore} from 'express-session'
import { CreditFormSessionStorageService } from './sessionStorageService'
import { Request } from 'express'

describe('Credit Form Session Storage Service', () => {
    const store = new MemoryStore()
    const sessionId = 'test-session-id'
    const prisonNumber = 'A123235'

    const mockReq = {
        sessionID: sessionId,
        sessionStore: store,
        params: { prisonNumber: 'ABC123XX' },
    } as unknown as Request

    beforeEach(() => {
        store.clear();

        const initialData = {
            cookie: new session.Cookie(),
            returnTo: ''
        }

        store.createSession(mockReq, initialData)
    })

    describe('create', () => {
        it('creates a credit form object within the store',(cb) => {
            const service = new CreditFormSessionStorageService(store)

            service.create(mockReq, prisonNumber, () => {
                store.get(sessionId, (err, sessionData) => {
                    expect(err).toBeFalsy()
                    expect(sessionData.creditForm).toBeDefined()
                    expect(sessionData.creditForm[prisonNumber]).toBeDefined()
                    cb()
                })
            })
        })

        it('creates a new credit form object within the store for a different prisonerNumber without overwriting the previous one', (cb) => {

            const service = new CreditFormSessionStorageService(store)

            service.create(mockReq, prisonNumber, (_) => {
                service.create(mockReq, 'Z9991234', (_) => {

                    store.get(sessionId, (_, sessionData) => {
                        expect(sessionData).toBeDefined()

                        expect(sessionData.creditForm).toBeDefined()

                        expect(sessionData.creditForm[prisonNumber]).toBeDefined()
                        expect(sessionData.creditForm['Z9991234']).toBeDefined()

                        cb()
                    })
                })
            })
        })

    })

    describe('set', () => {

        it('can update the creditSubAccountRef property of the store', () => {

            const service = new CreditFormSessionStorageService(store)

            service.create(mockReq, prisonNumber, () => {

                store.get(sessionId, (_, sessionData) => {
                store.set(sessionId, )

            })

        })

    })
})
    */