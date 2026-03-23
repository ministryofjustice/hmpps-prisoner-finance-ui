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

  it('Should render the transactions table with 5 rows', () => {
    const transactionsTable = $('table[data-testid="prisoner-transactions-table"]')

    expect(transactionsTable.find('.govuk-table__head .govuk-table__header').length).toBe(5)
    expect(transactionsTable.find('.govuk-table__body .govuk-table__row').length).toBe(5)
  })

  it('Should render a balance card for Spends, Private Cash, Savings', () => {
    const balanceCards = $('.hmpps-balance-cards')
    expect(balanceCards.length).not.toBe(0)

    expect(balanceCards.find('.hmpps-summary-container').length).toEqual(3)

    const spendsCard = balanceCards.find('[data-testid="spends-card"]')
    expect(spendsCard.find('[data-testid="container_heading"]').text()).toEqual('Spends')
    expect(spendsCard.find('.hmpps-balance-card__amount').text()).toEqual('£12.34')

    const privateCashCard = balanceCards.children('[data-testid="private-cash-card"]')
    expect(privateCashCard.find('[data-testid="container_heading"]').text()).toEqual('Private Cash')
    expect(privateCashCard.find('.hmpps-balance-card__amount').text()).toEqual('£34.56')

    const savingsCard = balanceCards.children('[data-testid="savings-card"]')
    expect(savingsCard.find('[data-testid="container_heading"]').text()).toEqual('Savings')
    expect(savingsCard.find('.hmpps-balance-card__amount').text()).toEqual('£0.00')
  })

  it('Should render no transactions', () => {
    const html = njkEnv.render('pages/prisoner/profile/prisonerProfile.njk', {
      ...params,
      transactions: [],
    })

    const cheerioPage = cheerio.load(html)
    const noTransactionsMessage = cheerioPage('[data-testid="no-transactions-message"]')
    expect(noTransactionsMessage.length).not.toBe(0)
    expect(noTransactionsMessage.text()).toContain('No transactions to show')
  })
})
