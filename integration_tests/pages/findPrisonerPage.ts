import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class FindPrisonerPage extends AbstractPage {
  static url: string = '/prisoner'

  static headingText: string = 'View prisoner finances'

  readonly heading: Locator

  readonly prisonNumberInput: Locator

  readonly submitButton: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: FindPrisonerPage.headingText, exact: true })

    this.prisonNumberInput = page.getByLabel('Enter a prison number', { exact: true })
    this.submitButton = page.getByRole('button', { name: 'Submit', exact: true })
  }

  static async goto(page: Page): Promise<void> {
    await page.goto(this.url)
  }

  static async verifyOnPage(page: Page): Promise<FindPrisonerPage> {
    expect(new URL(page.url()).pathname).toBe(this.url)

    const pageObject = new FindPrisonerPage(page)
    await expect(pageObject.heading).toBeVisible()
    return pageObject
  }

  static async visit(page: Page): Promise<FindPrisonerPage> {
    await this.goto(page)
    return this.verifyOnPage(page)
  }

  async enterPrisonNumber(prisonNumber: string): Promise<void> {
    await this.prisonNumberInput.fill(prisonNumber)
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }

  async findPrisonerByPrisonNumber(prisonNumber: string): Promise<void> {
    await this.enterPrisonNumber(prisonNumber)
    await this.submit()
  }

  async hasErrorMessage(errorMessage: string): Promise<void> {
    await expect(this.page.locator('main')).toContainText(errorMessage)
  }
}
