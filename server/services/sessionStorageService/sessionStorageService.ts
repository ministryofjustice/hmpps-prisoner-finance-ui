import { RedisStore } from "connect-redis"
import session, { MemoryStore , SessionData} from "express-session"
import { Request } from 'express'
import { CreditPrisonerForm } from "../../interfaces/creditPrisonerForm"

// We want to keep CreditFormSessionStorageService (eg CreditFormStore extends Store) which implements our own store

// We need to change the tests to test the in memory store

// set & get are agnostic, we just JSONify the incoming data object

declare module 'express-session' {
    interface SessionData {
        creditForm?: CreditPrisonerForm
    }
}
/*
export class SessionStorageService {

    store : MemoryStore | RedisStore

    constructor(store: MemoryStore | RedisStore) {
        this.store = store
    }

    create(req: Request, prisonNumber: string, cb: (err : Error | null ) => void) {}
    get() {}
    set() {}
}

export class CreditFormSessionStorageService extends SessionStorageService {

    constructor(store: MemoryStore | RedisStore) {
        super(store)
    }

    override create(req: Request, prisonNumber: string, cb : (err : Error | null ) => void) {

        this.store.get(req.sessionID, (err, sessionData) => {
            if (err) return cb(err)

            const initialFormData: CreditPrisonerForm = {
                creditSubAccountRef: null,
                debitSubAccountRef: null,
                amount: null,
                description: null,
            }

            const updatedSession: SessionData = {
                ...sessionData,
                cookie: sessionData?.cookie || new session.Cookie(),
                creditForm: {
                    ...(sessionData?.creditForm || {}),
                    [prisonNumber]: initialFormData
                }
            }

            this.store.set(req.sessionID, updatedSession, cb)
        })

    }

    override get() {}
    override set() {}
}
*/
