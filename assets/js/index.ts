import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import Card from './card'
import ListFilter from './list-filter'
import nodeListForEach from './utils'

govukFrontend.initAll()
mojFrontend.initAll()

const $filters = document.querySelectorAll('[data-module="list-filter"]')
nodeListForEach($filters, $filter => {
  // eslint-disable-next-line no-new
  new ListFilter($filter)
})

const $cards = document.querySelectorAll('.card--clickable')
nodeListForEach($cards, $card => {
  // eslint-disable-next-line no-new
  new Card($card)
})
