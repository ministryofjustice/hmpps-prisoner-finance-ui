import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import { penceToPound } from '../../../utils/utils'

describe('View Components - BalanceCard', () => {
  const njkEnv = nunjucks.configure(
    ['server/views', 'node_modules/govuk-frontend/dist', 'node_modules/@ministryofjustice/frontend/'],
    {
      autoescape: true,
      trimBlocks: true,
      lstripBlocks: true,
    },
  )
  njkEnv.addFilter('penceToPound', penceToPound)

  function renderCard(params: Record<string, unknown>) {
    const macroString = `
      {% from "components/balanceCard/balanceCard.njk" import balanceCard %}
      {{ balanceCard(params) }}
    `
    const output = njkEnv.renderString(macroString, { params })
    return cheerio.load(output)
  }

  it('should render the heading and balance amount', () => {
    const $ = renderCard({
      heading: 'Test',
      amount: 1000,
    })

    expect($('.hmpps-summary-container__heading').text().trim()).toBe('Test')
    expect($('.hmpps-balance-card__amount').text().trim()).toBe('£10.00')
  })
})
