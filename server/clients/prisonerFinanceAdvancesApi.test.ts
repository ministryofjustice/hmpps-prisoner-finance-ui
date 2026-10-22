import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem } from '@ministryofjustice/hmpps-rest-client'
import { Page } from '../interfaces/Pageable'
import PrisonerFinanceAdvancesApiClient from './prisonerFinanceAdvancesApi'
import { PrisonerAdvanceBalanceResponse } from '../interfaces/PrisonerAdvanceBalanceResponse'
import { PrisonerAdvanceResponse } from '../interfaces/PrisonerAdvanceResponse'
import { PrisonerAdvancePaymentsResponse } from '../interfaces/PrisonerAdvancePaymentsResponse'

describe('Prison Finance Advances Api', () => {
  let client: PrisonerFinanceAdvancesApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationClient>

    client = new PrisonerFinanceAdvancesApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getAdvancesBalance', () => {
    it('should call the API', async () => {
      const expectedResponse: PrisonerAdvanceBalanceResponse = {
        advanceAmount: 100,
        weeklyPaymentAmount: 1,
        balanceOutstanding: 90,
        balanceDateTime: '',
        remainingPayments: 4,
        nextPaymentDate: '',
      }

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getAdvancesBalance('A123BCD')

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/advances/account/A123BCD/balance`,
        },
        asSystem(),
      )
    })
  })

  describe('getAdvanceBalance', () => {
    it('should call the API', async () => {
      const expectedResponse: PrisonerAdvanceBalanceResponse = {
        advanceAmount: 100,
        weeklyPaymentAmount: 1,
        balanceOutstanding: 90,
        balanceDateTime: '',
        remainingPayments: 4,
        nextPaymentDate: '',
      }

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getAdvanceBalance('123')

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/advances/123/balance`,
        },
        asSystem(),
      )
    })
  })

  describe('getAdvances', () => {
    it('should call the API', async () => {
      const advance: PrisonerAdvanceResponse = {
        id: '',
        legacyPaymentProfileId: 123,
        legacyInformationNumber: '12343',
        prisonNumber: 'A123BX',
        prisonID: 'LEI',
        amount: 10,
        createdOn: '',
        repaymentStartDate: '',
        repaymentAmount: 10,
        reference: '',
        comment: '',
        createdBy: 'TEST',
        status: 'ACTIVE',
        updatedAt: '',
        generalLedgerUUID: '',
      }

      const pagedResponse: Page<PrisonerAdvanceResponse> = {
        content: [advance],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 25,
        isLastPage: true,
      }

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(pagedResponse)

      const response = await client.getAdvances('A123BCD', '1')

      expect(response).toEqual(pagedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/advances/A123BCD`,
          query: {
            pageNumber: '1',
            pageSize: '25',
          },
        },
        asSystem(),
      )
    })
  })

  describe('getAdvancePayments', () => {
    it('should call the API', async () => {
      const advancePayment: PrisonerAdvancePaymentsResponse = {
        id: '1',
        advanceId: '',
        transactionId: '',
        createdAt: '',
        createdBy: 'TEST',
        amount: 10,
        location: 'LEI',
      }

      const pagedResponse: Page<PrisonerAdvancePaymentsResponse> = {
        content: [advancePayment],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 25,
        isLastPage: true,
      }

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(pagedResponse)

      const response = await client.getAdvancePayments('123', '1')

      expect(response).toEqual(pagedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/advances/123/repayments`,
          query: {
            pageNumber: '1',
            pageSize: '25',
          },
        },
        asSystem(),
      )
    })
  })
})
