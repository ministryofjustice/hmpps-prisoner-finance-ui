import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import PrisonerFinanceApiClient from './prisonerFinanceApi'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../interfaces/AccountBalanceResponse'
import { SubAccountBalanceResponse } from '../interfaces/SubAccountBalanceResponse'

describe('PrisonerFinanceSyncApiClient', () => {
  let client: PrisonerFinanceApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationClient>

    client = new PrisonerFinanceApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getTransactionByPrisonNumber', () => {
    it('should call the API with the correct prisonNumber', async () => {
      const prisonNumber = 'ABC123AC'
      const expectedResponse: Array<PrisonerTransactionResponse> = [
        {
          date: '2026-03-10T10:43:28.094Z',
          description: 'test',
          credit: 0,
          debit: 0,
          location: 'LEI',
          accountType: 'PRISONER',
        },
      ]

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getPrisonerTransactionsByPrisonNumber(prisonNumber)

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/prisoners/${prisonNumber}/money/transactions`,
          query: { pageNumber: '1', pageSize: '25' },
        },
        {
          tokenType: 'SYSTEM_TOKEN',
          user: {},
        },
      )
    })

    it('should call the API with startDate and endDate', async () => {
      const prisonNumber = 'ABC123AC'
      const expectedResponse: Array<PrisonerTransactionResponse> = [
        {
          date: '2026-03-10T10:43:28.094Z',
          description: 'test',
          credit: 0,
          debit: 0,
          location: 'LEI',
          accountType: 'PRISONER',
        },
      ]

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getPrisonerTransactionsByPrisonNumber(prisonNumber, '10/10/2010', '10/12/2010')

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/prisoners/${prisonNumber}/money/transactions`,
          query: {
            startDate: '2010-10-10',
            endDate: '2010-12-10',
            pageNumber: '1',
            pageSize: '25',
          },
        },
        {
          tokenType: 'SYSTEM_TOKEN',
          user: {},
        },
      )
    })

    it('should call the API with startDate only', async () => {
      const prisonNumber = 'ABC123AC'
      const expectedResponse: Array<PrisonerTransactionResponse> = [
        {
          date: '2026-03-10T10:43:28.094Z',
          description: 'test',
          credit: 0,
          debit: 0,
          location: 'LEI',
          accountType: 'PRISONER',
        },
      ]

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getPrisonerTransactionsByPrisonNumber(prisonNumber, '10/10/2010')

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/prisoners/${prisonNumber}/money/transactions`,
          query: {
            startDate: '2010-10-10',
            pageNumber: '1',
            pageSize: '25',
          },
        },
        {
          tokenType: 'SYSTEM_TOKEN',
          user: {},
        },
      )
    })

    it('should call the API with endDate only', async () => {
      const prisonNumber = 'ABC123AC'
      const expectedResponse: Array<PrisonerTransactionResponse> = [
        {
          date: '2026-03-10T10:43:28.094Z',
          description: 'test',
          credit: 0,
          debit: 0,
          location: 'LEI',
          accountType: 'PRISONER',
        },
      ]

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getPrisonerTransactionsByPrisonNumber(prisonNumber, null, '10/10/2010')

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/prisoners/${prisonNumber}/money/transactions`,
          query: {
            endDate: '2010-10-10',
            pageNumber: '1',
            pageSize: '25',
          },
        },
        {
          tokenType: 'SYSTEM_TOKEN',
          user: {},
        },
      )
    })
  })

  describe('getAccountBalanceByPrisonNumber', () => {
    test('Should call the api with the correct prisonNumber', async () => {
      const prisonNumber = 'ABC123AC'
      const expectedResponse: AccountBalanceResponse = {
        accountId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        balanceDateTime: '2026-03-13T11:03:03.083Z',
        amount: 0,
      }

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getAccountBalance(prisonNumber)

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/prisoners/${prisonNumber}/money/balance`,
        },
        {
          tokenType: 'SYSTEM_TOKEN',
          user: {},
        },
      )
    })
  })

  describe('getSubAccountBalanceByPrisonNumberAndSubAccountRef', () => {
    test('Should call the api with the correct prisonNumber', async () => {
      const prisonNumber = 'ABC123AC'
      const subAccountRef = 'CASH'
      const expectedResponse: SubAccountBalanceResponse = {
        subAccountId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        balanceDateTime: '2026-03-13T11:03:03.083Z',
        amount: 0,
      }

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getSubAccountBalance(prisonNumber, subAccountRef)

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/prisoners/${prisonNumber}/money/balance/${subAccountRef}`,
        },
        {
          tokenType: 'SYSTEM_TOKEN',
          user: {},
        },
      )
    })
  })
})
