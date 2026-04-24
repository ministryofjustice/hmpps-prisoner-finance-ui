import session from 'express-session'
import Store from './store'

export class ExpressSessionAdapter extends session.Store {
    constructor(private readonly store : Store){
        super()
    }

  public async get(sid: string, callback: (err: any, session?: session.SessionData | null) => void) {
    try {
      const result = await this.store.get(sid);

      if (result) {
        return callback(null, JSON.parse(result));
      }
      
      return callback(null, null);
    } catch (error) {
      return callback(error);
    }
  }

  public async set(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
    try {
      const value = JSON.stringify(sessionData);
      
      // Defaults to 1 day (86400 seconds) if no cookie maxAge is set
      const ttl = sessionData.cookie?.maxAge ? Math.floor(sessionData.cookie.maxAge / 1000) : 86400;

      await this.store.set(sid, value, ttl);
      
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }

  public async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      await this.store.destroy(sid);

      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }
}