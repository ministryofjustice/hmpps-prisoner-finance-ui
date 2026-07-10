import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'

describe('View Components - RadiosSelectionForm', () => {
  const njkEnv = nunjucks.configure(
    ['server/views', 'node_modules/govuk-frontend/dist', 'node_modules/@ministryofjustice/frontend/'],
    {
      autoescape: true,
      trimBlocks: true,
      lstripBlocks: true,
    },
  )

  setUpNunJucksFilters(njkEnv)

  function renderForm(params: Record<string, unknown>) {
    const macroString = `
      {% from "components/forms/radiosSelectionForm.njk" import radiosSelectionForm %}
      {{ radiosSelectionForm(params) }}
    `
    const output = njkEnv.renderString(macroString, { params })
    return cheerio.load(output)
  }

  it('should render the form with correct action and CSRF token', () => {
    const $ = renderForm({
      action: '/submit-selection',
      csrfToken: 'mock-csrf-token-456',
    })

    const $form = $('form[data-testid="select-radios-form"]')
    expect($form.attr('action')).toBe('/submit-selection')
    expect($form.attr('method')).toBe('POST')

    const csrfInput = $('input[name="_csrf"]')
    expect(csrfInput.attr('type')).toBe('hidden')
    expect(csrfInput.val()).toBe('mock-csrf-token-456')
  })

  it('should render the fieldset heading', () => {
    const $ = renderForm({
      headingText: 'Select a payment method',
    })

    const legendText = $('.govuk-fieldset__legend').text().trim()
    expect(legendText).toBe('Select a payment method')
  })

  it('should render the subheading when provided', () => {
    const $ = renderForm({
      subHeading: 'Available options',
    })

    const $subHeading = $('[data-testid="radio-group-heading"]')
    expect($subHeading.length).toBe(1)
    expect($subHeading.text().trim()).toBe('Available options')
  })

  it('should NOT render a subheading when not provided', () => {
    const $ = renderForm({})

    const $subHeading = $('[data-testid="radio-group-heading"]')
    expect($subHeading.length).toBe(0)
  })

  it('should render the radio items and select the correct value', () => {
    const $ = renderForm({
      radiosId: 'paymentMethod',
      radiosValue: 'card',
      radiosItems: [
        { value: 'cash', text: 'Cash' },
        { value: 'card', text: 'Credit/Debit Card' },
      ],
    })

    const $radios = $('input[type="radio"]')
    expect($radios.length).toBe(2)

    expect($radios.eq(0).attr('name')).toBe('paymentMethod')
    expect($radios.eq(0).val()).toBe('cash')

    expect($radios.eq(1).attr('name')).toBe('paymentMethod')
    expect($radios.eq(1).val()).toBe('card')

    expect($radios.eq(0).attr('checked')).toBeUndefined()
    expect($radios.eq(1).attr('checked')).toBe('checked')
  })

  it('should render an error message if errorMap is populated', () => {
    const $ = renderForm({
      radiosId: 'paymentMethod',
      errorMap: {
        errorText: 'You must select a payment method',
      },
    })

    // GOV.UK frontend typically appends '-error' to the ID of the radios component
    const errorText = $('#paymentMethod-error').text().trim()

    expect(errorText).toContain('You must select a payment method')
  })

  it('should render the Continue button', () => {
    const $ = renderForm({})

    const $button = $('[type=submit]')
    expect($button.text().trim()).toBe('Continue')
  })
})
