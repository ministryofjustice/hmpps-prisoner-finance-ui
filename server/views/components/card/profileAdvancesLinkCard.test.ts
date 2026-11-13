import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'

describe('View Components - profileAdvancesLinkCard', () => {
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
      {% from "components/card/profileAdvancesLinkCard.njk" import profileAdvancesLinkCard %}
      {{ profileAdvancesLinkCard(params) }}
    `
    const output = njkEnv.renderString(macroString, { params })
    return cheerio.load(output)
  }

  it('should render link and balances', () => {
    const $ = renderCard({
      advancesAmount: '10.10',
      balancesOutstanding: '12.02',
      weeklyPaymentAmount: '1.00',
      href: 'google.com',
    })

    const href = $('a').first().attr('href')
    expect(href).toBe('google.com')

    expect($('.current-advances-key').text().trim()).toBe('Current advances')
    expect($('.current-advances-value').text().trim()).toBe('£10.10')
    expect($('.balance-outstanding-key').text().trim()).toBe('Balance outstanding')
    expect($('.balance-outstanding-value').text().trim()).toBe('£12.02')
    expect($('.weekly-payments-key').text().trim()).toBe('Weekly payments')
    expect($('.weekly-payments-value').text().trim()).toBe('£1.00')
  })
})
