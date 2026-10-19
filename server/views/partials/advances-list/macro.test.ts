import * as cheerio from 'cheerio'
import { expect } from '@playwright/test'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'
import { PrisonerAdvanceResponse } from '../../../interfaces/PrisonerAdvanceResponse'

describe('Prisoner Finance Component: Advances list', () => {
  let njkEnv: nunjucks.Environment

  const renderMacro = (
    params: { advances: Array<PrisonerAdvanceResponse>; prisons: Array<string> } = {
      advances: [],
      prisons: [],
    },
  ) => {
    const template = `
      {% from "partials/advances-list/macro.njk" import advancesList %}
      {{ advancesList(params) }}
    `
    return njkEnv.renderString(template, { params })
  }

  const advance: PrisonerAdvanceResponse = {
    id: '',
    legacyPaymentProfileId: 123,
    legacyInformationNumber: '12344',
    prisonNumber: 'AX123DS',
    prisonID: 'LEI',
    amount: 1000,
    createdOn: '2024-06-18T00:00:00.000000',
    repaymentStartDate: '2024-06-18T00:00:00.000000',
    repaymentAmount: 10,
    reference: '',
    comment: '',
    createdBy: '',
    status: 'ACTIVE',
    updatedAt: '2024-06-18T00:00:00.000000',
    generalLedgerUUID: '',
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

  test('Should show that there are no advances', () => {
    const html = renderMacro()
    const $ = cheerio.load(html)

    expect($('.advances-list__empty-message').text()).toContain('No advances to show')
    expect($('.advances').length).toBe(0)
  })

  test('Should show a list of advances', () => {
    const html = renderMacro({
      advances: [advance],
      prisons: ['LEI'],
    })
    const $ = cheerio.load(html)

    expect($('.advances-list__empty-message').length).toBe(0)
    expect($('.advances-list__advances').length).toBe(1)
  })
})
