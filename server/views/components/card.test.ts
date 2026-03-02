import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'

describe('View Components - Card', () => {
  const njkEnv = nunjucks.configure(
    ['server/views', 'node_modules/govuk-frontend/dist', 'node_modules/@ministryofjustice/frontend/'],
    {
      autoescape: true,
      trimBlocks: true,
      lstripBlocks: true,
    },
  )

  function renderCard(params: Record<string, unknown>) {
    const macroString = `
      {% from "components/card.njk" import card %}
      {{ card(params) }}
    `
    const output = njkEnv.renderString(macroString, { params })
    return cheerio.load(output)
  }

  it('should render the heading and description', () => {
    const $ = renderCard({
      heading: 'My Title',
      description: 'My Description',
      href: '/some/reference',
    })

    const href = $('a').first().attr('href')

    expect($('.card__heading').text().trim()).toBe('My Title')
    expect($('.card__description').text().trim()).toBe('My Description')
    expect(href).toBe('/some/reference')
  })
})
