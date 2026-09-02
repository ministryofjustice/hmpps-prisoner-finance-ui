import PrisonerFinanceHoldsApiClient from '../clients/prisonerFinanceHoldsApi'
import { PrisonerHoldsBalanceResponse } from '../interfaces/PrisonerHoldsBalanceResponse'
import PrisonerFinanceHoldsService from './prisonerFinanceHoldsService'

jest.mock('../clients/prisonerFinanceHoldsApi')

describe('PrisonerFinanceHoldsService', () => {
  const apiClient = new PrisonerFinanceHoldsApiClient(null) as jest.Mocked<PrisonerFinanceHoldsApiClient>
  let service: PrisonerFinanceHoldsService

  beforeEach(() => {
    service = new PrisonerFinanceHoldsService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getHoldsBalance', () => {
    it('should call the API client', async () => {
      const prisonNumber = 'A123BCD'

      const expectedResponse: PrisonerHoldsBalanceResponse = {
        amount: 100,
        balanceDateTime: '',
      }

      apiClient.getHoldsBalance.mockResolvedValue(expectedResponse)

      await service.getHoldsBalance(prisonNumber)

      expect(apiClient.getHoldsBalance).toHaveBeenCalledWith(prisonNumber)
    })
  })
})
