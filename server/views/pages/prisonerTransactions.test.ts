import { expect } from '@playwright/test'
import * as cheerio from 'cheerio'
import nunjucks from 'nunjucks'
import { PrisonerTransactionResponse } from '../../interfaces/PrisonerTransactionResponse'

describe('prisoner transactions page', () => {
  const payload: Array<PrisonerTransactionResponse> = [
    {
      date: new Date('10/10/10'),
      description: '',
      credit: 0,
      debit: 10,
      location: 'LEI',
      accountType: 'CASH',
    },
    {
      date: new Date('10/11/10'),
      description: '',
      credit: 20,
      debit: 0,
      location: 'MDI',
      accountType: 'SAVINGS',
    },
    {
      date: new Date('10/12/10'),
      description: 'Cash to Savings Transfer',
      credit: 0,
      debit: 10,
      location: '',
      accountType: 'CASH',
    },
    {
      date: new Date('10/12/10'),
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

    const html = njkEnv.render('pages/prisonerTransactions.njk', {
      applicationName: 'Hmpps Prisoner Finance Ui',
      transactions: payload,
    })

    $ = cheerio.load(html)
  })

  it('should render the page elements correctly', () => {
    const heading = $('#prisonerTransactionsHeading')

    expect(heading.text()).toContain("Prisoner's Transactions")

    const title = $('title')

    expect(title.text()).toContain('Hmpps Prisoner Finance Ui - Finance')

    const backLink = $('#backLink')

    expect(backLink.text()).toContain('Back')
    expect(backLink.attr('href')).toBe('/')

    const transactionsTable = $('table[data-testid="prisoner-transactions-table"]')

    expect(transactionsTable.find('thead tr th').length).toBe(6)
    expect(transactionsTable.find('tbody tr').length).toBe(payload.length)
  })
})
