import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import { formatDateForView, penceToPound } from '../../../utils/utils'
import { PrisonerTransactionResponse } from '../../../interfaces/PrisonerTransactionResponse'

describe('View Components - TransactionTable', () => {

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

  const njkEnv = nunjucks.configure(
    ['server/views', 'node_modules/govuk-frontend/dist', 'node_modules/@ministryofjustice/frontend/'],
    {
      autoescape: true,
      trimBlocks: true,
      lstripBlocks: true,
    },
  )
  njkEnv.addFilter('penceToPound', penceToPound)

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
  
      const html = njkEnv.render('pages/prisoner/transactions/prisonerTransactions.njk', {
        transactions: payload,
        prisonNumber: "A1234BB"
      })
  
      $ = cheerio.load(html)
  })

  it('should render the transactions', () => {

    const transactionsTable = $('table[data-testid="prisoner-transactions-table"]')

    expect(transactionsTable.length).toBe(1)
    expect(transactionsTable.find('.govuk-table__head .govuk-table__header').length).toBe(6)
    expect(transactionsTable.find('.govuk-table__body .govuk-table__row').length).toBe(payload.length)
  })
})
