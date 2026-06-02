import * as cheerio from 'cheerio'
import { expect } from '@playwright/test'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../../utils/nunjucksSetup'

describe('Credit A Prisoner - Credit To Page', () => {
  let $: cheerio.CheerioAPI
  let njkEnv: nunjucks.Environment

  const params = {
    applicationName: 'Hmpps Prisoner Finance Ui',
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

    const html = njkEnv.render('pages/grantBonusToPrisoners/amount/amount.njk', params)

    $ = cheerio.load(html)
  })

  test('Renders the clickable radio buttons and continue button', () => {
    const amountInput = $("[data-testid='amount-input']")
    expect(amountInput.length).toBe(1)

    const description = $("[data-testid='description-input']")
    expect(description.length).toBe(1)

    const doneButton = $("[data-testid='done-button']")
    expect(doneButton.length).toBe(1)
  })
})
