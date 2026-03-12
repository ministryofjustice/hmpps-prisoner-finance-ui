import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'

describe('View Components - summaryCard', () => {
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
    {% from "components/summaryCard/summaryCard.njk" import summaryCard %}
        {% call summaryCard(params) %}
          <h1 data-testid="test-child">hello world</h1>
        {% endcall %}
    `
    const output = njkEnv.renderString(macroString, { params })
    return cheerio.load(output)
  }

  it('should render the heading and render child', () => {
    const $ = renderCard({
      heading: 'Test',
    })

    expect($('.hmpps-summary-card__heading').text().trim()).toBe('Test')
    expect($('[data-testid="test-child"]').text().trim()).toBe('hello world')
  })
})
