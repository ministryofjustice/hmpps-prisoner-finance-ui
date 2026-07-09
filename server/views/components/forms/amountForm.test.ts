import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'

describe('View Components - AmountForm', () => {
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
      {% from "components/forms/amountForm.njk" import amountForm %}
      {{ amountForm(params) }}
    `
    const output = njkEnv.renderString(macroString, { params })
    return cheerio.load(output)
  }

  it('should render the form with correct action and CSRF token', () => {
    const $ = renderForm({
      action: '/submit-amount',
      csrfToken: 'mock-csrf-token-123',
    })

    const $form = $('form[data-testid="select-amount"]')
    expect($form.attr('action')).toBe('/submit-amount')
    expect($form.attr('method')).toBe('POST')

    const csrfInput = $('input[name="_csrf"]')
    expect(csrfInput.attr('type')).toBe('hidden')
    expect(csrfInput.val()).toBe('mock-csrf-token-123')
  })

  it('should render the fieldset heading', () => {
    const $ = renderForm({
      headingText: 'Enter amount and description',
    })

    const legendText = $('.govuk-fieldset__legend').text().trim()
    expect(legendText).toBe('Enter amount and description')
  })

  it('should render the amount input with prefix and value', () => {
    const $ = renderForm({
      amountValue: '50.00',
    })

    const $amountInput = $('#amount')
    const prefixText = $('.govuk-input__prefix').text().trim()

    expect($amountInput.val()).toBe('50.00')
    expect(prefixText).toBe('£')
  })

  it('should render the description input with value', () => {
    const $ = renderForm({
      descriptionValue: 'Refund for travel',
    })

    const $descriptionInput = $('#description')

    expect($descriptionInput.val()).toBe('Refund for travel')
  })

  it('should render the submit button', () => {
    const $ = renderForm({})

    const $button = $('[type=submit]')
    expect($button.text().trim()).toBe('Done')
  })

  it('should render error messages when errorMap is populated', () => {
    const $ = renderForm({
      errorMap: {
        amount: 'Enter a valid amount',
        description: 'Description must be under 50 characters',
      },
    })

    // GOV.UK frontend automatically appends '-error' to the input ID for the error message container
    const amountErrorText = $('#amount-error').text().trim()
    const descriptionErrorText = $('#description-error').text().trim()

    expect(amountErrorText).toContain('Enter a valid amount')
    expect(descriptionErrorText).toContain('Description must be under 50 characters')
  })

  it('should safely omit errors when errorMap is not provided', () => {
    const $ = renderForm({
      errorMap: {},
    })

    expect($('#amount-error').length).toBe(0)
    expect($('#description-error').length).toBe(0)
  })
})
