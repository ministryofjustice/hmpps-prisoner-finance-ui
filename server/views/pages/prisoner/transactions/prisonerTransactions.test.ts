import { expect } from '@playwright/test'
import * as cheerio from 'cheerio'
import nunjucks from 'nunjucks'
import { PrisonerTransactionResponse } from '../../../../interfaces/PrisonerTransactionResponse'
import { setUpNunJucksFilters } from '../../../../utils/nunjucksSetup'

describe('prisoner transactions page', () => {
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
  ]

  let $: cheerio.CheerioAPI
  let njkEnv: nunjucks.Environment
  const prisonNumber = 'A12345'
  const params = {
    prisonNumber,
    applicationName: 'Hmpps Prisoner Finance Ui',
    transactions: payload,
    prisoner: { firstName: 'BOB', lastName: 'Taylor' },
    balance: 1000,
    prisonNames: [{ prisonId: 'LEI', prisonName: 'Leeds (HMP)' }],
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

    const html = njkEnv.render('pages/prisoner/transactions/prisonerTransactions.njk', params)

    $ = cheerio.load(html)
  })

  it('should render the page elements correctly', () => {
    const header = $('#prisonerInformationHeader')

    expect(header.length > 0).toBe(true)

    const title = $('title')

    expect(title.text()).toContain('Hmpps Prisoner Finance Ui - Finance')

    const backLink = $('#backLink')

    expect(backLink.text()).toContain('Back')
    expect(backLink.attr('href')).toBe(`/prisoner/${prisonNumber}`)

    const transactionsTable = $('table[data-testid="prisoner-transactions-table"]')

    expect(transactionsTable.find('thead tr th').length).toBe(6)
    expect(transactionsTable.find('tbody tr').length).toBe(payload.length)

    expect($('.hmpps-summary-container__heading').text().trim()).toBe('Total')
    expect($('.hmpps-balance-card__amount').text().trim()).toBe('£10.00')
  })

  it('Should render no transactions', () => {
    const html = njkEnv.render('pages/prisoner/transactions/prisonerTransactions.njk', {
      ...params,
      transactions: [],
    })

    const cheerioPage = cheerio.load(html)
    const noTransactionsMessage = cheerioPage('[data-testid="no-transactions-message"]')

    expect(cheerioPage('table[data-testid="prisoner-transactions-table"]').length).toBe(0)
    expect(noTransactionsMessage.length).not.toBe(0)
    expect(noTransactionsMessage.text()).toContain('No transactions to show')
  })
})
