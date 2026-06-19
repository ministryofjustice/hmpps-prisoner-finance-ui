import superagent, { SuperAgentRequest, Response } from 'superagent'

const url = 'http://localhost:9091/__admin'

const stubFor = (mapping: Record<string, unknown>): SuperAgentRequest =>
  superagent.post(`${url}/mappings`).send(mapping)

const getMatchingRequests = (body: string | object) => superagent.post(`${url}/requests/find`).send(body)

const resetStubs = (): Promise<Array<Response>> => {
  return Promise.all([superagent.post(`${url}/mappings/reset`).send(), superagent.delete(`${url}/requests`).send()])
}
export { stubFor, getMatchingRequests, resetStubs }
