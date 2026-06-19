import { RequestHandler } from 'express'
import FeatureFlagService from '../services/featureFlagService'

export default function setUpFeatureFlags(featureFlagService: FeatureFlagService): RequestHandler {
  return async (req, res, next) => {
    try {
      const featureFlags = {
        GRANT_BONUS_TO_PRISONERS_ENABLED: await featureFlagService.isFeatureEnabled('grant-bonus-to-prisoners-enabled'),
        CREDIT_ACCOUNT_ENABLED: await featureFlagService.isFeatureEnabled('credit-account-enabled'),
        DATA_WARNING_BANNER_ENABLED: await featureFlagService.isFeatureEnabled('data-warning-banner-enabled'),
      }

      req.featureFlags = featureFlags
      res.locals.dataWarningBannerEnabled = featureFlags.DATA_WARNING_BANNER_ENABLED
      next()
    } catch {
      req.featureFlags = {
        GRANT_BONUS_TO_PRISONERS_ENABLED: false,
        CREDIT_ACCOUNT_ENABLED: false,
        DATA_WARNING_BANNER_ENABLED: false,
      }
      res.locals.dataWarningBannerEnabled = false
      next()
    }
  }
}
