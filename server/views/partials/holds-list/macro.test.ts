import * as cheerio from 'cheerio'
import { expect } from '@playwright/test'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'
import { PrisonerHoldResponse } from '../../../interfaces/PrisonerHoldResponse'

describe('Prisoner Finance Component: Holds list', () => {
  let njkEnv: nunjucks.Environment

  const renderMacro = (
    params: { holds: Array<PrisonerHoldResponse>; prisons: Array<string> } = {
      holds: [],
      prisons: [],
    },
  ) => {
    const template = `
      {% from "partials/holds-list/macro.njk" import holdsList %}
      {{ holdsList(params) }}
    `
    return njkEnv.renderString(template, { params })
  }

  const hold: PrisonerHoldResponse = {
    id: '',
    prisonNumber: 'A1234CD',
    legacyHoldNumber: 1,
    subAccountRef: 'CASH',
    createdAt: '',
    createdBy: 'TEST',
    holdFromDate: '',
    holdUntilDate: '',
    isReleased: false,
    description: 'TEST',
    holdType: 'HOA',
    amount: 1000,
    holdLocation: 'LEI',
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

  test('Should show that there are no holds', () => {
    const html = renderMacro()
    const $ = cheerio.load(html)

    expect($('.holds-list__empty-message').text()).toContain('No holds to show')
    expect($('.holds').length).toBe(0)
  })

  test('Should show a list of holds', () => {
    const html = renderMacro({
      holds: [hold],
      prisons: ['LEI'],
    })
    const $ = cheerio.load(html)

    expect($('.holds-list__empty-message').length).toBe(0)
    expect($('.holds-list').length).toBe(1)
  })
})
