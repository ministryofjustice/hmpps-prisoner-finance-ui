import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem } from '@ministryofjustice/hmpps-rest-client'
import { PrisonerHoldsBalanceResponse } from '../interfaces/PrisonerHoldsBalanceResponse'
import PrisonerFinanceHoldsApiClient from './prisonerFinanceHoldsApi'
import { PrisonerHoldResponse } from '../interfaces/PrisonerHoldResponse'
import { Page } from '../interfaces/Pageable'

describe('Prison Finance Holds Api', () => {
  let client: PrisonerFinanceHoldsApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationClient>

    client = new PrisonerFinanceHoldsApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getHoldBalance', () => {
    it('should call the API', async () => {
      const expectedResponse: PrisonerHoldsBalanceResponse = {
        amount: 100,
        balanceDateTime: '',
      }

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getHoldsBalance('A123BCD')

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/holds/A123BCD/balance`,
        },
        asSystem(),
      )
    })
  })

  describe('getHolds', () => {
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

      const response = await client.getHolds('A123BCD', '1')

      expect(response).toEqual(pagedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/holds/A123BCD`,
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
