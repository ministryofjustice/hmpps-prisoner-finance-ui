import * as cheerio from 'cheerio'
import { expect } from '@playwright/test'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../../utils/nunjucksSetup'

describe('Credit A Prisoner - Credit To Page', () => {
  let $: cheerio.CheerioAPI
  let njkEnv: nunjucks.Environment

  const params = {
    applicationName: 'Hmpps Prisoner Finance Ui',
    prisoner: {
      firstName: 'John',
      lastName: 'Smith',
      prisonerNumber: 'AB123456',
      cellLocation: 'RECP',
      csra: 'Standard',
      category: 'C',
      currentIncentive: {
        level: {
          code: 'STD',
          description: 'Standard',
        },
      },
    },
    prisonNumber: 'AB123456',
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

    const html = njkEnv.render('pages/creditAPrisoner/creditTo/creditTo.njk', params)

    $ = cheerio.load(html)
  })

  test('Renders the clickable radio buttons and continue button', () => {
    const formCollection = $("[data-testid='select-credit-to-account']")
    expect(formCollection.length).toBe(1)

    const radioButtons = $("[data-testid='sub-account-radio']")
    expect(radioButtons.length).toBe(3)

    const continueButton = $("[data-testid='continue-button']")
    expect(continueButton.length).toBe(1)
  })
})
