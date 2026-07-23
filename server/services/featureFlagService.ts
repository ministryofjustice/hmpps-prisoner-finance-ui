import { BooleanEvaluationResponse, FliptClient } from '@flipt-io/flipt-client-js'
import config from '../config'
import logger from '../../logger'

export default class FeatureFlagService {
  client: FliptClient

  async fliptClient(): Promise<FliptClient> {
    if (!this.client) {
      this.client = await FliptClient.init({
        namespace: 'prisoner-finance',
        url: config.featureToggleUrl,
        updateInterval: 120,
      }).catch(() => {
        throw Error(`Unable to connect to feature flag service`)
      })
    }

    return this.client
  }

  async isFeatureEnabled(flag: string): Promise<boolean> {
    try {
      const response = (await this.fliptClient()).evaluateBoolean({
        entityId: 'prisoner-finance-ui',
        flagKey: flag,
        context: {},
      }) as BooleanEvaluationResponse

      return response.enabled
    } catch (e) {
      logger.error(`Error occurred while evaluating feature flag '${flag}':`, e)
      return false
    }
  }
}

type FeatureFlags = {
  GRANT_BONUS_TO_PRISONERS_ENABLED: boolean
  CREDIT_ACCOUNT_ENABLED: boolean
  DATA_WARNING_BANNER_ENABLED: boolean
  ACTION_PANEL_ENABLED: boolean
}

declare module 'express-serve-static-core' {
  interface Request {
    featureFlags: FeatureFlags
  }
}
