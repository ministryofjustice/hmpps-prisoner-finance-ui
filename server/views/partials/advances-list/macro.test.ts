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
    prisonNumber: 'AB123XZ',
    legacyAdvanceNumber: 11,
    createdAt: '',
    createdBy: 'TEST',
    date: '2026-03-10T10:48:28.094Z',
    advanceAmount: 10,
    paymentAmount: 1,
    startPayments: '2026-03-10T10:48:28.094Z',
    reference: '',
    advanceLocation: 'LEI',
    status: 'Active',
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
