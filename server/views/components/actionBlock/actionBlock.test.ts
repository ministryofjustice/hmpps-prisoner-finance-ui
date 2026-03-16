import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'

describe('View Components - ActionBlock', () => {
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
      {% from "components/actionBlock/actionBlock.njk" import actionBlock %}
      {{ actionBlock(params) }}
    `
    const output = njkEnv.renderString(macroString, { params })
    return cheerio.load(output)
  }

  it('should render the action block with 1 action', () => {
    const $ = renderCard({actions: [{text: 'action 1', 'dataTestId': 'test-child'}]})

    expect($('[data-testid="test-child"]').text().trim()).toBe('action 1')
  })
})
