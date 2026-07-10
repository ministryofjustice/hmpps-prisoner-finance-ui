import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
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

  it('should render the category', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.mini-profile-info').text().replace(/\s+/g, ' ').trim()).toContain('Category C')
  })

  it('should render the CSRA', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.mini-profile-info').text().replace(/\s+/g, ' ').trim()).toContain('CSRA Standard')
  })

  it('should render the Incentive level', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.mini-profile-info').text().replace(/\s+/g, ' ').trim()).toContain('Incentive level Standard')
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

    const info = $('.mini-profile-info')

    expect(info.text()).not.toContain('Category')
    expect(info.text()).not.toContain('CSRA')
  })
})
