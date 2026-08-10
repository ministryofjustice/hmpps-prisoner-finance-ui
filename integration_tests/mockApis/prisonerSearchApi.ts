import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { RestPage, PrisonerSearchResponse } from '../../server/interfaces/PrisonerNumberSearchResponse'
import { PrisonerSearchContent } from '../../server/interfaces/PrisonerSearchResponse'

export default {
  stubPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisoner-search-api/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),

  stubGetPrisoner: (prisonNumber: string): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner-search-api/prisoner/${prisonNumber}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          prisonerNumber: prisonNumber,
          firstName: 'JOHN',
          lastName: 'SMITH',
          dateOfBirth: '1990-01-01',
          prisonId: 'MDI',
          prisonName: 'Moorland (HMP & YOI)',
          status: 'ACTIVE IN',
          cellLocation: 'RECP',
          category: 'C',
          csra: 'Standard',
          currentIncentive: {
            level: {
              code: 'STD',
              description: 'Enhanced',
            },
          },
        },
      },
    })
  },

  stubGetPrisonerNotFound: (prisonNumber: string): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner-search-api/prisoner/${prisonNumber}`,
      },
      response: {
        status: 404,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: 404,
          userMessage: 'Prisoner not found',
          developerMessage: 'Prisoner not found',
        },
      },
    })
  },

  stubGetPrisonerOutsideCaseload: (prisonNumber: string): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner-search-api/prisoner/${prisonNumber}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          prisonerNumber: prisonNumber,
          firstName: 'BOB',
          lastName: 'TAYLOR',
          prisonId: 'ALCATRAZ',
          status: 'ACTIVE IN',
          cellLocation: 'RECP',
        },
      },
    })
  },

  stubPrisonerSearchReturnsNoResults: (searchTerm: string, prisonId: string) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner-search-api/prison/${prisonId}/prisoners`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          totalElements: 0,
          totalPages: 0,
          size: 0,
          content: [],
          number: 0,
          first: true,
          last: true,
          sort: {
            empty: true,
            sorted: true,
            unsorted: true,
          },
          numberOfElements: 0,
          pageable: {
            offset: 0,
            sort: {
              empty: true,
              sorted: true,
              unsorted: true,
            },
            pageSize: 0,
            paged: true,
            pageNumber: 0,
            unpaged: true,
          },
          empty: true,
        },
      },
    })
  },

  stubPrisonerSearchReturnsResults: ({
    searchTerm,
    prisonId,
    results,
    pageSize = 25,
    pageNumber = 0,
    totalPages = 1,
  }: {
    searchTerm: string
    prisonId: string
    results: PrisonerSearchContent[]
    pageSize: number
    pageNumber: number
    totalPages: number
  }) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner-search-api/prison/${prisonId}/prisoners`,
        queryParameters: {
          page: {
            equalTo: pageNumber.toString(),
          },
          term: {
            equalTo: searchTerm,
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          totalElements: results.length * totalPages,
          totalPages,
          size: results.length,
          content: results,
          number: pageNumber,
          first: pageNumber === 0,
          last: false,
          sort: {
            empty: true,
            sorted: true,
            unsorted: true,
          },
          numberOfElements: results.length * totalPages,
          pageable: {
            offset: 0,
            sort: {
              empty: true,
              sorted: true,
              unsorted: true,
            },
            pageSize,
            paged: true,
            pageNumber,
            unpaged: false,
          },
          empty: false,
        },
      },
    })
  },

  stubGetPrisonersIdsByPrisonId: (prisonId: string, prisonNumbers: string[]): SuperAgentRequest => {
    const prisonersSearchResponse: PrisonerSearchResponse[] = prisonNumbers.map(pn => ({
      prisonerNumber: pn,
      alerts: [],
    }))
    const prisonerNumbersPage: RestPage<PrisonerSearchResponse> = {
      content: prisonersSearchResponse,
      totalElements: prisonNumbers.length,
      totalPages: 1,
      size: 1,
      number: 0,
    }

    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner-search-api/prisoner-search/prison/${prisonId}`,
        queryParameters: {
          size: {
            equalTo: '5000',
          },
          responseFields: {
            equalTo: 'prisonerNumber',
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisonerNumbersPage,
      },
    })
  },
}
