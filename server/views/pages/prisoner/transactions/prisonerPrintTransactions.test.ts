import { expect } from '@playwright/test'
import * as cheerio from 'cheerio'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../../utils/nunjucksSetup'

describe('Prisoner print transactions page', () => {
  let $: cheerio.CheerioAPI
  let njkEnv: nunjucks.Environment

  const params = {
    transactions: [
      {
        date: '2026-03-10T10:43:28.094Z',
        legacyTransactionId: 123,
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
        legacyTransactionId: 124,
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
        legacyTransactionId: 125,
        description: 'Cash to Savings Transfer',
        credit: 0,
        debit: 10,
        location: 'LEI',
        accountType: 'CASH',
        subAccountBalance: 10,
        accountBalance: 19,
      },
    ],
    displayTotalBalance: false,
    subAccount: '',
    headerTitle: 'Prisoner Transaction history',
    prisonNumber: '',
    firstName: 'John',
    lastName: 'Doe',
    startDate: '01/01/1970',
    endDate: '02/02/1972',
    backLink: 'google.com',
    hideBanner: true,
    statementBalance: 4491,
    statementDate: '03/03/1973',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPageForTest = (inputParams: any) => {
    njkEnv = nunjucks.configure(
      ['server/views', 'node_modules/govuk-frontend/dist', 'node_modules/@ministryofjustice/frontend/'],
      {
        autoescape: true,
        trimBlocks: true,
        lstripBlocks: true,
      },
    )

    setUpNunJucksFilters(njkEnv)
    const html = njkEnv.render('pages/prisoner/transactions/prisonerPrintTransactions.njk', inputParams)
    $ = cheerio.load(html)
  }

  test('should render the page correctly using the provided parameters', () => {
    renderPageForTest(params)

    const title = $('title')
    expect(title.text()).toContain(params.headerTitle)

    const backLink = $('.govuk-back-link')
    expect(backLink.attr('href')).toBe(params.backLink)

    const summaryBoxes = $('.govuk-summary-list__value')
    const renderedName = $(summaryBoxes[0]).text()
    expect(renderedName).toContain(`${params.firstName} ${params.lastName}`)

    const renderedPrisonNumber = $(summaryBoxes[1]).text()
    expect(renderedPrisonNumber).toContain(params.prisonNumber)

    const renderedStartDate = $(summaryBoxes[2]).text()
    expect(renderedStartDate).toContain(params.startDate)

    const renderedEndDate = $(summaryBoxes[3]).text()
    expect(renderedEndDate).toContain(params.endDate)

    const renderedStatementBalance = $(summaryBoxes[4]).text()
    expect(renderedStatementBalance).toContain('£44.91')

    const renderedStatementDate = $(summaryBoxes[5]).text()
    expect(renderedStatementDate).toContain(params.statementDate)

    const allTableRows = $('.govuk-table__row').get()
    expect(allTableRows.length - 1).toBe(params.transactions.length)
  })

  test.each([
    { subAccount: 'CASH', expectedSuffix: 'private cash account for this prisoner' },
    { subAccount: 'SPENDS', expectedSuffix: 'spends account for this prisoner' },
    { subAccount: 'SAVINGS', expectedSuffix: 'savings account for this prisoner' },
    { subAccount: null, expectedSuffix: 'all accounts for this prisoner' },
  ])(
    'Should render the transaction title of "Transaction history for $expectedSuffix" when subaccount is $subAccount',
    testCase => {
      const testParams = { ...params, subAccount: testCase.subAccount }
      const exptectedTableTitle = `Transaction history for ${testCase.expectedSuffix}`

      renderPageForTest(testParams)

      const actualTableTitle = $('h3').text()
      expect(actualTableTitle).toContain(exptectedTableTitle)
    },
  )

  test.each([
    { subAccount: 'CASH', expectedSuffix: 'private cash account' },
    { subAccount: 'SPENDS', expectedSuffix: 'spends account' },
    { subAccount: 'SAVINGS', expectedSuffix: 'savings account' },
    { subAccount: null, expectedSuffix: 'all accounts' },
  ])(
    'Should render the balance summary feild "Balance for $expectedSuffix" when subaccount is $subAccount',
    testCase => {
      const testParams = { ...params, subAccount: testCase.subAccount }
      const expectedSummaryField = `Balance for ${testCase.expectedSuffix}`

      renderPageForTest(testParams)

      const actualSummaryField = $($('.govuk-summary-list__key')[4]).text()
      expect(actualSummaryField).toContain(expectedSummaryField)
    },
  )
})
