import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class InternalServerErrorPage extends AbstractPage {
  readonly heading: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Sorry, there is a problem with the service', exact: true })
    this.continueButton = page.getByRole('button', { name: 'Continue', exact: true })
  }

  static async verifyOnPage(page: Page, path: string): Promise<InternalServerErrorPage> {
    expect(new URL(page.url()).pathname).toEqual(path)

    const internalServerErrorPage = new InternalServerErrorPage(page)
    await expect(internalServerErrorPage.heading).toBeVisible()
    return internalServerErrorPage
  }
}
