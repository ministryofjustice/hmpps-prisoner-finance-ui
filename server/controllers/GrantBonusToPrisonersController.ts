import { NextFunction, Response, Request } from 'express'
import { SessionData } from 'express-session'
import z from 'zod'
import { Services } from '../services'
import { AuditPage, SubjectType } from '../services/auditService'
import { mapItemsForRadioButtons } from '../utils/utils'
import GrantBonusToPrisonersService from '../services/GrantBonusToPrisonersService'
import creditAmountValidator from '../validators/creditAmountValidator'
import descriptionFieldValidator from '../validators/descriptionFieldValidator'

export default class GrantBonusToPrisonersController {
  constructor(private readonly services: Services) {}

  private getUserCaseloadsOrThrow = async (req: Request) => {
    const { user } = req
    if (!user) throw Error('Unexpected user data missing from Request')
    const { token } = user

    const caseloads = await this.services.prisonApiService.getUserCaseloads(token)

    GrantBonusToPrisonersService.createGrantBonusFormIfRequired(req.session as SessionData)

    return caseloads
  }

  public getGrantBonusToPrisonersSelectCaseload = async (req: Request, res: Response, next: NextFunction) => {
    await this.services.auditService.logPageView(AuditPage.GRANT_BONUS_WIZARD_SELECT_CASELOAD, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    try {
      const caseloads = await this.getUserCaseloadsOrThrow(req)

      res.render('pages/grantBonusToPrisoners/grantBonusToPrisoners/grantBonusToPrisoners.njk', {
        caseloadSelected: req.session.grantBonusForm.caseloadId,
        caseloads: mapItemsForRadioButtons({
          input: caseloads,
          valueKey: 'caseLoadId',
          textKey: 'description',
          dataTestId: 'caseload-radio',
        }),
      })
    } catch (e) {
      next(e)
    }
  }

  public postGrantBonusToPrisonersSelectCaseload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.caseloadId) {
        GrantBonusToPrisonersService.updateGrantBonusForm(req.session as SessionData, {
          caseloadId: req.body.caseloadId,
        })
        res.redirect('./grant-bonus-to-prisoners/amount')
      } else {
        const caseloads = await this.getUserCaseloadsOrThrow(req)

        res.render('pages/grantBonusToPrisoners/grantBonusToPrisoners/grantBonusToPrisoners.njk', {
          caseloadSelected: req.session.grantBonusForm?.caseloadId,
          caseloads: mapItemsForRadioButtons({
            input: caseloads,
            valueKey: 'caseLoadId',
            textKey: 'description',
            dataTestId: 'caseload-radio',
          }),
          errorMap: {
            errorText: 'You must select a caseload before continuing.',
          },
        })
      }
    } catch (e) {
      next(e)
    }
  }

  public getGrantBonusToPrisonersSelectAmount = async (req: Request, res: Response, next: NextFunction) => {
    await this.services.auditService.logPageView(AuditPage.GRANT_BONUS_WIZARD_SELECT_AMOUNT, {
      who: res.locals.user.username,
      correlationId: req.id,
      subjectType: SubjectType.PRISON,
      subjectId: req.session?.grantBonusForm?.caseloadId,
    })

    res.render('pages/grantBonusToPrisoners/amount/amount.njk')
  }

  public postGrantBonusToPrisonersSelectAmount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { body } = req
      const amountFormSchema = z.object({
        amount: creditAmountValidator,
        description: descriptionFieldValidator,
      })

      const result = amountFormSchema.safeParse(body)

      if (result.success) {
        const { token } = req.user
        const prisonNumbersSearchResponse = await this.services.prisonerSearchService.getPrisonerNumbersByPrisonId(
          token,
          req.session.grantBonusForm.caseloadId,
        )
        const prisonNumbers = prisonNumbersSearchResponse.content.map(pn => pn.prisonerNumber)

        GrantBonusToPrisonersService.updateGrantBonusForm(req.session as SessionData, {
          amountPerPrisoner: Number(result.data.amount),
          prisonNumbers,
          description: result.data.description,
        })

        const { grantBonusForm } = req.session
        const batchTransactionRequest = GrantBonusToPrisonersService.buildGrantBonusRequest(grantBonusForm)
        const createdTransactionResponse =
          await this.services.prisonerFinanceService.postBatchTransaction(batchTransactionRequest)

        res.redirect(`./confirmation?transactionNumber=${createdTransactionResponse.id}`)
      } else {
        const allErrors = z.flattenError(result.error).fieldErrors
        const templateErrors = Object.fromEntries(
          Object.entries(allErrors).map(([field, errors]) => [field, errors?.[0]]),
        )

        res.render('pages/grantBonusToPrisoners/amount/amount.njk', {
          errorMap: {
            amount: templateErrors.amount || null,
            description: templateErrors.description || null,
          },
          amount: req.body.amount,
          description: req.body.description,
        })
      }
    } catch (e) {
      next(e)
    }
  }

  public getGrantBonusToPrisonerConfirmation = async (req: Request, res: Response, next: NextFunction) => {
    await this.services.auditService.logPageView(AuditPage.GRANT_BONUS_WIZARD_CONFIRMATION, {
      who: res.locals.user.username,
      correlationId: req.id,
      subjectType: SubjectType.PRISON,
      subjectId: req.session?.grantBonusForm?.caseloadId,
    })

    res.render('pages/grantBonusToPrisoners/confirmation/confirmation.njk', {
      transactionNumber: req.query.transactionNumber,
    })
  }
}
