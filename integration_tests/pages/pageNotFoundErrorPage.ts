import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PageNotFoundErrorPage extends AbstractPage {
  readonly heading: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Page not found', exact: true })
  }

  static async verifyOnPage(page: Page, path: string): Promise<PageNotFoundErrorPage> {
    expect(new URL(page.url()).pathname).toEqual(path)

    const pageNotFoundErrorPage = new PageNotFoundErrorPage(page)
    await expect(pageNotFoundErrorPage.heading).toBeVisible()
    return pageNotFoundErrorPage
  }
}
