import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class SubAccountNotFoundErrorPage extends AbstractPage {
  readonly heading: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Page not found', exact: true })
    this.continueButton = page.getByRole('button', { name: 'Continue', exact: true })
  }

  static async verifyOnPage(
    page: Page,
    prisonNumber: string,
    subAccountReference: string,
  ): Promise<SubAccountNotFoundErrorPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}/money/${subAccountReference}`)

    const subAccountNotFoundErrorPage = new SubAccountNotFoundErrorPage(page)
    await expect(subAccountNotFoundErrorPage.heading).toBeVisible()
    return subAccountNotFoundErrorPage
  }
}
