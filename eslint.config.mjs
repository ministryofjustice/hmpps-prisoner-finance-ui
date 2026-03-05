import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default [
  {
    ignores: ['server/api-clients/**'],
  },
  ...hmppsConfig(),
]
