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

  const paramsWithoutActionPanel = {
    applicationName: 'Hmpps Prisoner Finance Ui',
    transactions: payload,
    subAccountBalances: {
      spends: { amount: 1234 },
      privateCash: { amount: 3456 },
      savings: { amount: 0 },
    },
    prisonerDetails: {
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
    actionPanelEnabled: false,
  }

  const paramsWithActionPanel = {
    ...paramsWithoutActionPanel,
    actionPanelEnabled: true,
  }

  const paramsWithoutLastRunningBalance = {
    applicationName: 'Hmpps Prisoner Finance Ui',
    transactions: payloadWithoutLastRunningBalance,
    subAccountBalances: {
      spends: { amount: 1234 },
      privateCash: { amount: 3456 },
      savings: { amount: 0 },
    },
    prisonerDetails: {
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

    const html = njkEnv.render('pages/prisoner/profile/prisonerProfile.njk', paramsWithoutActionPanel)

    $ = cheerio.load(html)
  })

  it("should render prisoner's profile header", () => {
    const profileHeader = $('.mini-profile, .hmpps-profile-banner')
    expect(profileHeader.length).not.toBe(0)
  })

  it('should render the transaction table in the summary container', () => {
    const summaryContainer = $('.transactions-list-summary')

    expect(summaryContainer.find('.hmpps-summary-container__heading').text().trim()).toContain(
      'All account transactions',
    )
    expect(summaryContainer.find('.transactions-list').length).not.toBe(0)
  })

  it('should render the transactions table with 5 rows', () => {
    const transactionsList = $('.transactions-list')

    expect(transactionsList.find('.govuk-table__head').text().trim().replace(/\s+/g, ' ')).toBe(
      'Date Transaction description Amount Balance Account',
    )
    expect(transactionsList.find('.govuk-table__body').text().trim().replace(/\s+/g, ' ')).toBe(
      [
        '10/03/2026 10:43 -0.10 0.10 Private cash',
        '10/03/2026 10:43 0.20 0.11 Savings',
        '10/03/2026 10:43 Cash to Savings Transfer -0.10 0.40 Private cash',
        '10/03/2026 10:43 Cash to Savings Transfer 0.10 0.30 Savings',
        '10/03/2026 10:41 Cash to Savings Transfer 0.10 0.33 Savings',
      ].join(' '),
    )
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
      ...paramsWithoutActionPanel,
      transactions: [],
    })

    const cheerioPage = cheerio.load(html)
    const noTransactionsMessage = cheerioPage('[data-testid="no-transactions-message"]')
    expect(noTransactionsMessage.length).not.toBe(0)
    expect(noTransactionsMessage.text()).toContain('No transactions to show')
  })

  it('should render dash if running balance is null', () => {
    const html = njkEnv.render('pages/prisoner/profile/prisonerProfile.njk', paramsWithoutLastRunningBalance)

    $ = cheerio.load(html)

    const transactionsList = $('.transactions-list')

    expect(transactionsList.find('.govuk-table__head .govuk-table__header').length).toBe(5)
    expect(transactionsList.find('.govuk-table__body .govuk-table__row').length).toBe(5)

    const lastTransactionRunningBalance = transactionsList.find('tbody tr').last().find('td').eq(3).text().trim()

    expect(lastTransactionRunningBalance).toBe('-')
  })

  it('should not render action panel if feature flag is false', () => {
    const actionPanel = $('.hmpps-actions-block')
    const fullWidthBalanceCardContainer = $('.govuk-grid-column-full .hmpps-balance-card-group')
    const threeQuartersBalanceCardContainer = $('.govuk-grid-column-three-quarters .hmpps-balance-card-group')

    expect(actionPanel).toHaveLength(0)

    expect(fullWidthBalanceCardContainer).toHaveLength(1)
    expect(threeQuartersBalanceCardContainer).toHaveLength(0)
  })

  it('when the feature flag is true, should render the actions menu', () => {
    const html = njkEnv.render('pages/prisoner/profile/prisonerProfile.njk', {
      ...paramsWithActionPanel,
      transactions: [],
    })

    $ = cheerio.load(html)

    const actionMenu = $('.hmpps-actions-block')

    const fullWidthBalanceCardContainer = $('.govuk-grid-column-full .hmpps-balance-card-group')
    const threeQuartersBalanceCardContainer = $('.govuk-grid-column-three-quarters .hmpps-balance-card-group')

    expect(fullWidthBalanceCardContainer).toHaveLength(0)
    expect(threeQuartersBalanceCardContainer).toHaveLength(1)

    const creditMenu = actionMenu.find('a:contains("Credit account")')
    expect(creditMenu.text()).toBe('Credit account')
    expect(creditMenu.attr('href')).toBe('/prisoner/AB123456/money/credit-a-prisoner/credit-to')

    const debitMenu = actionMenu.find('a:contains("Debit account")')
    expect(debitMenu.text()).toBe('Debit account')
    expect(debitMenu.attr('href')).toBe('#')

    const subAccountMenu = actionMenu.find('a:contains("Sub account transfer")')
    expect(subAccountMenu.text()).toBe('Sub account transfer')
    expect(subAccountMenu.attr('href')).toBe('#')

    const adjudicationsMenu = actionMenu.find('a:contains("Adjudications")')
    expect(adjudicationsMenu.text()).toBe('Adjudications')
    expect(adjudicationsMenu.attr('href')).toBe('#')

    const exportMenu = actionMenu.find('a:contains("Export statement")')
    expect(exportMenu.text()).toBe('Export statement')
    expect(exportMenu.attr('href')).toBe('#')

    const closeMenu = actionMenu.find('a:contains("Close account")')
    expect(closeMenu.text()).toBe('Close account')
    expect(closeMenu.attr('href')).toBe('#')
  })
})
