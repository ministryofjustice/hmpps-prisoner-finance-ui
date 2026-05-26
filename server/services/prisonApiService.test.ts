import PrisonApiClient from '../clients/prisonApiClient'
import ActiveCaseloadResponse from '../interfaces/ActiveCaseloadResponse'
import PrisonApiService from './prisonApiService'

jest.mock('../clients/prisonApiClient')

describe('prisonApiService', () => {
  const apiClient = new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>
  let service: PrisonApiService

  beforeEach(() => {
    service = new PrisonApiService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should call getUserCaseloads', async () => {
    const mockResponse: ActiveCaseloadResponse[] = [
      {
        caseLoadId: 'MDI',
        description: 'Moorland Closed (HMP & YOI)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: false,
      },
    ]
    apiClient.getCaseloadsForCurrentUser.mockResolvedValue(mockResponse)

    const token = 'XXXXX'
    const result = await service.getUserCaseloads(token)

    expect(apiClient.getCaseloadsForCurrentUser).toHaveBeenCalledWith(token)
    expect(result).toEqual(mockResponse)
  })
})
