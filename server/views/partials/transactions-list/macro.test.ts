import * as cheerio from 'cheerio'
import { expect } from '@playwright/test'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'
import { PrisonerTransactionResponse } from '../../../interfaces/PrisonerTransactionResponse'

describe('Prisoner Finance Component: Transactions list', () => {
  let njkEnv: nunjucks.Environment

  const renderMacro = (
    params: { transactions: Array<PrisonerTransactionResponse>; prisons: Array<string> } = {
      transactions: [],
      prisons: [],
    },
  ) => {
    const template = `
      {% from "partials/transactions-list/macro.njk" import transactionsList %}
      {{ transactionsList(params) }}
    `
    return njkEnv.renderString(template, { params })
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
  })

  test('Should show that there are no transactions', () => {
    const html = renderMacro()
    const $ = cheerio.load(html)

    expect($('.transactions-list__empty-message').text()).toContain('No transactions to show')
    expect($('.transactions').length).toBe(0)
  })

  test('Should show a list of transactions', () => {
    const html = renderMacro({
      transactions: [
        {
          date: '2023-06-01',
          description: 'Transaction 1',
          credit: 1000,
          debit: 0,
          location: 'LEI',
          accountType: 'SAVINGS',
          subAccountBalance: 1000,
          accountBalance: 1000,
        },
      ],
      prisons: ['LEI'],
    })
    const $ = cheerio.load(html)

    expect($('.transactions-list__empty-message').length).toBe(0)
    expect($('.transactions-list').length).toBe(1)
  })
})
