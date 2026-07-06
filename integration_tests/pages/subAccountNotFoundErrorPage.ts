import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class SubAccountNotFoundErrorPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'An error has occured', exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })
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
