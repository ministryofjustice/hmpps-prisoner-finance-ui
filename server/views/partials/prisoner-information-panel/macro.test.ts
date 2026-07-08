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

describe('Prisoner Finance Component: Prisoner information panel', () => {
  let njkEnv: nunjucks.Environment

  const renderMacro = (params: PrisonerDetails) => {
    const template = `
      {% from "partials/prisoner-information-panel/macro.njk" import prisonerInformationPanel %}
      {{ prisonerInformationPanel(params) }}
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

    expect($('.hmpps-profile-banner').text().replace(/\s+/g, ' ').trim()).toContain('Smith, John')
  })

  it('should render the heading profile image', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('img').attr('src')).toBe('/prisoner-image/AB123456')
  })

  it('should render prisoner number', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.hmpps-profile-prisoner-number').text().replace(/\s+/g, ' ').trim()).toContain('AB123456 prison number')
  })

  it.skip('should render date of birth', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.hmpps-profile-banner .info').text().replace(/\s+/g, ' ').trim()).toContain('Date of birth 1990-01-01')
  })

  it.skip('should render the prison name', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.hmpps-profile-banner .info').text().replace(/\s+/g, ' ').trim()).toContain('Prison HMP Leeds')
  })

  it('should render the location', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.hmpps-profile-banner .info').text().replace(/\s+/g, ' ').trim()).toContain('Location RECP')
  })

  it('should render the category', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.hmpps-profile-banner .info').text().replace(/\s+/g, ' ').trim()).toContain('Category C')
  })

  it('should render the CSRA', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.hmpps-profile-banner .info').text().replace(/\s+/g, ' ').trim()).toContain('CSRA Standard')
  })

  it('should render the Incentive level', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.hmpps-profile-banner .info').text().replace(/\s+/g, ' ').trim()).toContain('Incentive level Standard')
  })

  it('should render default value if header categories are undefined', () => {
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

    const info = $('.hmpps-profile-banner .info')

    expect(info.text().replace(/\s+/g, ' ').trim()).toContain('Category Not entered')
    expect(info.text().replace(/\s+/g, ' ').trim()).toContain('CSRA Not entered')
  })

  it('should not render default tabs', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    const profileTabs = $('[data-testid="profile-tabs"]')
    expect(profileTabs).toHaveLength(0)
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
