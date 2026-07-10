import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'

describe('View Components - ConfirmationPanel', () => {
  const njkEnv = nunjucks.configure(
    ['server/views', 'node_modules/govuk-frontend/dist', 'node_modules/@ministryofjustice/frontend/'],
    {
      autoescape: true,
      trimBlocks: true,
      lstripBlocks: true,
    },
  )

  setUpNunJucksFilters(njkEnv)

  function renderPanel(params: Record<string, unknown>) {
    const macroString = `
      {% from "components/confirmationPanel/confirmationPanel.njk" import confirmationPanel %}
      {{ confirmationPanel(params) }}
    `
    const output = njkEnv.renderString(macroString, { params })
    return cheerio.load(output)
  }

  it('should render the GOV.UK panel with the correct title and transaction number', () => {
    const $ = renderPanel({
      panelTitle: 'Application complete',
      transactionNumber: 'HDJ2123F',
    })

    expect($('.govuk-panel__title').text().trim()).toBe('Application complete')

    // The panel body contains the transaction number HTML
    const panelBodyText = $('.govuk-panel__body').text().trim()
    expect(panelBodyText).toContain('Your transaction number')
    expect($('.govuk-panel__body strong').text().trim()).toBe('HDJ2123F')

    expect($('[data-testid="confirmation-panel"]').length).toBe(1)
  })

  it('should render the "What happens next" section with the confirmation message', () => {
    const $ = renderPanel({
      confirmationMessage: 'We have sent you a confirmation email.',
    })

    expect($('.govuk-heading-m').text().trim()).toBe('What happens next')

    const paragraphText = $('.govuk-body').text().trim()
    expect(paragraphText).toContain('We have sent you a confirmation email.')
  })

  it('should render the confirmation link with the correct href and text', () => {
    const $ = renderPanel({
      confirmationHref: '/return-home',
      confirmationMessageLinkText: 'Return to the homepage',
    })

    const $link = $('[data-testid="confirmation-message-link"]')

    expect($link.text().trim()).toBe('Return to the homepage')
    expect($link.attr('href')).toBe('/return-home')
  })

  it('should integrate the message and link together correctly', () => {
    const $ = renderPanel({
      confirmationMessage: 'You can now ',
      confirmationHref: '/dashboard',
      confirmationMessageLinkText: 'view your dashboard',
    })

    const paragraphText = $('.govuk-body').text().replace(/\s+/g, ' ').trim()

    expect(paragraphText).toBe('You can now view your dashboard.')
    expect($('[data-testid="confirmation-message-link"]').attr('href')).toBe('/dashboard')
  })
})
