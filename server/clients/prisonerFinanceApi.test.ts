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
          query: { pageNumber: 1, pageSize: 999 },
        },
        {
          tokenType: 'SYSTEM_TOKEN',
          user: {},
        },
      )
    })

    test.each([
      { case: 'All params are undefined' },
      { case: 'Just startDate is defined', startDate: '10/10/2010', startDateIso: '2010-10-10' },
      {
        case: 'Both startDate and endDate are defined',
        startDate: '10/10/2010',
        startDateIso: '2010-10-10',
        endDate: '10/10/2020',
        endDateIso: '2020-10-10',
      },
      { case: 'Just endDate is defined', endDate: '10/10/2020', endDateIso: '2020-10-10' },
      { case: 'Just debit is defined', debit: 'true' },
      { case: 'Just credit is defined', credit: 'true' },
      { case: 'Both debit and credit are defined', debit: 'true', credit: 'true' },
    ])('Should  call the api when $case', async ({ startDate, startDateIso, endDate, endDateIso, debit, credit }) => {
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

      const response = await client.getPrisonerTransactionsByPrisonNumber(
        prisonNumber,
        startDate,
        endDate,
        debit,
        credit,
      )

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/prisoners/${prisonNumber}/money/transactions`,
          query: {
            startDate: startDateIso,
            endDate: endDateIso,
            debit,
            credit,
            pageNumber: 1,
            pageSize: 999,
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
