import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login, resetStubs } from '../testUtils'
import PrisonerMoneyPage from '../pages/prisonerMoneyPage'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../../server/interfaces/AccountBalanceResponse'
import prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import prisonRegisterApi from '../mockApis/prisonRegisterApi'
import { Page } from '../../server/interfaces/Pageable'
import { SubAccountBalanceResponse } from '../../server/interfaces/SubAccountBalanceResponse'

test.describe('Prisoner Money', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  const transactionPayload: Array<PrisonerTransactionResponse> = [
    {
      date: '2026-03-10T10:48:28.094Z',
      description: 'test',
      credit: 0,
      debit: 10,
      location: 'LEI',
      accountType: 'CASH',
    },
    {
      date: '2026-03-10T10:47:28.094Z',
      description: '',
      credit: 20,
      debit: 0,
      location: 'MDI',
      accountType: 'SAVINGS',
    },
    {
      date: '2026-03-10T10:46:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 0,
      debit: 10,
      location: '',
      accountType: 'CASH',
    },
    {
      date: '2026-03-10T10:45:28.194Z',
      description: 'Transaction in secret prison',
      credit: 10,
      debit: 0,
      location: 'XXX',
      accountType: 'SAVINGS',
    },
  ]

  const pageTransactionsResponse: Page<PrisonerTransactionResponse> = {
    content: transactionPayload,
    totalElements: transactionPayload.length,
    totalPages: 1,
    pageNumber: 1,
    pageSize: 99,
    isLastPage: true,
  }

  const emptyPageTransactionsResponse: Page<PrisonerTransactionResponse> = {
    content: [],
    totalElements: 0,
    totalPages: 1,
    pageNumber: 1,
    pageSize: 99,
    isLastPage: true,
  }

  const balancePayload: AccountBalanceResponse = {
    accountId: '123456',
    balanceDateTime: '12:34:56',
    amount: 1234,
  }

  const subAccountBalancePayload: SubAccountBalanceResponse = {
    subAccountId: '123456',
    balanceDateTime: '12:34:56',
    amount: 1234,
  }

  const prisonNumber = 'ABC123XZ'

  const stubBalances = async (subAccountRef?: string) => {
    if (subAccountRef) {
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, subAccountRef, subAccountBalancePayload)
    } else {
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber, balancePayload)
    }
  }

  const baseStubs = async (subAccountRef?: string) => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
      subAccountReference: subAccountRef,
    })
    await prisonRegisterApi.stubGetPrisonNames()
    await stubBalances(subAccountRef)
  }

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  const transactionPage = [
    {
      url: `/prisoner/${prisonNumber}/money`,
      pageName: 'All Transactions page',
      pageHeading: 'Transactions for all sub accounts',
      subAccountReference: '',
    },
    {
      url: `/prisoner/${prisonNumber}/money/private-cash`,
      pageName: 'Private Cash page',
      pageHeading: 'Private cash transactions',
      subAccountReference: 'CASH',
    },
    {
      url: `/prisoner/${prisonNumber}/money/savings`,
      pageName: 'Savings page',
      pageHeading: 'Savings transactions',
      subAccountReference: 'SAVINGS',
    },
    {
      url: `/prisoner/${prisonNumber}/money/spends`,
      pageName: 'Spends page',
      pageHeading: 'Spends transactions',
      subAccountReference: 'SPENDS',
    },
  ]
  for (const { url, pageName, pageHeading, subAccountReference } of transactionPage) {
    test(`${pageName} - Should display Header and Transactions table`, async ({ page }) => {
      await baseStubs(subAccountReference)
      await page.goto(url)

      const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)
      expect(prisonerMoneyPage.heading).toBeVisible()
      expect(prisonerMoneyPage.heading).toContainText(pageHeading)
      expect(prisonerMoneyPage.tableTransactions).toBeVisible()
      expect(prisonerMoneyPage.tableTransactions.locator('thead tr th')).toHaveCount(6)

      const rows = prisonerMoneyPage.tableTransactions.locator('tbody tr')

      expect(rows).toHaveCount(transactionPayload.length)

      // Row 1
      let cells = rows.nth(0).locator('td')
      await expect(cells.nth(0)).toHaveText('10/03/2026\n10:48')
      await expect(cells.nth(1)).toHaveText('test')
      await expect(cells.nth(2)).toHaveText('£0.00')
      await expect(cells.nth(3)).toHaveText('£0.10')
      await expect(cells.nth(4)).toHaveText('Private cash')
      await expect(cells.nth(5)).toHaveText('Leeds (HMP)')

      // Row 2
      cells = rows.nth(1).locator('td')
      await expect(cells.nth(0)).toHaveText('10/03/2026\n10:47')
      await expect(cells.nth(1)).toHaveText('')
      await expect(cells.nth(2)).toHaveText('£0.20')
      await expect(cells.nth(3)).toHaveText('£0.00')
      await expect(cells.nth(4)).toHaveText('Savings')
      await expect(cells.nth(5)).toHaveText('Moorland (HMP & YOI)')

      // Row 3
      cells = rows.nth(2).locator('td')
      await expect(cells.nth(0)).toHaveText('10/03/2026\n10:46')
      await expect(cells.nth(1)).toHaveText('Cash to Savings Transfer')
      await expect(cells.nth(2)).toHaveText('£0.00')
      await expect(cells.nth(3)).toHaveText('£0.10')
      await expect(cells.nth(4)).toHaveText('Private cash')
      await expect(cells.nth(5)).toHaveText('')

      // Row 4
      cells = rows.nth(3).locator('td')
      await expect(cells.nth(0)).toHaveText('10/03/2026\n10:45')
      await expect(cells.nth(1)).toHaveText('Transaction in secret prison')
      await expect(cells.nth(2)).toHaveText('£0.10')
      await expect(cells.nth(3)).toHaveText('£0.00')
      await expect(cells.nth(4)).toHaveText('Savings')
      await expect(cells.nth(5)).toHaveText('XXX')
    })

    test(`${pageName} - Should display the balance cards with the total amounts`, async ({ page }) => {
      await baseStubs(subAccountReference)
      await page.goto(url)
      const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)

      expect(prisonerMoneyPage.currentBalanceCard).toBeVisible()

      expect(prisonerMoneyPage.holdBalanceCard).toBeVisible()

      expect(prisonerMoneyPage.totalBalanceCard).toBeVisible()

      expect(prisonerMoneyPage.currentBalanceCard.locator('h2')).toContainText('Current balance')
      expect(prisonerMoneyPage.currentBalanceCard.locator('.hmpps-balance-card__amount')).toContainText('£12.34')

      expect(prisonerMoneyPage.holdBalanceCard.locator('h2')).toContainText('Hold balance')
      expect(prisonerMoneyPage.holdBalanceCard.locator('.hmpps-balance-card__amount')).toContainText('£0.00')

      expect(prisonerMoneyPage.totalBalanceCard.locator('h2')).toContainText('Total balance')
      expect(prisonerMoneyPage.totalBalanceCard.locator('.hmpps-balance-card__amount')).toContainText('£12.34')
    })

    test(`${pageName} - Backlink should render and return to profile page`, async ({ page }) => {
      await baseStubs(subAccountReference)

      await page.goto(url)

      const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)

      expect(prisonerMoneyPage.backButton).toBeVisible()

      // stubs for profile page
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse)
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, 'SPENDS')
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, 'CASH')
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, 'SAVINGS')
      await prisonerMoneyPage.backButton.click()

      expect(new URL(page.url()).pathname).toBe(`/prisoner/${prisonNumber}`)
    })

    test(`${pageName} - Should handle 404 and render error`, async ({ page }) => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      if (subAccountReference) {
        await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, subAccountReference)
      } else {
        await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber, balancePayload)
      }
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumberNotFound(prisonNumber)
      await prisonRegisterApi.stubGetPrisonNames()

      const response = await page.goto(url)

      expect(response?.status()).toBe(404)
      expect(page.locator('[data-testid="error-page-message"]')).toContainText('Account not found')
      expect(page.locator('[data-testid="error-page-status"]')).toContainText('404')
    })

    test(`${pageName} - should handle page out of bound and redirect to a 404`, async ({ page }) => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumberReturnsPageOutOfBound(prisonNumber, {
        pageNumber: '999',
        pageSize: '25',
      })

      await stubBalances(subAccountReference)
      await prisonRegisterApi.stubGetPrisonNames()

      const response = await page.goto(`${url}?page=999`)

      expect(response?.status()).toBe(404)
      expect(page.locator('[data-testid="error-page-message"]')).toContainText('Page requested is out of range')
      expect(page.locator('[data-testid="error-page-status"]')).toContainText('404')
    })

    test(`${pageName} - Should handle 500 and render error`, async ({ page }) => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await stubBalances(subAccountReference)
      await prisonerFinanceApi.stubGetPrisonerTransactionsInternalServerError(prisonNumber)
      await prisonRegisterApi.stubGetPrisonNames()

      const response = await page.goto(url)

      expect(response?.status()).toBe(500)
      expect(page.locator('[data-testid="error-page-message"]')).toContainText('Internal Server Error')
      expect(page.locator('[data-testid="error-page-status"]')).toContainText('500')
    })

    test(`${pageName} - Should redirect to sign-out when prisoner is outside user caseload`, async ({ page }) => {
      await prisonerSearchApi.stubGetPrisonerOutsideCaseload(prisonNumber)
      await page.goto(url)
      await expect(page).toHaveURL(/.*\/sign-out/)
    })

    test(`${pageName} - Should not have any automatically detectable WCAG A or AA violations`, async ({ page }) => {
      await baseStubs(subAccountReference)
      await page.goto(url)
      await PrisonerMoneyPage.verifyOnPage(page)

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test(`${pageName} - Should display prisoner information header`, async ({ page }) => {
      await baseStubs(subAccountReference)
      await page.goto(url)
      const { prisonerInformationHeader } = await PrisonerMoneyPage.verifyOnPage(page)

      expect(prisonerInformationHeader).toBeVisible()
      expect(page.locator('[data-testid="prisonerName"]')).toContainText('Smith, John')
      expect(page.locator('[data-testid="prisonerNumber"]')).toContainText(prisonNumber)
      expect(page.locator('[data-testid="cell-location"]')).toContainText('RECP')
      expect(page.locator('[data-testid="category"]')).toContainText('C')
      expect(page.locator('[data-testid="csra"]')).toContainText('Standard')
      expect(page.locator('[data-testid="incentive-level"]')).toContainText('Enhanced')
    })

    test(`${pageName} - should display the prisoner information tab`, async ({ page }) => {
      await baseStubs(subAccountReference)
      await page.goto(url)
      await PrisonerMoneyPage.verifyOnPage(page)

      const profileTabs = page.locator('[data-testid="profile-tabs"]')
      const overviewTabLink = profileTabs.locator('li a').first()
      await expect(overviewTabLink).toHaveAttribute(
        'href',
        `https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/${prisonNumber}`,
      )
    })

    test(`${pageName} - should display no transactions`, async ({ page }) => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, emptyPageTransactionsResponse, {
        subAccountReference,
      })
      await stubBalances(subAccountReference)
      await prisonRegisterApi.stubGetPrisonNames()

      await page.goto(url)

      const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)
      expect(prisonerMoneyPage.tableTransactions).not.toBeVisible()

      const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
      expect(noTransactionsMessage).toBeVisible()
      expect(noTransactionsMessage).toHaveText('No transactions to show')
    })

    test(`${pageName} - should display the filter`, async ({ page }) => {
      await baseStubs(subAccountReference)
      await page.goto(url)
      await PrisonerMoneyPage.verifyOnPage(page)

      const filterComponent = page.locator('[data-module="moj-filter"]')
      const filterSelected = page.locator('[class="moj-filter__selected"]')
      const filterOptions = page.locator('[class="moj-filter__options"]')

      await expect(filterSelected).toBeVisible()
      await expect(filterComponent).toBeVisible()
      await expect(filterOptions).toBeVisible()
    })

    const casesValidFilters = [
      {
        caseName: 'just startDate',
        expectedUrl: `${url}?startDate=10%2F10%2F2010&endDate=#filterForm`,
        action: async (page: PrisonerMoneyPage) => {
          await page.startDateFilter.fill('10/10/2010')
          await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
            startDate: '2010-10-10',
            subAccountReference,
          })
        },
      },
      {
        caseName: 'both startDate and endDate',
        expectedUrl: `${url}?startDate=10%2F10%2F2010&endDate=10%2F10%2F2020#filterForm`,
        action: async (page: PrisonerMoneyPage) => {
          await page.startDateFilter.fill('10/10/2010')
          await page.endDateFilter.fill('10/10/2020')
          await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
            startDate: '2010-10-10',
            endDate: '2020-10-10',
            subAccountReference,
          })
        },
      },
      {
        caseName: 'just endDate',
        expectedUrl: `${url}?startDate=&endDate=10%2F10%2F2020#filterForm`,
        action: async (page: PrisonerMoneyPage) => {
          await page.endDateFilter.fill('10/10/2020')
          await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
            endDate: '2020-10-10',
            subAccountReference,
          })
        },
      },
      {
        caseName: 'just debit',
        debit: 'true',
        expectedUrl: `${url}?startDate=&endDate=&debit=true#filterForm`,
        action: async (page: PrisonerMoneyPage) => {
          await page.debitFilter.click()
          await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
            debit: 'true',
            subAccountReference,
          })
        },
      },
      {
        caseName: 'just credit',
        credit: 'true',
        expectedUrl: `${url}?startDate=&endDate=&credit=true#filterForm`,
        action: async (page: PrisonerMoneyPage) => {
          await page.creditFilter.click()
          await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
            credit: 'true',
            subAccountReference,
          })
        },
      },
      {
        caseName: 'both debit and credit',
        expectedUrl: `${url}?startDate=&endDate=&credit=true&debit=true#filterForm`,
        action: async (page: PrisonerMoneyPage) => {
          await page.creditFilter.click()
          await page.debitFilter.click()
          await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
            debit: 'true',
            credit: 'true',
            subAccountReference,
          })
        },
      },
    ]
    for (const { caseName, expectedUrl, action } of casesValidFilters) {
      test(`${pageName} - should filter by ${caseName}`, async ({ page }) => {
        await baseStubs(subAccountReference)
        await page.goto(url)
        const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)

        await expect(prisonerMoneyPage.startDateFilter).toBeVisible()
        await expect(prisonerMoneyPage.endDateFilter).toBeVisible()
        await expect(prisonerMoneyPage.creditFilter).toBeVisible()
        await expect(prisonerMoneyPage.debitFilter).toBeVisible()

        await action(prisonerMoneyPage)
        await prisonerMoneyPage.applyFilterButton.click()

        const endDateError = page.locator('[id="endDate-error"]')
        const startDateError = page.locator('[id="startDate-error"]')
        const creditError = page.locator('[id="credit-error"]')
        const debitError = page.locator('[id="debit-error"]')

        await expect(endDateError).not.toBeVisible()
        await expect(startDateError).not.toBeVisible()
        await expect(creditError).not.toBeVisible()
        await expect(debitError).not.toBeVisible()

        await expect(prisonerMoneyPage.startDateFilter).toBeVisible()
        await expect(prisonerMoneyPage.endDateFilter).toBeVisible()
        await expect(prisonerMoneyPage.creditFilter).toBeVisible()
        await expect(prisonerMoneyPage.debitFilter).toBeVisible()

        const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
        await expect(noTransactionsMessage).not.toBeVisible()

        await expect(page).toHaveURL(expectedUrl)
      })
    }

    const casesInvalidFilters = [
      {
        caseName: 'invalid startDate',
        startDateErrorMessage: 'Start date must be a real date, like 18/01/2026',
        startUrl: `${url}#filterForm`,
        expectedUrl: `${url}?startDate=XXXX&endDate=#filterForm`,
        action: async (page: PrisonerMoneyPage) => {
          await page.startDateFilter.fill('XXXX')
          await page.applyFilterButton.click()
        },
      },
      {
        caseName: 'invalid startDate and endDate',
        startDateErrorMessage: 'Start date must be a real date, like 18/01/2026',
        endDateErrorMessage: 'End date must be a real date, like 18/01/2026',
        startUrl: `${url}#filterForm`,
        expectedUrl: `${url}?startDate=XXXX&endDate=XXXX#filterForm`,
        action: async (page: PrisonerMoneyPage) => {
          await page.startDateFilter.fill('XXXX')
          await page.endDateFilter.fill('XXXX')
          await page.applyFilterButton.click()
        },
      },
      {
        caseName: 'invalid endDate',
        endDateErrorMessage: 'End date must be a real date, like 18/01/2026',
        startUrl: `${url}#filterForm`,
        expectedUrl: `${url}?startDate=&endDate=99%2F99%2F9999#filterForm`,
        action: async (page: PrisonerMoneyPage) => {
          await page.endDateFilter.fill('99/99/9999')
          await page.applyFilterButton.click()
        },
      },
      {
        caseName: 'endate earlier than startDate',
        endDateErrorMessage: 'End date cannot be earlier than start date',
        startUrl: `${url}#filterForm`,
        expectedUrl: `${url}?startDate=10%2F10%2F2020&endDate=10%2F10%2F2010#filterForm`,
        action: async (page: PrisonerMoneyPage) => {
          await page.startDateFilter.fill('10/10/2020')
          await page.endDateFilter.fill('10/10/2010')
          await page.applyFilterButton.click()
        },
      },
      {
        caseName: 'invalid debit',
        debitErrorMessage: 'Debit must be true or false\n',
        startUrl: `${url}?debit=xxxx#filterForm`,
        expectedUrl: `${url}?debit=xxxx#filterForm`,
        action: async (_page: PrisonerMoneyPage) => {},
      },
      {
        caseName: 'invalid credit',
        creditErrorMessage: 'Credit must be true or false\n',
        startUrl: `${url}?credit=xxxx#filterForm`,
        expectedUrl: `${url}?credit=xxxx#filterForm`,
        action: async (_page: PrisonerMoneyPage) => {},
      },
      {
        caseName: 'invalid debit and credit',
        debitErrorMessage: 'Debit must be true or false\n',
        creditErrorMessage: 'Credit must be true or false\n',
        startUrl: `${url}?credit=xxxx&debit=xxxx#filterForm`,
        expectedUrl: `${url}?credit=xxxx&debit=xxxx#filterForm`,
        action: async (_page: PrisonerMoneyPage) => {},
      },
    ]
    for (const {
      caseName,
      startDateErrorMessage,
      endDateErrorMessage,
      debitErrorMessage,
      creditErrorMessage,
      startUrl,
      expectedUrl,
      action,
    } of casesInvalidFilters) {
      test(`${pageName} - Should show validation errors on ${caseName}`, async ({ page }) => {
        await baseStubs(subAccountReference)

        await page.goto(startUrl)

        const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)

        await expect(prisonerMoneyPage.startDateFilter).toBeVisible()
        await expect(prisonerMoneyPage.endDateFilter).toBeVisible()
        await expect(prisonerMoneyPage.creditFilter).toBeVisible()
        await expect(prisonerMoneyPage.debitFilter).toBeVisible()

        await action(prisonerMoneyPage)

        const endDateError = page.locator('[id="endDate-error"]')
        const startDateError = page.locator('[id="startDate-error"]')
        const creditDebitError = page.locator('[id="creditDebit-error"]')

        const checkMessages = []
        for (const { errorMessage, errorComponent } of [
          { errorMessage: startDateErrorMessage, errorComponent: startDateError },
          { errorMessage: endDateErrorMessage, errorComponent: endDateError },
          { errorMessage: `${creditErrorMessage ?? ''}${debitErrorMessage ?? ''}`, errorComponent: creditDebitError },
        ]) {
          if (errorMessage) {
            checkMessages.push(expect(errorComponent).toContainText(errorMessage))
          } else {
            checkMessages.push(expect(errorComponent).not.toBeVisible())
          }
        }
        Promise.all(checkMessages)

        const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
        expect(noTransactionsMessage).toBeVisible()
        expect(noTransactionsMessage).toHaveText("Please fix the filter's errors to view transactions")

        expect(page).toHaveURL(expectedUrl)
      })
    }

    test(`${pageName} - Should be able to remove selected filters`, async ({ page }) => {
      await baseStubs(subAccountReference)
      await page.goto(url)
      await PrisonerMoneyPage.verifyOnPage(page)

      const startDateFilter = page.locator('input[id="startDate"]')
      const endDateFilter = page.locator('input[id="endDate"]')
      const applyFilterButton = page.locator('[data-test-id="submit-button"]')

      expect(startDateFilter).toBeVisible()
      expect(endDateFilter).toBeVisible()

      const startDateVal = '10/10/2010'
      const endDateVal = '10/12/2010'

      await startDateFilter.fill(startDateVal)
      await endDateFilter.fill(endDateVal)

      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
        startDate: '2010-10-10',
        endDate: '2010-12-10',
        subAccountReference,
      })

      await applyFilterButton.click()

      await expect(page).toHaveURL(
        `${url}?startDate=${encodeURIComponent(startDateVal)}&endDate=${encodeURIComponent(endDateVal)}#filterForm`,
      )

      await expect(startDateFilter).toBeVisible()
      await expect(endDateFilter).toBeVisible()

      const startDatefilterTag = page.getByRole('link', { name: 'Start date' })

      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
        endDate: '2010-12-10',
        subAccountReference,
      })

      await startDatefilterTag.click()
      await expect(page).toHaveURL(`${url}?endDate=${encodeURIComponent(endDateVal)}&page=1#filterForm`)
      expect(await endDateFilter.inputValue()).toBe(endDateVal)
      expect(await startDateFilter.textContent()).toHaveLength(0)
    })

    test(`${pageName} - Should clear all filters`, async ({ page }) => {
      await baseStubs(subAccountReference)
      await page.goto(url)
      const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)

      const applyFilterButton = page.locator('[data-test-id="submit-button"]')

      expect(prisonerMoneyPage.startDateFilter).toBeVisible()
      expect(prisonerMoneyPage.endDateFilter).toBeVisible()
      expect(prisonerMoneyPage.creditFilter).toBeVisible()
      expect(prisonerMoneyPage.debitFilter).toBeVisible()

      const startDateVal = '10/10/2010'
      const endDateVal = '10/12/2010'

      await prisonerMoneyPage.startDateFilter.fill(startDateVal)
      await prisonerMoneyPage.endDateFilter.fill(endDateVal)
      await prisonerMoneyPage.creditFilter.click()
      await prisonerMoneyPage.debitFilter.click()

      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
        startDate: '2010-10-10',
        endDate: '2010-12-10',
        credit: 'true',
        debit: 'true',
        subAccountReference,
      })

      await applyFilterButton.click()

      await expect(page).toHaveURL(
        `${url}?startDate=${encodeURIComponent(startDateVal)}&endDate=${encodeURIComponent(endDateVal)}&credit=true&debit=true#filterForm`,
      )

      const clearFilters = page.getByText('Clear Filters')

      await clearFilters.click()

      expect(page).toHaveURL(`${url}?#filterForm`)

      expect(await prisonerMoneyPage.startDateFilter.textContent()).toHaveLength(0)
      expect(await prisonerMoneyPage.endDateFilter.textContent()).toHaveLength(0)
      expect(prisonerMoneyPage.creditFilter).not.toBeChecked()
      expect(prisonerMoneyPage.debitFilter).not.toBeChecked()
    })

    test(`${pageName} - Should render pagination component and allow progression`, async ({ page }) => {
      await baseStubs(subAccountReference)

      const createPageTransactionResponse = (pageNumber: number): Page<PrisonerTransactionResponse> => {
        return {
          content: transactionPayload,
          totalElements: 500,
          totalPages: 20,
          pageNumber,
          pageSize: 25,
          isLastPage: pageNumber === 20,
        }
      }

      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(
        prisonNumber,
        createPageTransactionResponse(10),
        {
          startDate: '2026-04-09',
          endDate: '2026-04-12',
          pageNumber: '10',
          pageSize: '25',
          credit: 'true',
          debit: 'true',
          subAccountReference,
        },
      )

      const buildQueriesForPage = (pageNumber: number) =>
        `?startDate=${encodeURIComponent('09/04/2026')}&endDate=${encodeURIComponent('12/04/2026')}&page=${pageNumber}&credit=true&debit=true`

      await page.goto(`${url}/${buildQueriesForPage(10)}`)

      const { topPagination, bottomPagination } = await PrisonerMoneyPage.verifyOnPage(page)

      await expect(topPagination).toBeVisible()
      await expect(bottomPagination).toBeVisible()

      const topNavButton = topPagination.locator("[aria-label='Page 9']")
      await expect(topNavButton).toBeVisible()
      expect(await topNavButton.getAttribute('href')).toBe(buildQueriesForPage(9))

      await baseStubs(subAccountReference)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(
        prisonNumber,
        createPageTransactionResponse(9),
        {
          startDate: '2026-04-09',
          endDate: '2026-04-12',
          pageNumber: '9',
          pageSize: '25',
          credit: 'true',
          debit: 'true',
          subAccountReference,
        },
      )

      await topNavButton.click()

      expect(page.url()).toContain(buildQueriesForPage(9))

      const topResultText = topPagination.locator('.moj-pagination__results')
      await expect(topResultText).toBeVisible()

      expect(await topResultText.innerText()).toBe('Showing 201 to 225 of 500 total results')

      const bottomResultText = bottomPagination.locator('.moj-pagination__results')
      await expect(bottomResultText).toBeVisible()

      expect(await bottomResultText.innerText()).toBe('Showing 201 to 225 of 500 total results')

      const topCurrentPageLi = topPagination.locator('.govuk-pagination__item--current')
      const topCurrentPageA = topCurrentPageLi.locator('a')
      expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
      expect(await topCurrentPageA.innerText()).toBe('9')

      const bottomCurrentPageLi = bottomPagination.locator('.govuk-pagination__item--current')
      const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
      expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
      expect(await bottomCurrentPageA.innerText()).toBe('9')
    })

    test(`${pageName} - should allow progression with next button`, async ({ page }) => {
      await baseStubs(subAccountReference)

      const createPageTransactionResponse = (pageNumber: number): Page<PrisonerTransactionResponse> => {
        return {
          content: transactionPayload,
          totalElements: 500,
          totalPages: 20,
          pageNumber,
          pageSize: 25,
          isLastPage: pageNumber === 20,
        }
      }

      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(
        prisonNumber,
        createPageTransactionResponse(10),
        {
          startDate: '2026-04-09',
          endDate: '2026-04-12',
          pageNumber: '10',
          pageSize: '25',
          credit: 'true',
          debit: 'true',
          subAccountReference,
        },
      )

      const buildQueriesForPage = (pageNumber: number) =>
        `?startDate=${encodeURIComponent('09/04/2026')}&endDate=${encodeURIComponent('12/04/2026')}&page=${pageNumber}&credit=true&debit=true`

      await page.goto(`${url}/${buildQueriesForPage(10)}`)

      const { topPagination, bottomPagination } = await PrisonerMoneyPage.verifyOnPage(page)

      await expect(topPagination).toBeVisible()
      await expect(bottomPagination).toBeVisible()

      const nextNavButton = topPagination.locator("[rel='next']")
      await expect(nextNavButton).toBeVisible()
      expect(await nextNavButton.getAttribute('href')).toBe(buildQueriesForPage(11))

      await baseStubs(subAccountReference)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(
        prisonNumber,
        createPageTransactionResponse(11),
        {
          startDate: '2026-04-09',
          endDate: '2026-04-12',
          pageNumber: '11',
          pageSize: '25',
          credit: 'true',
          debit: 'true',
          subAccountReference,
        },
      )

      await nextNavButton.click()

      expect(page.url()).toContain(buildQueriesForPage(11))

      const topResultText = topPagination.locator('.moj-pagination__results')
      await expect(topResultText).toBeVisible()

      expect(await topResultText.innerText()).toBe('Showing 251 to 275 of 500 total results')

      const bottomResultText = bottomPagination.locator('.moj-pagination__results')
      await expect(bottomResultText).toBeVisible()

      expect(await bottomResultText.innerText()).toBe('Showing 251 to 275 of 500 total results')

      const topCurrentPageLi = topPagination.locator('.govuk-pagination__item--current')
      const topCurrentPageA = topCurrentPageLi.locator('a')
      expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
      expect(await topCurrentPageA.innerText()).toBe('11')

      const bottomCurrentPageLi = bottomPagination.locator('.govuk-pagination__item--current')
      const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
      expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
      expect(await bottomCurrentPageA.innerText()).toBe('11')
    })

    test(`${pageName} -should allow progression with previous button`, async ({ page }) => {
      await baseStubs(subAccountReference)

      const createPageTransactionResponse = (pageNumber: number): Page<PrisonerTransactionResponse> => {
        return {
          content: transactionPayload,
          totalElements: 500,
          totalPages: 20,
          pageNumber,
          pageSize: 25,
          isLastPage: pageNumber === 20,
        }
      }

      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(
        prisonNumber,
        createPageTransactionResponse(10),
        {
          startDate: '2026-04-09',
          endDate: '2026-04-12',
          pageNumber: '10',
          pageSize: '25',
          credit: 'true',
          debit: 'true',
          subAccountReference,
        },
      )

      const buildQueriesForPage = (pageNumber: number) =>
        `?startDate=${encodeURIComponent('09/04/2026')}&endDate=${encodeURIComponent('12/04/2026')}&page=${pageNumber}&credit=true&debit=true`

      await page.goto(`${url}/${buildQueriesForPage(10)}`)

      const { topPagination, bottomPagination } = await PrisonerMoneyPage.verifyOnPage(page)

      await expect(topPagination).toBeVisible()
      await expect(bottomPagination).toBeVisible()

      const prevNavButton = topPagination.locator("[rel='prev']")
      await expect(prevNavButton).toBeVisible()
      expect(await prevNavButton.getAttribute('href')).toBe(buildQueriesForPage(9))

      await baseStubs(subAccountReference)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(
        prisonNumber,
        createPageTransactionResponse(9),
        {
          startDate: '2026-04-09',
          endDate: '2026-04-12',
          pageNumber: '9',
          pageSize: '25',
          credit: 'true',
          debit: 'true',
          subAccountReference,
        },
      )

      await prevNavButton.click()

      expect(page.url()).toContain(buildQueriesForPage(9))

      const topResultText = topPagination.locator('.moj-pagination__results')
      await expect(topResultText).toBeVisible()

      expect(await topResultText.innerText()).toBe('Showing 201 to 225 of 500 total results')

      const bottomResultText = bottomPagination.locator('.moj-pagination__results')
      await expect(bottomResultText).toBeVisible()

      expect(await bottomResultText.innerText()).toBe('Showing 201 to 225 of 500 total results')

      const topCurrentPageLi = topPagination.locator('.govuk-pagination__item--current')
      const topCurrentPageA = topCurrentPageLi.locator('a')
      expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
      expect(await topCurrentPageA.innerText()).toBe('9')

      const bottomCurrentPageLi = bottomPagination.locator('.govuk-pagination__item--current')
      const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
      expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
      expect(await bottomCurrentPageA.innerText()).toBe('9')
    })
  }
})
