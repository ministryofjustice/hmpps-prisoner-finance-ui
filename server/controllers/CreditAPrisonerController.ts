import { SessionData } from 'express-session'
import { NextFunction, Request, Response } from 'express'
import z from 'zod'
import { Services } from '../services'
import CreditAPrisonerService from '../services/creditAPrisonerService'
import { AuditPage, SubjectType } from '../services/auditService'
import AccountResponse from '../interfaces/AccountResponse'
import creditAmountValidator from '../validators/creditAmountValidator'
import descriptionFieldValidator from '../validators/descriptionFieldValidator'
import { mapItemsForRadioButtons } from '../utils/utils'

export default class CreditAPrisonerController {
  constructor(private readonly services: Services) {}

  private mapSubAccountsToRadioContents = (subAccounts: AccountResponse['subAccounts'], dataTestId: string) => {
    return mapItemsForRadioButtons({ input: subAccounts, valueKey: 'id', textKey: 'reference', dataTestId })
  }

  public getCreditTo = async (req: Request, res: Response, next: NextFunction) => {
    const prisonerReference = req.params.prisonNumber as string

    await this.services.auditService.logPageView(AuditPage.CREDIT_A_PRISONER_WIZARD_TO, {
      who: res.locals.user.username,
      correlationId: req.id,
      subjectType: SubjectType.PRISONER,
      subjectId: prisonerReference,
    })

    const { subAccounts } = await this.services.prisonerFinanceService.getAccountByReference(prisonerReference)

    CreditAPrisonerService.createCreditFormIfRequired(req.session as SessionData, prisonerReference)

    res.render('pages/creditAPrisoner/creditTo/creditTo.njk', {
      subAccountSelected: req.session.creditForm.creditSubAccountId,
      subAccounts: this.mapSubAccountsToRadioContents(subAccounts, 'sub-account-radio'),
    })
  }

  public postCreditTo = async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.creditTo) {
      CreditAPrisonerService.updateCreditForm(req.session as SessionData, { creditSubAccountId: req.body.creditTo })
      res.redirect('./credit-from')
    } else {
      const { subAccounts } = await this.services.prisonerFinanceService.getAccountByReference(
        req.params.prisonNumber as string,
      )
      res.render('pages/creditAPrisoner/creditTo/creditTo.njk', {
        errorMap: {
          errorText: 'You must select a sub-account before continuing.',
        },
        subAccounts: this.mapSubAccountsToRadioContents(subAccounts, 'sub-account-radio'),
      })
    }
  }

  public getCreditFrom = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.creditForm?.creditSubAccountId && !req.session?.creditForm?.prisonerAccountReference) {
      res.redirect('./credit-to')
      return
    }

    await this.services.auditService.logPageView(AuditPage.CREDIT_A_PRISONER_WIZARD_FROM, {
      who: res.locals.user.username,
      correlationId: req.id,
      subjectType: SubjectType.PRISONER,
      subjectId: req.session.creditForm.prisonerAccountReference,
    })

    // this will give the prisoner a credit from the current user's selected prison in DPS - we probably need to flag this in the UI
    const caseloads = await this.services.prisonApiService.getUserCaseloads(req.user?.token as string)
    const currentCaseload = caseloads.find(caseload => caseload.currentlyActive)

    const { subAccounts } = await this.services.prisonerFinanceService.getAccountByReference(
      currentCaseload?.caseLoadId,
    )
    const subaccountsForDisplay = this.mapSubAccountsToRadioContents(subAccounts, 'prison-account-radio')

    const debitSubAccountId = req.session?.creditForm?.debitSubAccountId

    res.render('pages/creditAPrisoner/creditFrom/creditFrom.njk', { items: subaccountsForDisplay, debitSubAccountId })
  }

  public postCreditFrom = async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.creditFrom) {
      CreditAPrisonerService.updateCreditForm(req.session as SessionData, { debitSubAccountId: req.body.creditFrom })
      res.redirect('./credit-amount')
    } else {
      const { subAccounts } = await this.services.prisonerFinanceService.getAccountByReference('LEI')
      const subaccountsForDisplay = this.mapSubAccountsToRadioContents(subAccounts, 'prison-account-radio')
      res.render('pages/creditAPrisoner/creditFrom/creditFrom.njk', {
        items: subaccountsForDisplay,
        errorMap: {
          errorText: 'You must select a sub-account before continuing.',
        },
      })
    }
  }

  public getCreditAmount = async (req: Request, res: Response, next: NextFunction) => {
    res.render('pages/creditAPrisoner/creditAmount/creditAmount.njk')
  }

  public postCreditAmount = async (req: Request, res: Response, next: NextFunction) => {
    const amountFormSchema = z.object({
      amount: creditAmountValidator,
      description: descriptionFieldValidator,
    })
    const result = amountFormSchema.safeParse(req.body)

    if (result.success) {
      const amount = result.data?.amount
      const description = result.data?.description

      CreditAPrisonerService.updateCreditForm(req.session as SessionData, {
        amount,
        description,
      })

      const transactionReq = CreditAPrisonerService.createTransactionRequest(req.session.creditForm)
      const createdTransactionResponse = await this.services.prisonerFinanceService.postTransaction(transactionReq)
      res.redirect(`./credit-confirmation?transactionNumber=${createdTransactionResponse.id}`)
    } else {
      const allErrors = z.flattenError(result.error).fieldErrors
      const templateErrors = Object.fromEntries(
        Object.entries(allErrors).map(([field, errors]) => [field, errors?.[0]]),
      )

      res.render('pages/creditAPrisoner/creditAmount/creditAmount.njk', {
        errorMap: {
          amount: templateErrors.amount || null,
          description: templateErrors.description || null,
        },
        amount: req.body.amount,
        description: req.body.description,
      })
    }
  }

  public getCreditConfirmation = (req: Request, res: Response, next: NextFunction) => {
    CreditAPrisonerService.clearCreditForm(req.session as SessionData)

    res.render('pages/creditAPrisoner/creditConfirmation/creditConfirmation.njk', {
      transactionNumber: req.query.transactionNumber,
      prisonNumber: req.params.prisonNumber,
    })
  }
}
