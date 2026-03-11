import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'

const PRISONER = { firstName: 'John', lastName: 'Smith', prisonerNumber: 'AB123456' }

describe('View Components - Prisoner Information Header', () => {
  const njkEnv = nunjucks.configure(
    ['server/views', 'node_modules/govuk-frontend/dist', 'node_modules/@ministryofjustice/frontend/'],
    {
      autoescape: true,
      trimBlocks: true,
      lstripBlocks: true,
    },
  )

  function renderPrisonerInformationHeader(params: Record<string, unknown>) {
    const macroString = `
      {% from "components/prisonerInformationHeader/prisonerInformationHeader.njk" import prisonerInformationHeader %}
      {{ prisonerInformationHeader(params) }}
    `
    const output = njkEnv.renderString(macroString, { params })
    return cheerio.load(output)
  }

  it('should render the heading and description', () => {
    const $ = renderPrisonerInformationHeader({
      prisoner: PRISONER,
    })

    expect($('[data-testid="prisonerName"]').text()).toBe(`${PRISONER.firstName} ${PRISONER.lastName}`)
  })

  it('should render the heading profile image', () => {
    const $ = renderPrisonerInformationHeader({
      prisoner: PRISONER,
    })

    expect($('[data-testid="prisonerProfileImage"]').attr('src')).toBe('/assets/images/prisoner-profile-image.png')
  })

  it('should render prisoner number', () => {
    const $ = renderPrisonerInformationHeader({
      prisoner: PRISONER,
    })

    expect($('[data-testid="prisonerNumber"]').text()).toContain(`${PRISONER.prisonerNumber}`)
  })
})
