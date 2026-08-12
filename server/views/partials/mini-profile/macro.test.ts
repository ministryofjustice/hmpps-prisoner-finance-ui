import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'
import PrisonerDetails from '../../../@types/prisonerDetails'

const PRISONER: PrisonerDetails = {
  firstName: 'John',
  lastName: 'Smith',
  dateOfBirth: '1990-01-01',
  prisonerNumber: 'AB123456',
  prisonName: 'HMP Leeds',
  prisonId: 'LEI',
  cellLocation: 'RECP',
  csra: 'Standard',
  category: 'C',
  currentIncentiveLevelDescription: 'Standard',
  bookingId: '123456',
}

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
    const link = $('#mini-profile-prisoner-profile-link')

    expect(link.attr('href')).toContain('/prisoner/AB123456')
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

  it('should render the location', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.mini-profile-info').text().replace(/\s+/g, ' ').trim()).toContain('Location RECP')
    const link = $('#mini-profile-prisoner-location-link')

    expect(link.attr('href')).toContain('/prisoner/AB123456/location-details')
  })

  it('should render the category', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.mini-profile-info').text().replace(/\s+/g, ' ').trim()).toContain('Category C')

    const link = $('#mini-profile-prisoner-categorisation-dashboard-link')

    expect(link.attr('href')).toContain('/123456')
  })

  it('should render the CSRA', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.mini-profile-info').text().replace(/\s+/g, ' ').trim()).toContain('CSRA Standard')
    const link = $('#mini-profile-prisoner-csra-link')

    expect(link.attr('href')).toContain('/prisoner/AB123456/csra-history')
  })

  it('should render the Incentive level', () => {
    const html = renderMacro(PRISONER)
    const $ = cheerio.load(html)

    expect($('.mini-profile-info').text().replace(/\s+/g, ' ').trim()).toContain('Incentive level Standard')
    const link = $('#mini-profile-prisoner-incentives-link')

    expect(link.attr('href')).toContain('/AB123456')
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

    expect(info.text().replaceAll(/\s+/g, ' ')).toContain('Category Not entered')
    expect(info.text().replaceAll(/\s+/g, ' ')).toContain('CSRA Not entered')
  })
})
