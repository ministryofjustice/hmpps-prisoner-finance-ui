import * as cheerio from 'cheerio'
import { expect } from '@playwright/test'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../../utils/nunjucksSetup'

describe('Credit A Prisoner - Credit From Page', () => {
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

    const html = njkEnv.render('pages/creditAPrisoner/creditAmount/creditAmount.njk', params)

    $ = cheerio.load(html)
  })

  test('Renders the amount field, description field and done button', () => {
    const amountField = $("[data-testid='amount-field']")
    expect(amountField.length).toBe(1)

    const descriptionField = $("[data-testid='description-field']")
    expect(descriptionField.length).toBe(1)

    const continueButton = $("[data-testid='done-button']")
    expect(continueButton.length).toBe(1)
  })
})
