function Card(container) {
  this.container = container

  const link = this.container.querySelector('a')
  if (link !== null) {
    link.addEventListener('click', e => {
      if (e.target.classList.contains('disable-link')) {
        e.preventDefault()
      }

      e.stopPropagation()
    })
    this.container.addEventListener('click', e => {
      e.stopPropagation()
      link.click()
    })
  }
}

export default Card
