import { NextFunction, Request, Response } from 'express'
import { Services } from '../../../services'
import { AuditPage, SearchRequest, SubjectType } from '../../../services/auditService'
import buildPaginationItems from '../../../utils/mojPaginationHelper'
import { PrisonerSearchContent, PrisonerSearchResult } from '../../../interfaces/PrisonerSearchResponse'
import prisonerSearchFilterSchema, { formatSearchFilterValidationErrors } from '../../../validators/searchFilterSchema'

class FindPrisonerController {
  constructor(private readonly services: Services) {}

  public getFindPrisoner = async (req: Request, res: Response, next: NextFunction) => {
    const parsedQueries = prisonerSearchFilterSchema.safeParse(req.query)

    if (parsedQueries.data?.term) {
      await this.services.auditService.logSearchRequest(SearchRequest.FIND_PRISONER, {
        who: res.locals.user.username,
        correlationId: req.id,
        subjectType: SubjectType.SEARCH_TERM,
        subjectId: parsedQueries.data?.term,
      })
    } else {
      await this.services.auditService.logPageView(AuditPage.FIND_PRISONER, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
    }

    const token = req.user?.token as string
    const caseloads = await this.services.prisonApiService.getUserCaseloads(token)
    const currentCaseload = caseloads.find(caseload => caseload.currentlyActive)

    if (parsedQueries.error) {
      res.render('pages/prisoner/find/find', {
        currentCaseload: currentCaseload.description,
        ...formatSearchFilterValidationErrors(parsedQueries.error),
      })
      return
    }

    if (!parsedQueries.data.term) {
      res.render('pages/prisoner/find/find', {
        currentCaseload: currentCaseload.description,
      })
      return
    }

    const matchingPrisoners: PrisonerSearchResult = await this.services.prisonerSearchService.getPrisonersBySearchTerm(
      currentCaseload.caseLoadId,
      parsedQueries.data.term,
      (parsedQueries.data.page - 1).toString(), // page start from 0 in this API
    )

    const { content, ...paginationItems } = buildPaginationItems<
      PrisonerSearchContent,
      typeof prisonerSearchFilterSchema
    >({
      pageNumber: parsedQueries.data.page,
      totalPages: matchingPrisoners.totalPages,
      totalElements: matchingPrisoners.totalElements,
      content: matchingPrisoners.content,
      isLastPage: matchingPrisoners.pageable.pageNumber === matchingPrisoners.totalPages - 1,
      pageSize: matchingPrisoners.pageable.pageSize,
      filters: parsedQueries.data,
    })

    res.render('pages/prisoner/find/find', {
      currentCaseload: currentCaseload.description,
      matchingPrisoners: matchingPrisoners.content,
      term: parsedQueries.data.term,
      paginationItems,
    })
  }
}

export default FindPrisonerController
