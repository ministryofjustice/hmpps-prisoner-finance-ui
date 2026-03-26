import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import { createProfileTabsForPrisoner } from '../../../utils/utils'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'

const PRISONER = {
  firstName: 'John',
  lastName: 'Smith',
  prisonerNumber: 'AB123456',
  cellLocation: 'RECP',
  csra: 'Standard',
  category: 'C',
  currentIncentive: {
    level: {
      code: 'STD',
      description: 'Standard',
    },
  },
}

describe('View Components - Prisoner Information Header', () => {
  const njkEnv = nunjucks.configure(
    ['server/views', 'node_modules/govuk-frontend/dist', 'node_modules/@ministryofjustice/frontend/'],
    {
      autoescape: true,
      trimBlocks: true,
      lstripBlocks: true,
    },
  )

  setUpNunJucksFilters(njkEnv)

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

    expect($('[data-testid="prisonerName"]').text().trim()).toBe(`${PRISONER.lastName}, ${PRISONER.firstName}`)
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

  it('should render prisoner info links', () => {
    const $ = renderPrisonerInformationHeader({
      prisoner: PRISONER,
    })

    const cellLocation = $('[data-testid="cell-location"]')
    const category = $('[data-testid="category"]')
    const csra = $('[data-testid="csra"]')
    const incentiveLevel = $('[data-testid="incentive-level"]')

    expect(cellLocation.text()).toContain('RECP')
    expect(category.text()).toContain('C')
    expect(csra.text()).toContain('Standard')
    expect(incentiveLevel.text()).toContain('Standard')
  })

  it('should render default value if header categories are undefined', () => {
    const prisonerMissingCsrAndCategory = {
      firstName: 'John',
      lastName: 'Smith',
      prisonerNumber: 'AB123456',
      cellLocation: 'RECP',
      currentIncentive: {
        level: {
          code: 'STD',
          description: 'Standard',
        },
      },
    }

    const $ = renderPrisonerInformationHeader({
      prisoner: prisonerMissingCsrAndCategory,
    })

    const category = $('[data-testid="category"]')
    const csra = $('[data-testid="csra"]')

    expect(category.text()).toContain('Not entered')
    expect(csra.text()).toContain('Not entered')
  })

  it('should render default tabs and correct hrefs', () => {
    const $ = renderPrisonerInformationHeader({
      prisoner: PRISONER,
    })

    const profileTabs = $('[data-testid="profile-tabs"]')
    const tabs = profileTabs.children('li')

    const content = createProfileTabsForPrisoner({ prisonNumber: PRISONER.prisonerNumber })

    expect(tabs).toHaveLength(content.length)

    content.forEach(({ href, tabName }, i) => {
      const element = $(tabs[i]).children().first()
      expect(element.text()).toContain(tabName)
      if (element.prop('tagName') === 'A') {
        expect(element.attr('href')).toBe(href)
      } else {
        expect(element.prop('tagName')).toBe('SPAN')
      }
    })
  })
})
