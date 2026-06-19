import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class FindPrisonerPage extends AbstractPage {
  readonly heading: Locator

  readonly prisonNumberInput: Locator

  readonly submitButton: Locator

  readonly errorMessage: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Enter a prison number' })
    this.prisonNumberInput = page.locator('[data-testid="prisoner-number-input"]')
    this.submitButton = page.locator('[data-testid="submit-button"]')
    this.errorMessage = page.locator('#prisonNumber-error')
  }

  static async verifyOnPage(page: Page): Promise<FindPrisonerPage> {
    const findPrisonerPage = new FindPrisonerPage(page)
    await expect(findPrisonerPage.heading).toBeVisible()
    return findPrisonerPage
  }

  async findPrisoner(prisonNumber: string): Promise<void> {
    await this.prisonNumberInput.fill(prisonNumber)
    await this.submitButton.click()
  }
}
