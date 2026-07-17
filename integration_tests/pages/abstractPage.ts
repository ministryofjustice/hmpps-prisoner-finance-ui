import { expect, type Locator, type Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

export default class AbstractPage {
  static url: string = '/prisoner'

  static headingText: string = 'View prisoner finances'

  readonly page: Page

  /** user name that appear in header */
  readonly usersName: Locator

  /** phase banner that appear in header */
  readonly phaseBanner: Locator

  /** link to sign out */
  readonly signoutLink: Locator

  /** link to manage user details */
  readonly manageUserDetails: Locator

  protected constructor(page: Page) {
    this.page = page
    this.phaseBanner = page.locator('.govuk-phase-banner')
    this.usersName = page.getByTestId('header-user-name')
    this.signoutLink = page.getByRole('link', { name: 'Sign out', exact: true })
    this.manageUserDetails = page.getByRole('link', { name: 'Manage user details', exact: true })
  }

  async signOut() {
    await this.signoutLink.first().click()
  }

  async clickManageUserDetails() {
    await this.manageUserDetails.first().click()
  }

  async passesAutomatedAccessibilityTests() {
    const accessibilityScanResults = await new AxeBuilder({ page: this.page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  }
}
