import { expect } from '@playwright/test'
import * as cheerio from 'cheerio'
import nunjucks from 'nunjucks'
import { PrisonerTransactionResponse } from '../../../../interfaces/PrisonerTransactionResponse'
import { setUpNunJucksFilters } from '../../../../utils/nunjucksSetup'

describe('prisoner profile page', () => {
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
      accountBalance: 11,
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 0,
      debit: 10,
      location: '',
      accountType: 'CASH',
      subAccountBalance: 10,
      accountBalance: 40,
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
      subAccountBalance: 20,
      accountBalance: 30,
    },
    {
      date: '2026-03-10T10:41:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
      subAccountBalance: 30,
      accountBalance: 33,
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
      subAccountBalance: 99,
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
      accountBalance: 15,
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 0,
      debit: 10,
      location: '',
      accountType: 'CASH',
      subAccountBalance: 10,
      accountBalance: 16,
    },
    {
      date: '2026-03-10T10:43:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
      subAccountBalance: 20,
      accountBalance: 17,
    },
    {
      date: '2026-03-10T10:41:28.094Z',
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

  const params = {
    applicationName: 'Hmpps Prisoner Finance Ui',
    transactions: payload,
    subAccountBalances: {
      spends: { amount: 1234 },
      privateCash: { amount: 3456 },
      savings: { amount: 0 },
    },
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

  const paramsWithoutLastRunningBalance = {
    applicationName: 'Hmpps Prisoner Finance Ui',
    transactions: payloadWithoutLastRunningBalance,
    subAccountBalances: {
      spends: { amount: 1234 },
      privateCash: { amount: 3456 },
      savings: { amount: 0 },
    },
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

    const html = njkEnv.render('pages/prisoner/profile/prisonerProfile.njk', params)

    $ = cheerio.load(html)
  })

  it("should render prisoner's profile header", () => {
    const profileHeader = $('[data-testid="hmpps-profile-banner"]')
    expect(profileHeader.length).not.toBe(0)
  })

  it('should render the transaction table in the summary container', () => {
    const summaryContainer = $('[data-testid="prisoner-transactions-table-container"]')

    expect(summaryContainer.find('.hmpps-summary-container__heading').text().trim()).toBe('All account transactions')
    expect(summaryContainer.find('.govuk-table').length).not.toBe(0)
  })

  it('should render the transactions table with 5 rows', () => {
    const transactionsTable = $('table[data-testid="prisoner-transactions-table"]')

    expect(transactionsTable.find('.govuk-table__head .govuk-table__header').length).toBe(5)
    expect(transactionsTable.find('.govuk-table__body .govuk-table__row').length).toBe(5)
  })

  it('should render a balance card for Spends, Private cash, Savings', () => {
    const balanceCards = $('.hmpps-balance-card')

    expect(balanceCards.length).toEqual(3)

    expect($(balanceCards[0]).text()).toContain('Spends')
    expect($(balanceCards[0]).text()).toContain('£12.34')

    expect($(balanceCards[1]).text()).toContain('Private cash')
    expect($(balanceCards[1]).text()).toContain('£34.56')

    expect($(balanceCards[2]).text()).toContain('Savings')
    expect($(balanceCards[2]).text()).toContain('£0.00')
  })

  it('should render no transactions', () => {
    const html = njkEnv.render('pages/prisoner/profile/prisonerProfile.njk', {
      ...params,
      transactions: [],
    })

    const cheerioPage = cheerio.load(html)
    const noTransactionsMessage = cheerioPage('[data-testid="no-transactions-message"]')
    expect(noTransactionsMessage.length).not.toBe(0)
    expect(noTransactionsMessage.text()).toContain('No transactions to show')
  })

  it('should render the actions menu', () => {
    const creditMenu = $('[data-testid="credit-menu"]')
    expect(creditMenu.text()).toBe('Credit account')
    expect(creditMenu.attr('href')).toBe('/prisoner/AB123456/money/credit-a-prisoner/credit-to')

    const debitMenu = $('[data-testid="debit-menu"]')
    expect(debitMenu.text()).toBe('Debit account')

    const subAccountMenu = $('[data-testid="subaccount-menu"]')
    expect(subAccountMenu.text()).toBe('Sub account transfer')

    const adjudicationsMenu = $('[data-testid="adjudications-menu"]')
    expect(adjudicationsMenu.text()).toBe('Adjudications')

    const exportMenu = $('[data-testid="export-menu"]')
    expect(exportMenu.text()).toBe('Export statement')

    const closeMenu = $('[data-testid="close-menu"]')
    expect(closeMenu.text()).toBe('Close account')
  })

  it('should render dash if running balance is null', () => {
    const html = njkEnv.render('pages/prisoner/profile/prisonerProfile.njk', paramsWithoutLastRunningBalance)

    $ = cheerio.load(html)

    const transactionsTable = $('table[data-testid="prisoner-transactions-table"]')

    expect(transactionsTable.find('.govuk-table__head .govuk-table__header').length).toBe(5)
    expect(transactionsTable.find('.govuk-table__body .govuk-table__row').length).toBe(5)

    const lastTransactionRunningBalance = $('table[data-testid="prisoner-transactions-table"] tbody tr')
      .last()
      .find('td')
      .eq(3)
      .text()
      .trim()

    expect(lastTransactionRunningBalance).toBe('-')
  })
})
