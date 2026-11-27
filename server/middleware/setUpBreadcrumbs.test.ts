import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express'

import setUpBreadcrumbs from './setUpBreadcrumbs'

describe('breadcrumbs', () => {
  let mockReq: ExpressRequest
  let mockRes: ExpressResponse
  let mockNext: NextFunction

  const breadcrumbBuilder = setUpBreadcrumbs()

  beforeEach(() => {
    mockReq = {} as unknown as ExpressRequest
    mockRes = { locals: {} } as unknown as ExpressResponse
    mockNext = (() => {}) as unknown as NextFunction
    breadcrumbBuilder(mockReq, mockRes, mockNext)
  })

  it('should init with no breadcrumbs', () => {
    expect(mockRes.locals.breadcrumbs.items.length).toBe(0)
  })

  describe('add and pop items', () => {
    it('it should add an item to the list', () => {
      mockRes.locals.breadcrumbs.addItems({ text: 'Item 1', href: '' })
      expect(mockRes.locals.breadcrumbs.items[0].text).toBe('Item 1')
      expect(mockRes.locals.breadcrumbs.items.length).toBe(1)
    })

    it('it should add mutiple items to the list', () => {
      mockRes.locals.breadcrumbs.addItems({ text: 'Item 1', href: '' }, { text: 'Item 2', href: '' })
      mockRes.locals.breadcrumbs.addItems({ text: 'Item 3', href: '' })
      expect(mockRes.locals.breadcrumbs.items.length).toBe(3)
      expect(mockRes.locals.breadcrumbs.items[0].text).toBe('Item 1')
      expect(mockRes.locals.breadcrumbs.items[1].text).toBe('Item 2')
      expect(mockRes.locals.breadcrumbs.items[2].text).toBe('Item 3')
    })

    it('It should remove the last item', () => {
      mockRes.locals.breadcrumbs.addItems({ text: 'Item 1', href: '' })
      mockRes.locals.breadcrumbs.addItems({ text: 'Item 2', href: '' })
      mockRes.locals.breadcrumbs.popLastItem()
      expect(mockRes.locals.breadcrumbs.items.length).toBe(1)
      expect(mockRes.locals.breadcrumbs.items[0].text).toBe('Item 1')
    })
  })

  describe('Url Builder', () => {
    it('should prepend a forward slash - / on the href', () => {
      mockRes.locals.breadcrumbs.addItems({ text: 'Item 1', href: 'example' })
      expect(mockRes.locals.breadcrumbs.items[0].href).toEqual('/example')
    })

    it('should build href from the previous item', () => {
      mockRes.locals.breadcrumbs.addItems({ text: 'Item 1', href: 'example' })
      mockRes.locals.breadcrumbs.addItems({ text: 'Item 2', href: 'account' })
      mockRes.locals.breadcrumbs.addItems({ text: 'Item 3', href: 'detail' })
      expect(mockRes.locals.breadcrumbs.items[0].href).toEqual('/example')
      expect(mockRes.locals.breadcrumbs.items[1].href).toEqual('/example/account')
      expect(mockRes.locals.breadcrumbs.items[2].href).toEqual('/example/account/detail')
    })
  })
})
