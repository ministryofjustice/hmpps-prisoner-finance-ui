import { expect } from '@playwright/test'
import * as cheerio from 'cheerio'
import nunjucks from 'nunjucks'
import { PrisonerTransactionResponse } from '../../../../interfaces/PrisonerTransactionResponse'
import { formatDateForView, penceToPound } from '../../../../utils/utils'

describe('prisoner profile page', () => {
  const payload: Array<PrisonerTransactionResponse> = [
    {
      date: '2026-03-10T10:43:28.094Z',
      description: '',
      credit: 0,
      debit: 10,
      location: 'LEI',
      accountType: 'CASH',
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: '',
      credit: 20,
      debit: 0,
      location: 'MDI',
      accountType: 'SAVINGS',
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 0,
      debit: 10,
      location: '',
      accountType: 'CASH',
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
    },
    {
      date: '2026-03-10T10:41:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
    },
    {
      date: '2026-03-10T11:43:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
    },
  ]

  let $: cheerio.CheerioAPI

  beforeAll(() => {
    const njkEnv = nunjucks.configure(
      ['server/views', 'node_modules/govuk-frontend/dist', 'node_modules/@ministryofjustice/frontend/'],
      {
        autoescape: true,
        trimBlocks: true,
        lstripBlocks: true,
      },
    )
    njkEnv.addFilter('assetMap', (asset: string) => asset)
    njkEnv.addFilter('formatDateForView', formatDateForView)
    njkEnv.addFilter('penceToPound', penceToPound)

    const html = njkEnv.render('pages/prisoner/profile/prisonerProfile.njk', {
      applicationName: 'Hmpps Prisoner Finance Ui',
      transactions: payload,
    })

    $ = cheerio.load(html)
  })

  it('should render the transaction table in the summary container', () => {
    const summaryContainer = $('.hmpps-summary-container')

    expect($('.hmpps-summary-container__heading').text().trim()).toBe("Prisoner's transactions")
    expect(summaryContainer.find('.govuk-table')).toBeDefined();
  })

  it('Should render the transactions table with 5 rows', () => {
    const transactionsTable = $('table[data-testid="prisoner-transactions-table"]')

    expect(transactionsTable.find('.govuk-table__head .govuk-table__header').length).toBe(5)
    expect(transactionsTable.find('.govuk-table__body .govuk-table__row').length).toBe(5)
  })
})
