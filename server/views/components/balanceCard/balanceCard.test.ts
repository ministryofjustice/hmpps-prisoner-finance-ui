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

    const balanceCards = $('.hmpps-balance-card').first()
    expect(balanceCards.text()).toContain('Test')
    expect(balanceCards.text()).toContain('£10.00')
  })

  it('should render subHeading if provided', () => {
    const $ = renderCard({
      heading: 'Test',
      amount: 1000,
      showSubHeading: true,
    })

    const balanceCards = $('.hmpps-balance-card').first()
    expect(balanceCards.text()).toContain('Total')
  })

  it('should render link to subaccount page if provided', () => {
    const $ = renderCard({
      heading: 'Test',
      amount: 1000,
      testId: 'privateCash',
      link: {
        href: 'private-cash',
        text: 'private cash transactions',
      },
    })

    const balanceCards = $('.hmpps-balance-card')
    expect($(balanceCards[0]).text()).toContain('private cash transactions')
    expect($(balanceCards[0]).find('a').attr('href')).toContain('private-cash')
  })
})
