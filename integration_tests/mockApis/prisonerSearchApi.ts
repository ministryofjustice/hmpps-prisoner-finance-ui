import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { RestPage, PrisonerSearchResponse } from '../../server/interfaces/PrisonerNumberSearchResponse'

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

  stubGetPrisonerOutOfPrison: (prisonNumber: string): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner-search-api/prisoner/${prisonNumber}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          additionalDaysAwarded: 5,
          addresses: [],
          alerts: [
            { alertType: 'M', alertCode: 'PEEP', active: true, expired: false },
            { alertType: 'R', alertCode: 'RCON', active: true, expired: false },
            { alertType: 'X', alertCode: 'XR', active: true, expired: false },
          ],
          aliases: [],
          allConvictedOffences: [
            {
              statuteCode: 'DD91',
              offenceCode: 'DD91011',
              offenceDescription: 'Abandon a fighting dog',
              offenceDate: '2022-01-01',
              latestBooking: true,
              sentenceStartDate: '2024-02-21',
              primarySentence: true,
            },
            {
              statuteCode: 'ES79',
              offenceCode: 'ES79009',
              offenceDescription: 'Accept clients money without insurance cover',
              offenceDate: '2024-01-01',
              latestBooking: false,
              sentenceStartDate: '2024-02-21',
              primarySentence: true,
            },
          ],
          automaticReleaseDate: '2024-07-26',
          bookNumber: '49820A',
          bookingId: '1212957',
          convictedStatus: 'Convicted',
          croNumber: '279382/09J',
          currentIncentive: {
            level: { code: 'STD', description: 'Standard' },
            dateTime: '2024-02-21T13:42:22',
            nextReviewDate: '2024-05-21',
          },
          dateOfBirth: '1990-02-21',
          emailAddresses: [],
          firstName: 'CAPTAIN',
          gender: 'Male',
          homeDetentionCurfewEligibilityDate: '2024-05-12',
          identifiers: [
            {
              type: 'MERGED',
              value: 'A9683DZ',
              createdDateTime: '2024-02-21T14:04:03',
            },
            {
              type: 'CRO',
              value: '279382/09J',
              createdDateTime: '2026-06-10T14:43:10',
            },
          ],
          imprisonmentStatus: 'SENT03',
          imprisonmentStatusDescription: 'Adult Imprisonment Without Option CJA03',
          inOutStatus: 'OUT',
          indeterminateSentence: false,
          languages: [
            {
              type: 'SEC',
              code: 'ALB',
              readSkill: 'N',
              writeSkill: 'N',
              speakSkill: 'Y',
              interpreterRequested: false,
            },
            {
              type: 'SEC',
              code: 'BEN',
              readSkill: 'N',
              writeSkill: 'Y',
              speakSkill: 'N',
              interpreterRequested: false,
            },
            {
              type: 'SEC',
              code: 'CZE-CES',
              readSkill: 'N',
              writeSkill: 'N',
              speakSkill: 'N',
              interpreterRequested: false,
            },
            {
              type: 'PREF_WRITE',
              code: 'ENG',
              readSkill: 'N',
              writeSkill: 'N',
              speakSkill: 'N',
              interpreterRequested: false,
            },
            {
              type: 'SEC',
              code: 'SCR-HRV',
              readSkill: 'Y',
              writeSkill: 'Y',
              speakSkill: 'Y',
              interpreterRequested: false,
            },
            {
              type: 'PREF_SPEAK',
              code: 'WEL-CYM',
              readSkill: 'N',
              writeSkill: 'N',
              speakSkill: 'N',
              interpreterRequested: true,
            },
            {
              type: 'SEC',
              code: 'WEL-CYM',
              readSkill: 'Y',
              writeSkill: 'Y',
              speakSkill: 'N',
              interpreterRequested: false,
            },
          ],
          lastAdmissionDate: '2024-02-21',
          lastMovementDate: '2026-08-03',
          lastMovementReasonCode: 'ESCP',
          lastMovementTypeCode: 'REL',
          lastName: 'AMERICA',
          lastPrisonId: 'LEI',
          legalStatus: 'SENTENCED',
          locationDescription: 'Outside - released from Leeds (HMP)',
          militaryRecord: false,
          mostSeriousOffence: 'Abandon a fighting dog',
          nationality: 'Stateless',
          nonDtoReleaseDate: '2024-07-26',
          nonDtoReleaseDateType: 'ARD',
          personalCareNeeds: [],
          phoneNumbers: [],
          prisonId: 'OUT',
          prisonName: 'Outside',
          prisonerNumber: prisonNumber,
          recall: false,
          receptionDate: '2024-02-21',
          releaseDate: '2024-07-26',
          religion: 'Christian - Anglican (incl. CofE & CinW)',
          restrictedPatient: false,
          sentenceExpiryDate: '2024-12-20',
          sentenceStartDate: '2024-02-21',
          status: 'INACTIVE OUT',
          youthOffender: false,
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
