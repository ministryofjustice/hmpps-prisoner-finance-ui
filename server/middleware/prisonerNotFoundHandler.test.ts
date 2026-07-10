import { NextFunction, Request, Response } from 'express'
import prisonerNotFoundHandler from './prisonerNotFoundHandler'

describe('prisonerNotFoundHandler', () => {
  const res = { status: jest.fn().mockReturnThis(), render: jest.fn() } as unknown as Response
  const next = jest.fn() as NextFunction

  beforeEach(() => {
    jest.resetAllMocks()
    ;(res.status as jest.Mock).mockReturnThis()
  })

  it.each([
    ['status', { status: 404 }],
    ['responseStatus', { responseStatus: 404 }],
  ])('renders the prisoner not found page for a 404 via %s', (_label, error) => {
    prisonerNotFoundHandler(error as never, {} as Request, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.render).toHaveBeenCalledWith('pages/prisoner-not-found')
    expect(next).not.toHaveBeenCalled()
  })

  it('delegates non-404 errors to the global error handler', () => {
    const error = { status: 500 }

    prisonerNotFoundHandler(error as never, {} as Request, res, next)

    expect(res.render).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(error)
  })
})
