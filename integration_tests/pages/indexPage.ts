import { Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PlaywrightHelper extends AbstractPage {
  static async applyToPage(page: Page): Promise<PlaywrightHelper> {
    const homePage = new PlaywrightHelper(page)
    return homePage
  }
}
