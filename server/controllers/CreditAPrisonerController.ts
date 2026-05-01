import { SessionData } from 'express-session'
import { NextFunction, Request, Response } from 'express'
import { Services } from '../services'
import CreditAPrisonerService from '../services/creditAPrisonerService'
import { AuditPage } from '../services/auditService'
import AccountResponse from '../interfaces/AccountResponse'

export default class CreditAPrisonerController {
  constructor(private readonly services: Services) {}

  private mapSubAccountsToRadioContents = (subAccounts: AccountResponse['subAccounts'], dataTestId: string) => {
    return subAccounts.map(({ id, reference }) => {
      return {
        value: id,
        text: reference,
        attributes: {
          'data-testid': dataTestId,
        },
      }
    })
  }

  public getCreditTo = async (req: Request, res: Response, next: NextFunction) => {
    await this.services.auditService.logPageView(AuditPage.CREDIT_TO, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    try {
      const { subAccounts } = await this.services.prisonerFinanceService.getAccountByReference(
        req.params.prisonNumber as string,
      )

      if (!req.session.creditForm) {
        CreditAPrisonerService.createCreditForm(req.session as SessionData)
      }

      res.render('pages/creditAPrisoner/creditTo/creditTo.njk', {
        subAccountSelected: req.session.creditForm.creditSubAccountId,
        subAccounts: this.mapSubAccountsToRadioContents(subAccounts, 'sub-account-radio'),
      })
    } catch (e) {
      next(e)
    }
  }

  public postCreditTo = async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.creditTo) {
      req.session.creditForm.creditSubAccountId = req.body.creditTo
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
    await this.services.auditService.logPageView(AuditPage.CREDIT_FROM, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    if (!req.session?.creditForm?.creditSubAccountId) {
      res.redirect('./credit-to')
      return
    }

    try {
      // TODO: phase 1 hardcoded to LEI
      const { subAccounts } = await this.services.prisonerFinanceService.getAccountByReference('LEI')
      const subaccountsForDisplay = this.mapSubAccountsToRadioContents(subAccounts, 'prison-account-radio')

      const debitSubAccountId = req.session?.creditForm?.debitSubAccountId

      res.render('pages/creditAPrisoner/creditFrom/creditFrom.njk', { items: subaccountsForDisplay, debitSubAccountId })
    } catch (e) {
      next(e)
    }
  }

  public postCreditFrom = async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.creditFrom) {
      req.session.creditForm.debitSubAccountId = req.body.creditFrom
      res.redirect('./credit-amount')
    } else {
      try {
        const { subAccounts } = await this.services.prisonerFinanceService.getAccountByReference('LEI')
        const subaccountsForDisplay = this.mapSubAccountsToRadioContents(subAccounts, 'prison-account-radio')
        res.render('pages/creditAPrisoner/creditFrom/creditFrom.njk', {
          items: subaccountsForDisplay,
          errorMap: {
            errorText: 'You must select a sub-account before continuing.',
          },
        })
      } catch (e) {
        next(e)
      }
    }
  }
}
