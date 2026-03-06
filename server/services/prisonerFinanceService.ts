// export default class AuditHistoryService {
//   constructor(private readonly prisonerFinanceSyncApiClient: PrisonerFinanceSyncApiClient) {}


//   async getMatchingPayloads(searchParams: AuditHistorySearchParams): Promise<CursorPage<NomisSyncPayloadSummary>> {
//     const { startDate, endDate } = searchParams

//     return this.prisonerFinanceSyncApiClient.getPayloadSummary({
//       ...searchParams,
//       startDate: startDate ? parseDatePickerStringToIsoString(startDate) : null,
//       endDate: endDate ? parseDatePickerStringToIsoString(endDate) : null,
//     })
//   }
// }