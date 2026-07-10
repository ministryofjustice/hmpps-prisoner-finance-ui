import { Page, BrowserContext } from '@playwright/test'
import signature from 'cookie-signature'
import tokenVerification from './mockApis/tokenVerification'
import hmppsAuth, { type UserToken } from './mockApis/hmppsAuth'
import { resetStubs } from './mockApis/wiremock'
import prisonApi from './mockApis/prisonApi'
import componentsApi from './mockApis/componentsApi'
import config from '../server/config'
import { createRedisClient, RedisClient } from '../server/data/redisClient'

export { resetStubs }

const DEFAULT_ROLES = ['ROLE_SOME_REQUIRED_ROLE']

export const attemptHmppsAuthLogin = async (page: Page) => {
  await page.goto('/')
  page.locator('h1', { hasText: 'Sign in' })
  const url = await hmppsAuth.getSignInUrl()
  await page.goto(url)
}

export const login = async (
  page: Page,
  { name, roles = DEFAULT_ROLES, active = true, authSource = 'nomis' }: UserToken & { active?: boolean } = {},
) => {
  await Promise.all([
    hmppsAuth.favicon(),
    hmppsAuth.stubSignInPage(),
    hmppsAuth.stubSignOutPage(),
    hmppsAuth.token({ name, roles, authSource }),
    tokenVerification.stubVerifyToken(active),
    prisonApi.stubGetUserCaseloads(),
    componentsApi.stubComponents(),
  ])
  await attemptHmppsAuthLogin(page)
}

export const unsignCookie = (cookieValue: string): string | false => {
  const decodedValue = decodeURIComponent(cookieValue)
  const cookieWithoutPrefix = decodedValue.slice(2)
  return signature.unsign(cookieWithoutPrefix, config.session.secret)
}

let redisClient: RedisClient
const getRedisClient = async (): Promise<RedisClient> => {
  if (!redisClient) {
    redisClient = createRedisClient()
    await redisClient.connect()
  }

  return redisClient
}

export const getSessionData = async (context: BrowserContext): Promise<Record<string, unknown>> => {
  const cookies = await context.cookies()
  const unsignedCookie = unsignCookie(cookies[0].value)
  const client = await getRedisClient()
  const sessionData = await client.get(unsignedCookie as string)
  return JSON.parse(sessionData as string)
}

export const setSessionData = async (context: BrowserContext, data: Record<string, unknown>): Promise<void> => {
  const cookies = await context.cookies()
  const unsignedCookie = unsignCookie(cookies[0].value)
  const client = await getRedisClient()
  await client.set(unsignedCookie as string, JSON.stringify(data))
}
