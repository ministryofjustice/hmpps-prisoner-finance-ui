import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'

describe('View Components - BalanceCard', () => {
  const njkEnv = nunjucks.configure(
    ['server/views', 'node_modules/govuk-frontend/dist', 'node_modules/@ministryofjustice/frontend/'],
    {
      autoescape: true,
      trimBlocks: true,
      lstripBlocks: true,
    },
  )
  setUpNunJucksFilters(njkEnv)

  function renderCard(params: Record<string, unknown>) {
    const macroString = `
      {% from "components/advancePaymentsRemainingCard/advancePaymentsRemainingCard.njk" import advancePaymentsRemainingCard %}
      {{ advancePaymentsRemainingCard(params) }}
    `
    const output = njkEnv.renderString(macroString, { params })
    return cheerio.load(output)
  }

  it('should render the card', () => {
    const $ = renderCard({
      heading: 'Payments remaining',
      paymentsRemaining: 10,
      nextPaymentDate: '2026-10-10T10:48:28.094Z',
    })

    const balanceCards = $('.hmpps-balance-card').first()
    expect(balanceCards.text()).toContain('10')
    expect(balanceCards.text()).toContain('10 Oct 2026')
  })
})
