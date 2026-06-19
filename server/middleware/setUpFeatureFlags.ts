import { RequestHandler } from 'express'
import FeatureFlagService from '../services/featureFlagService'

export default function setUpFeatureFlags(featureFlagService: FeatureFlagService): RequestHandler {
  return async (req, _, next) => {
    try {
      const featureFlags = {
        GRANT_BONUS_TO_PRISONERS_ENABLED: await featureFlagService.isFeatureEnabled('grant-bonus-to-prisoners-enabled'),
        CREDIT_ACCOUNT_ENABLED: await featureFlagService.isFeatureEnabled('credit-account-enabled'),
      }

      req.featureFlags = featureFlags
      next()
    } catch {
      req.featureFlags = { GRANT_BONUS_TO_PRISONERS_ENABLED: false, CREDIT_ACCOUNT_ENABLED: false }
      next()
    }
  }
}
