import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraIgnorePaths: ['scripts/K6/smoke-tests.js'],
})
