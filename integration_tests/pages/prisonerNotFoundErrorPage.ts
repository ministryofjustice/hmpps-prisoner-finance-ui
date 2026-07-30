import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerNotFoundErrorPage extends AbstractPage {
  readonly heading: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Prisoner not found', exact: true })
    this.continueButton = page.getByRole('button', { name: 'Continue', exact: true })
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<PrisonerNotFoundErrorPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}`)

    const prisonerNotFoundErrorPage = new PrisonerNotFoundErrorPage(page)
    await expect(prisonerNotFoundErrorPage.heading).toBeVisible()
    return prisonerNotFoundErrorPage
  }
}
