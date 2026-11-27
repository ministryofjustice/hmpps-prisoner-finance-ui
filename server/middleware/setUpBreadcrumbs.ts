import type { Request, Response, NextFunction, RequestHandler } from 'express'

class Breadcrumbs {
  breadcrumbs: Breadcrumb[]

  constructor(res: Response) {
    this.breadcrumbs = []
  }

  popLastItem(): Breadcrumb {
    return this.breadcrumbs.pop()
  }

  addItems(...items: Breadcrumb[]): void {
    this.breadcrumbs.push(...items)
  }

  get items(): readonly Breadcrumb[] {
    return this.breadcrumbs.map(this.getUrlBuilder())
  }

  private getUrlBuilder() {
    let currentUrl = ''
    return (breadcrumb: Breadcrumb) => {
      currentUrl += `/${breadcrumb.href}`
      return { text: breadcrumb.text, href: currentUrl }
    }
  }
}

export default function setUpBreadcrumbs(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.breadcrumbs = new Breadcrumbs(res)
    next()
  }
}

type Breadcrumb = { href: string; text: string }

declare module 'express-serve-static-core' {
  interface Locals {
    breadcrumbs: Breadcrumbs
  }
}
