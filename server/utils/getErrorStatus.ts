// hmpps-rest-client errors expose the upstream status as `responseStatus`; http-errors use `status`.
export type StatusBearingError = { status?: number; responseStatus?: number }

const isValidHttpStatus = (status: unknown): status is number =>
  typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 999

export default function getErrorStatus(error: StatusBearingError | undefined): number | undefined {
  if (isValidHttpStatus(error?.status)) return error.status
  if (isValidHttpStatus(error?.responseStatus)) return error.responseStatus
  return undefined
}
