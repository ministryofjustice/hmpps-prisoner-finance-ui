import * as cheerio from 'cheerio'
import { expect } from '@playwright/test'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../../utils/nunjucksSetup'

describe('Credit A Prisoner - Credit From Page', () => {
  let $: cheerio.CheerioAPI
  let njkEnv: nunjucks.Environment

  const txnNum = 'txn-num'
  const prisonNumber = 'AB123456'

  const params = {
    applicationName: 'Hmpps Prisoner Finance Ui',
    transactionNumber: txnNum,
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

    prisonNumber,
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

    const html = njkEnv.render('pages/creditAPrisoner/creditConfirmation/creditConfirmation.njk', params)

    $ = cheerio.load(html)
  })

  test('Renders the confirmation panel with the correct ID and recent transactions link', () => {
    const confirmationPanel = $('[data-testid="confirmation-panel"]')
    expect(confirmationPanel.text()).toContain(txnNum)

    const recentTxnsLink = $('[data-testid="confirmation-message-link"]')
    expect(recentTxnsLink.attr('href')).toBe(`/prisoner/${prisonNumber}`)
  })
})
