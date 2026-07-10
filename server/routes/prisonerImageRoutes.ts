import { Request, Response } from 'express'
import path from 'path'
import PrisonApiService from '../services/prisonApiService'

const placeHolderImage = path.join(process.cwd(), '/dist/assets/images/prisoner-profile-image.png')

export default class PrisonerImageRoutes {
  constructor(private readonly prisonerImageService: PrisonApiService) {}

  GET = async (req: Request<{ prisonNumber: string }>, res: Response) =>
    this.prisonerImageService
      .getPrisonerImage({ res }, req.params.prisonNumber)
      .then(data => {
        res.set('Cache-control', 'private, max-age=86400')
        res.removeHeader('pragma')
        res.type('image/jpeg')
        data.pipe(res)
      })
      .catch(_error => {
        res.sendFile(placeHolderImage)
      })
}
