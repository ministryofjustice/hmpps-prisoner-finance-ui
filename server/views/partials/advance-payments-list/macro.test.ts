import * as cheerio from 'cheerio'
import { expect } from '@playwright/test'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'
import { PrisonerAdvancePaymentsResponse } from '../../../interfaces/PrisonerAdvancePaymentsResponse'

describe('Prisoner Finance Component: Advance Payments list', () => {
  let njkEnv: nunjucks.Environment

  const renderMacro = (
    params: { advancePayments: Array<PrisonerAdvancePaymentsResponse>; prisons: Array<string> } = {
      advancePayments: [],
      prisons: [],
    },
  ) => {
    const template = `
      {% from "partials/advance-payments-list/macro.njk" import advancePaymentsList %}
      {{ advancePaymentsList(params) }}
    `
    return njkEnv.renderString(template, { params })
  }

  const advancePayment: PrisonerAdvancePaymentsResponse = {
    id: '',
    prisonNumber: 'AB123XZ',
    legacyAdvanceNumber: 11,
    createdAt: '',
    createdBy: 'TEST',
    date: '2026-03-10T10:48:28.094Z',
    paymentAmount: 1,
    advanceLocation: 'LEI',
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

  test('Should show that there are no advance payments', () => {
    const html = renderMacro()
    const $ = cheerio.load(html)

    expect($('.advance-payments-list__empty-message').text()).toContain('No payments to show')
    expect($('.advance-payments').length).toBe(0)
  })

  test('Should show a list of advance payments', () => {
    const html = renderMacro({
      advancePayments: [advancePayment],
      prisons: ['LEI'],
    })
    const $ = cheerio.load(html)

    expect($('.advance-payments-list__empty-message').length).toBe(0)
    expect($('.advance-payments-list__advance-payments').length).toBe(1)
  })
})
