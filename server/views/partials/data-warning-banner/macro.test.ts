import * as cheerio from 'cheerio'
import { expect } from '@playwright/test'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../utils/nunjucksSetup'

describe('Prisoner Finance Component: Data warning banner', () => {
  let njkEnv: nunjucks.Environment

  const renderMacro = (enabled: boolean) => {
    const template = `
      {% from "partials/data-warning-banner/macro.njk" import dataWarningBanner %}
      {{ dataWarningBanner(${enabled}) }}
    `
    return njkEnv.renderString(template, {})
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

  test('Should show warning banner when it is enabled', () => {
    const html = renderMacro(true)
    const $ = cheerio.load(html)

    expect($('.data-warning-banner').length).toBe(1)
    expect($('.moj-alert--warning').length).toBe(1)
    expect($('.moj-alert--information').length).toBe(0)
  })

  test('Should not show warning banner when it is not enabled', () => {
    const html = renderMacro(false)
    const $ = cheerio.load(html)

    expect($('.data-warning-banner').length).toBe(0)
    expect($('.moj-alert--warning').length).toBe(0)
    expect($('.moj-alert--information').length).toBe(0)
  })
})
