import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem } from '@ministryofjustice/hmpps-rest-client'
import { PrisonerHoldResponse } from '../interfaces/PrisonerHoldResponse'
import { Page } from '../interfaces/Pageable'
import PrisonerFinanceAdvancesApiClient from './prisonerFinanceAdvancesApi'
import { PrisonerAdvanceBalanceResponse } from '../interfaces/PrisonerAdvanceBalanceResponse'

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
      const hold: PrisonerHoldResponse = {
        id: '',
        prisonNumber: 'A1234CD',
        legacyHoldNumber: 1,
        subAccountRef: 'CASH',
        createdAt: '',
        createdBy: 'TEST',
        holdFromDate: '',
        holdUntilDate: '',
        isReleased: false,
        description: 'TEST',
        holdType: 'HOA',
        amount: 1000,
        holdLocation: 'LEI',
      }

      const pagedResponse: Page<PrisonerHoldResponse> = {
        content: [hold],
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
})
