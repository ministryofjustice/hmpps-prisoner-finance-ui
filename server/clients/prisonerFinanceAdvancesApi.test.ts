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

  describe('getHoldBalance', () => {
    it('should call the API', async () => {
      const expectedResponse: PrisonerAdvanceBalanceResponse = {
        amount: 100,
        weeklyAmount: 1,
        outstandingAmount: 90,
        balanceDateTime: '',
      }

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getAdvanceBalance('A123BCD')

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/advances/A123BCD/balance`,
        },
        asSystem(),
      )
    })
  })

  describe('getAdvances', () => {
    it('should call the API', async () => {
      const advance: PrisonerAdvanceResponse = {
        id: '1',
        prisonNumber: 'A123ABC',
        legacyAdvanceNumber: 1,
        createdAt: '',
        createdBy: 'TEST',
        date: '',
        advanceAmount: 10,
        paymentAmount: 1,
        startPayments: '',
        reference: '',
        advanceLocation: 'LEI',
        status: 'Active',
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

  describe('getAdvance', () => {
    it('should call the API', async () => {
      const advance: PrisonerAdvanceResponse = {
        id: '1',
        prisonNumber: 'A123BCD',
        legacyAdvanceNumber: 1,
        createdAt: '',
        createdBy: 'TEST',
        date: '',
        advanceAmount: 10,
        paymentAmount: 1,
        startPayments: '',
        reference: '',
        advanceLocation: 'LEI',
        status: 'Active',
      }

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(advance)

      const response = await client.getAdvance('A123BCD', '1')

      expect(response).toEqual(advance)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/advances/A123BCD/1`,
        },
        asSystem(),
      )
    })
  })

  describe('getAdvancePayments', () => {
    it('should call the API', async () => {
      const advancePayment: PrisonerAdvancePaymentsResponse = {
        id: '1',
        prisonNumber: 'A123BCD',
        legacyAdvanceNumber: 1,
        createdAt: '',
        createdBy: 'TEST',
        date: '',
        paymentAmount: 10,
        advanceLocation: 'LEI',
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

      const response = await client.getAdvancePayments('A123BCD', '1', '1')

      expect(response).toEqual(pagedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/advances/A123BCD/1/payments`,
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
