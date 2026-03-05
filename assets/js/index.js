import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import Card from './card'
import nodeListForEach from './utils'

govukFrontend.initAll()
mojFrontend.initAll()

const $cards = document.querySelectorAll('.card--clickable')
nodeListForEach($cards, $card => {
  // eslint-disable-next-line no-new
  new Card($card)
})
