import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class InternalServerErrorPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'An error has occured', exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })
  }

  static async verifyOnPage(page: Page, path: string): Promise<InternalServerErrorPage> {
    expect(new URL(page.url()).pathname).toEqual(path)

    const internalServerErrorPage = new InternalServerErrorPage(page)
    await expect(internalServerErrorPage.heading).toBeVisible()
    return internalServerErrorPage
  }
}
