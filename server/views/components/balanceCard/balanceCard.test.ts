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

  it('should render subHeader if provided', () => {
    const $ = renderCard({
      heading: 'Test',
      amount: 1000,
      showSubHeading: true,
    })

    expect($('[data-testid="balance-card-subheading"]').text().trim()).toBe('Account total')
  })

  it('should render link to subaccount page if provided', () => {
    const $ = renderCard({
      heading: 'Test',
      amount: 1000,
      testId: 'privateCash',
      balanceCardLink: {
        href: 'private-cash',
        text: 'private cash transactions',
      },
    })

    expect($('[data-testid="privateCash_balance-card-link"]').text().trim()).toBe('private cash transactions')
    expect($('[data-testid="privateCash_balance-card-link"]').attr('href')).toBe('private-cash')
  })
})
