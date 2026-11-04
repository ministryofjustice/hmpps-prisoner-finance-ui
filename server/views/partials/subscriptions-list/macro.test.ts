import * as cheerio from 'cheerio'
import { expect } from '@playwright/test'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'
import { PrisonerSubscriptionResponse } from '../../../interfaces/PrisonerSubscriptionResponse'

describe('Prisoner Finance Component: Subscriptions list', () => {
  let njkEnv: nunjucks.Environment

  const renderMacro = (
    params: { subscriptions: Array<PrisonerSubscriptionResponse> } = {
      subscriptions: [],
    },
  ) => {
    const template = `
      {% from "partials/subscriptions-list/macro.njk" import subscriptionsList %}
      {{ subscriptionsList(params) }}
    `
    return njkEnv.renderString(template, { params })
  }
  const prisonNumber = 'A9991EC'

  const subscription: PrisonerSubscriptionResponse = {
    id: '',
    legacyPaymentProfileId: 12345,
    amount: 150,
    dayOfPayment: 'MONDAY',
    startDate: '11-11-2026',
    endDate: null,
    subscriptionType: 'TELE',
    reference: 'sky tv',
    createdBy: 'TEST_USER',
    createdAt: '',
    prisonId: 'LEI',
    prisonNumber,
    subAccountRef: 'SPENDS',
  }

  beforeAll(() => {
    njkEnv = nunjucks.configure(
      ['server/views', 'node_modules/govuk-frontend/dist', 'node_modules/@ministryofjustice/frontend/'],
      {
        autoescape: true,
        trimBlocks: true,
        lstripBlocks: true,
      },
    )

    setUpNunJucksFilters(njkEnv)
  })

  test('Should show that there are no subscriptions', () => {
    const html = renderMacro()
    const $ = cheerio.load(html)

    expect($('.subscriptions-list__empty-message').text()).toContain('No subscriptions to show')
    expect($('.subscriptions').length).toBe(0)
  })

  test('Should show a list of subscriptions', () => {
    const html = renderMacro({
      subscriptions: [subscription],
    })
    const $ = cheerio.load(html)

    expect($('.subscriptions-list__empty-message').length).toBe(0)
    expect($('.subscriptions-list').length).toBe(1)
  })
})
