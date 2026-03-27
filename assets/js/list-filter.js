import { FilterToggleButton } from '@ministryofjustice/frontend'

function ListFilter(container) {
  this.container = container

  const storageKey = `moj-filter-state-${this.container.id || 'default'}`
  const savedState = sessionStorage.getItem(storageKey)

  let shouldStartHidden = this.container.dataset.filterStartShown !== 'true'
  if (savedState !== null) {
    shouldStartHidden = savedState === 'hidden'
  }

  if (shouldStartHidden) {
    this.container.classList.add('moj-js-hidden')
  } else {
    this.container.classList.remove('moj-js-hidden')
  }

  this.toggleButton = new FilterToggleButton(this.container, {
    bigModeMediaQuery: '(min-width: 40.0625em)',
    startHidden: shouldStartHidden,
    toggleButton: {
      showText: 'Show filter',
      hideText: 'Hide filter',
      classes: 'govuk-button--blue',
    },
    toggleButtonContainer: {
      selector: '.moj-action-bar__filter',
    },
    closeButton: {
      text: 'Close',
    },
    closeButtonContainer: {
      selector: '.moj-filter__header-action',
    },
  })

  const toggleButton = document.querySelector('.moj-action-bar__filter button')

  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      setTimeout(() => {
        const isHidden = this.container.classList.contains('moj-js-hidden')
        sessionStorage.setItem(storageKey, isHidden ? 'hidden' : 'visible')
      }, 200)
    })
  }

  const closeButton = this.container.querySelector('.moj-filter__header-action button')
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      sessionStorage.setItem(storageKey, 'hidden')
    })
  }
}

export default ListFilter
