import * as cheerio from 'cheerio'
import { expect } from '@playwright/test'
import nunjucks from 'nunjucks'
import { setUpNunJucksFilters } from '../../../../utils/nunjucksSetup'
import { mapItemsForRadioButtons } from '../../../../utils/utils'
import ActiveCaseloadResponse from '../../../../interfaces/ActiveCaseloadResponse'

describe('Credit A Prisoner - Credit To Page', () => {
  let $: cheerio.CheerioAPI
  let njkEnv: nunjucks.Environment

  const caseloads: ActiveCaseloadResponse[] = [
    {
      caseLoadId: 'MDI',
      description: 'Moorland Closed (HMP & YOI)',
      type: 'INST',
      caseloadFunction: 'GENERAL',
      currentlyActive: false,
    },
    {
      caseLoadId: 'LEI',
      description: 'Leeds Prison (LEI)',
      type: 'INST',
      caseloadFunction: 'GENERAL',
      currentlyActive: false,
    },
    {
      caseLoadId: 'LPI',
      description: 'Liverpool Prison (LPI)',
      type: 'INST',
      caseloadFunction: 'GENERAL',
      currentlyActive: false,
    },
  ]

  const mappedCaseloads = mapItemsForRadioButtons({
    input: caseloads,
    valueKey: 'caseLoadId',
    textKey: 'description',
    dataTestId: 'caseload-radio',
  })

  const params = {
    applicationName: 'Hmpps Prisoner Finance Ui',
    caseloads: mappedCaseloads,
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

    const html = njkEnv.render('pages/grantBonusToPrisoners/grantBonusToPrisoners/grantBonusToPrisoners.njk', params)

    $ = cheerio.load(html)
  })

  test('Renders the clickable radio buttons and continue button', () => {
    const formCollection = $("[data-testid='select-radios-form']")
    expect(formCollection.length).toBe(1)

    const radioButtons = $("[data-testid='caseload-radio']")
    expect(radioButtons.length).toBe(3)

    const continueButton = $("[data-testid='continue-button']")
    expect(continueButton.length).toBe(1)
  })
})
