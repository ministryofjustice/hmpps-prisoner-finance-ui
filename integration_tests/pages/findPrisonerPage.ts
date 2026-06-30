import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class FindPrisonerPage extends AbstractPage {
  readonly heading: Locator

  readonly prisonNumberInput: Locator

  readonly submitButton: Locator

  readonly errorMessage: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Enter a prison number', exact: true })

    this.prisonNumberInput = page.getByLabel('Enter a prison number', { exact: true })
    this.submitButton = page.getByRole('button', { name: 'Submit', exact: true })

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
