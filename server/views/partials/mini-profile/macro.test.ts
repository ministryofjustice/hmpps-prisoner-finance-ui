import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import { createProfileTabsForPrisoner } from '../../../utils/utils'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'
import PrisonerDetails from '../../../@types/prisonerDetails'

const PRISONER = {
  firstName: 'John',
  lastName: 'Smith',
  dateOfBirth: '1990-01-01',
  prisonerNumber: 'AB123456',
  prisonName: 'HMP Leeds',
  prisonId: 'LEI',
  cellLocation: 'RECP',
  csra: 'Standard',
  category: 'C',
  currentIncentive: {
    level: {
      code: 'STD',
      description: 'Standard',
    },
  },
} as PrisonerDetails

describe('Prisoner Finance Component: Mini profile', () => {
  let njkEnv: nunjucks.Environment

  const renderMacro = (params: PrisonerDetails) => {
    const template = `
      {% from "partials/mini-profile/macro.njk" import miniProfile %}
      {{ miniProfile(params) }}
    `
    return njkEnv.renderString(template, { params })
  }

  beforeAll(() => {
    njkEnv = nunjucks.configure(
      ['server/views', 'node_modules/govuk-frontend/dist', 'node_modules/@ministryofjustice/frontend/'],
      {
        autoescape: true,
        trimBlocks: true,
        lstripBlocks: true,
      },
    )

    setUpNunJucksFilters(njkEnv)
  })

  it('should render the prisoners name', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.mini-profile').text().replace(/\s+/g, ' ').trim()).toContain('Smith, John')
  })

  it('should render the heading profile image', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('img').attr('src')).toBe('/prisoner-image/AB123456')
  })

  it('should render prisoner number', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.mini-profile-info').text().replace(/\s+/g, ' ').trim()).toContain('AB123456')
  })

  it('should render date of birth', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.mini-profile-info').text().replace(/\s+/g, ' ').trim()).toContain('Date of birth 1 January 1990')
  })

  it('should render the prison name', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.mini-profile-info').text().replace(/\s+/g, ' ').trim()).toContain('Establishment HMP Leeds')
  })

  it('should render the location', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.mini-profile-info').text().replace(/\s+/g, ' ').trim()).toContain('Cell number RECP')
  })

  it.skip('should render prisoner info links', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    const category = $('[data-testid="category"]')
    const csra = $('[data-testid="csra"]')
    const incentiveLevel = $('[data-testid="incentive-level"]')

    expect(category.text()).toContain('C')
    expect(csra.text()).toContain('Standard')
    expect(incentiveLevel.text()).toContain('Standard')
  })

  it.skip('should render default value if header categories are undefined', () => {
    const prisonerMissingCsrAndCategory = {
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '1990-01-01',
      prisonerNumber: 'AB123456',
      cellLocation: 'RECP',
      currentIncentive: {
        level: {
          code: 'STD',
          description: 'Standard',
        },
      },
    } as PrisonerDetails

    const html = renderMacro(prisonerMissingCsrAndCategory)
    const $ = cheerio.load(html)

    const category = $('[data-testid="category"]')
    const csra = $('[data-testid="csra"]')

    expect(category.text()).toContain('Not entered')
    expect(csra.text()).toContain('Not entered')
  })

  // temporary disabled for UR
  it.skip('should render default tabs and correct hrefs', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

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
