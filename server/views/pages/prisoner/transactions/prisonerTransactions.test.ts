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
      subAccountBalance: 0,
      accountBalance: 10,
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: '',
      credit: 20,
      debit: 0,
      location: 'MDI',
      accountType: 'SAVINGS',
      subAccountBalance: 20,
      accountBalance: 17,
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 0,
      debit: 10,
      location: '',
      accountType: 'CASH',
      subAccountBalance: 10,
      accountBalance: 19,
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
      subAccountBalance: 20,
      accountBalance: 40,
    },
  ]

  const payloadWithoutLastRunningBalance: Array<PrisonerTransactionResponse> = [
    {
      date: '2026-03-10T10:43:28.094Z',
      description: '',
      credit: 0,
      debit: 10,
      location: 'LEI',
      accountType: 'CASH',
      subAccountBalance: 0,
      accountBalance: 40,
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: '',
      credit: 20,
      debit: 0,
      location: 'MDI',
      accountType: 'SAVINGS',
      subAccountBalance: 20,
      accountBalance: 33,
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 0,
      debit: 10,
      location: '',
      accountType: 'CASH',
      subAccountBalance: 10,
      accountBalance: 23,
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
      subAccountBalance: null,
      accountBalance: null,
    },
  ]

  let $: cheerio.CheerioAPI
  let njkEnv: nunjucks.Environment
  const prisonNumber = 'A12345'
  const params = {
    prisonNumber,
    applicationName: 'Hmpps Prisoner Finance Ui',
    headerTitle: 'Finance',
    transactions: payload,
    prisoner: { firstName: 'BOB', lastName: 'Taylor' },
    currentBalance: 1000,
    holdBalance: 0,
    prisonNames: [{ prisonId: 'LEI', prisonName: 'Leeds (HMP)' }],
  }

  const paramsWithoutLastRunningBalance = {
    prisonNumber,
    applicationName: 'Hmpps Prisoner Finance Ui',
    headerTitle: 'Finance',
    transactions: payloadWithoutLastRunningBalance,
    prisoner: { firstName: 'BOB', lastName: 'Taylor' },
    currentBalance: 1000,
    holdBalance: 0,
    prisonNames: [{ prisonId: 'LEI', prisonName: 'Leeds (HMP)' }],
    displayTotalBalance: false,
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
    const header = $('.mini-profile')

    expect(header.length > 0).toBe(true)

    const title = $('title')

    expect(title.text()).toContain('Finance - Hmpps Prisoner Finance Ui')

    const backLink = $('.govuk-back-link')

    expect(backLink.text()).toContain('Back')
    expect(backLink.attr('href')).toBe(`/prisoner/${prisonNumber}`)

    const transactionsTable = $('table[data-testid="prisoner-transactions-table"]')

    expect(transactionsTable.find('thead tr th').length).toBe(6)
    expect(transactionsTable.find('tbody tr').length).toBe(payload.length)

    const balanceCards = $('.hmpps-balance-card')

    expect($(balanceCards[0]).text()).toContain('Current balance')
    expect($(balanceCards[0]).text()).toContain('£10.00')

    const filterComponent = $('[data-module="moj-filter"]')
    const filterSelected = $('[class="moj-filter__selected"]')
    const filterOptions = $('[class="moj-filter__options"]')

    expect(filterSelected.length).toBe(1)
    expect(filterComponent.length).toBe(1)
    expect(filterOptions.length).toBe(1)

    const endDateFilterComponent = $('[id="endDate"]')
    const startDateFilterComponent = $('[id="startDate"]')

    expect(endDateFilterComponent.length).toBe(1)
    expect(startDateFilterComponent.length).toBe(1)

    const creditFilterComponent = $('[id="creditFilter"]')
    const debitFilterComponent = $('[id="debitFilter"]')

    expect(creditFilterComponent.length).toBe(1)
    expect(debitFilterComponent.length).toBe(1)
  })

  it('Should render no transactions', () => {
    const html = njkEnv.render('pages/prisoner/transactions/prisonerTransactions.njk', {
      ...params,
      transactions: [],
    })

    const cheerioPage = cheerio.load(html)
    const noTransactionsMessage = cheerioPage('[data-testid="no-transactions-message"]')

    expect(cheerioPage('table[data-testid="prisoner-transactions-table"]').length).toBe(0)
    expect(noTransactionsMessage.length).toBe(1)
    expect(noTransactionsMessage.text()).toContain('No transactions to show')
  })

  it('should render dash if running balance is null', () => {
    const html = njkEnv.render('pages/prisoner/transactions/prisonerTransactions.njk', paramsWithoutLastRunningBalance)

    $ = cheerio.load(html)

    const transactionsTable = $('table[data-testid="prisoner-transactions-table"]')

    expect(transactionsTable.find('.govuk-table__head .govuk-table__header').length).toBe(6)
    expect(transactionsTable.find('.govuk-table__body .govuk-table__row').length).toBe(4)

    const lastTransactionRunningBalance = $('table[data-testid="prisoner-transactions-table"] tbody tr')
      .last()
      .find('td')
      .eq(3)
      .text()
      .trim()

    expect(lastTransactionRunningBalance).toBe('-')
  })
})
