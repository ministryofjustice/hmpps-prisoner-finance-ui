import * as cheerio from 'cheerio'
import { expect } from '@playwright/test'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../../utils/nunjucksSetup'

describe('Credit A Prisoner - Credit From Page', () => {
  let $: cheerio.CheerioAPI
  let njkEnv: nunjucks.Environment

  const prisonSubAccounts = [
    {
      value: 'canteen',
      text: 'Canteen',
      attributes: {
        'data-testid': 'prison-account-radio',
      },
    },
    {
      value: 'bonus',
      text: 'Bonus',
      attributes: {
        'data-testid': 'prison-account-radio',
      },
    },
    {
      value: 'reception',
      text: 'Reception',
      attributes: {
        'data-testid': 'prison-account-radio',
      },
    },
  ]

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
    items: prisonSubAccounts,
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

    const html = njkEnv.render('pages/creditAPrisoner/creditFrom/creditFrom.njk', params)

    $ = cheerio.load(html)
  })

  test('Renders the clickable radio buttons and continue button', () => {
    const formCollection = $("[data-testid='select-credit-from-account']")
    expect(formCollection.length).toBe(1)

    const radioButtons = $("[data-testid='prison-account-radio']")
    expect(radioButtons.length).toBe(3)

    const continueButton = $("[data-testid='continue-button']")
    expect(continueButton.length).toBe(1)
  })
})
