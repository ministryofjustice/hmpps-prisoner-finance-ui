import { expect, test } from '@playwright/test'

import { login, resetStubs } from '../testUtils'

import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import * as prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonApi from '../mockApis/prisonApi'

import FindPrisonerPage from '../pages/findPrisonerPage'
import PrisonerFinancialProfilePage from '../pages/prisonerFinancialProfilePage'
import PrisonerNotFoundErrorPage from '../pages/prisonerNotFoundErrorPage'
import hmppsAuth from '../mockApis/hmppsAuth'

test.describe('Finding a prisoners financial profile', () => {
  const prisonNumber = 'A1234BC'

  const stubPrisonerProfile = async () => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonApi.stubGetPrisonerImage()
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS')
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH')
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS')
  }

  test.beforeEach(async () => {
    await resetStubs()
  })

  test.describe('When not authenticated', () => {
    test.beforeEach(async () => {
      await hmppsAuth.stubSignInPage()
    })

    test('Is directed to auth', async ({ page }) => {
      await FindPrisonerPage.goto(page)

      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    })
  })

  test.describe('When authenticated', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, { name: 'A TestUser' })
    })

    test('User name visible in header', async ({ page }) => {
      const findPrisonerPage = await FindPrisonerPage.visit(page)
      await expect(findPrisonerPage.usersName).toHaveText('A. Testuser')
    })

    test('Phase banner visible in header', async ({ page }) => {
      const findPrisonerPage = await FindPrisonerPage.visit(page)
      await expect(findPrisonerPage.phaseBanner).toBeVisible()
    })

    test('User can sign out', async ({ page }) => {
      const findPrisonerPage = await FindPrisonerPage.visit(page)
      await findPrisonerPage.signOut()

      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    })

    test('Page has no automatically detectable WCAG A or AA violations', async ({ page }) => {
      const findPrisonerPage = await FindPrisonerPage.visit(page)
      await findPrisonerPage.passesAutomatedAccessibilityTests()
    })
  })

  test.describe('When searching', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, { name: 'A TestUser' })
    })

    test.describe('with a valid prison number', () => {
      test("show the prisoner's financial profile", async ({ page }) => {
        await stubPrisonerProfile()

        const findPrisonerPage = await FindPrisonerPage.visit(page)
        await findPrisonerPage.findPrisonerByPrisonNumber(prisonNumber)

        await PrisonerFinancialProfilePage.verifyOnPage(page, prisonNumber)
      })
    })

    test.describe('with no prison number', () => {
      test.beforeEach(async ({ page }) => {
        await login(page, { name: 'A TestUser' })
      })

      test('shows a validation error message', async ({ page }) => {
        let findPrisonerPage = await FindPrisonerPage.visit(page)

        await findPrisonerPage.submitButton.click()

        findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)
        await findPrisonerPage.hasErrorMessage('Enter a prison number')
      })
    })

    test.describe('With only whitespace', () => {
      test('shows a validation error message', async ({ page }) => {
        const findPrisonerPage = await FindPrisonerPage.visit(page)

        await findPrisonerPage.findPrisonerByPrisonNumber('   ')

        await findPrisonerPage.hasErrorMessage('Enter a prison number')
      })
    })

    test.describe('With an invalid prison number', () => {
      test('Informs the user that the prisoner was not found', async ({ page }) => {
        const invalidPrisonNumber = 'Z9999ZZ'
        await prisonerSearchApi.stubGetPrisonerNotFound(invalidPrisonNumber)

        const findPrisonerPage = await FindPrisonerPage.visit(page)
        await findPrisonerPage.findPrisonerByPrisonNumber(invalidPrisonNumber)

        const prisonerNotFoundPage = await PrisonerNotFoundErrorPage.verifyOnPage(page, invalidPrisonNumber)
        await prisonerNotFoundPage.findPrisonerLink.click()

        await FindPrisonerPage.verifyOnPage(page)
      })
    })
  })
})
