import getErrorStatus from './getErrorStatus'

describe('getErrorStatus', () => {
  it('prefers the http-errors `status`', () => {
    expect(getErrorStatus({ status: 404 })).toBe(404)
  })

  it('falls back to the hmpps-rest-client `responseStatus`', () => {
    expect(getErrorStatus({ responseStatus: 401 })).toBe(401)
  })

  it('prefers `status` when both are present', () => {
    expect(getErrorStatus({ status: 404, responseStatus: 500 })).toBe(404)
  })

  it('returns undefined when neither is present', () => {
    expect(getErrorStatus({})).toBeUndefined()
    expect(getErrorStatus(undefined)).toBeUndefined()
  })

  it.each([0, NaN, -1, 99, 1000, 404.5])('ignores %p, which res.status() would reject', invalidStatus => {
    expect(getErrorStatus({ status: invalidStatus })).toBeUndefined()
    expect(getErrorStatus({ responseStatus: invalidStatus })).toBeUndefined()
  })

  it('falls back to responseStatus when status is not a usable code', () => {
    expect(getErrorStatus({ status: 0, responseStatus: 502 })).toBe(502)
  })

  it('ignores non-numeric values', () => {
    expect(getErrorStatus({ status: '404' } as unknown as { status?: number })).toBeUndefined()
  })
})
