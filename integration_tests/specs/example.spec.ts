import { expect, test } from '@playwright/test'
import { login, resetStubs } from '../testUtils'
import ExamplePage from '../pages/examplePage'

test.describe('Example', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Time is visible on page', async ({ page }) => {
    await login(page)

    const examplePage = await ExamplePage.verifyOnPage(page)

    await expect(examplePage.timestamp).toHaveText(/The time is currently 202\d-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})
