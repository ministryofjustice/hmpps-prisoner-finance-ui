import QueryString from 'qs'

export interface SelectedFilterItem {
  text: string
  href: string
}

interface SelectedFilterCategory {
  heading: {
    text: string
  }
  items: SelectedFilterItem[]
}

interface FilterConfigItem {
  label: string
  category: string
}

const buildClearFilterItem = (query: QueryString.ParsedQs, key: string, label: string): SelectedFilterItem => {
  // removing a filter should send you to page one
  const newQuery: Record<string, string> = { ...query, page: '1' }
  delete newQuery[key]

  const queryString = new URLSearchParams(newQuery).toString()

  return {
    text: label,
    href: `?${queryString}#filterForm`,
  }
}

const clearReqQueryFromFalsyFilters = ({
  credit,
  debit,
  ...restOfTheQuery
}: QueryString.ParsedQs): QueryString.ParsedQs => {
  // this methods clears selectedFilters by valid unset values in the URL
  // ie. the url ?debit=false should not display as selected filters in the UI
  return {
    ...(credit && credit !== 'false' && { credit }),
    ...(debit && debit !== 'false' && { debit }),
    ...restOfTheQuery,
  }
}

export const buildMojSelectedFilter = (
  filtersConfig: Record<string, FilterConfigItem>,
  query: QueryString.ParsedQs,
): SelectedFilterCategory[] => {
  const filteredQuery = clearReqQueryFromFalsyFilters(query)
  const selectedMap: Record<string, SelectedFilterItem[]> = {}

  Object.entries(filtersConfig).forEach(([key, filterConf]) => {
    const queryStringParam = filteredQuery[key]

    if (queryStringParam) {
      const item: SelectedFilterItem = buildClearFilterItem(filteredQuery, key, filterConf.label)

      if (!selectedMap[filterConf.category]) {
        selectedMap[filterConf.category] = []
      }

      selectedMap[filterConf.category].push(item)
    }
  })

  return Object.entries(selectedMap).map(
    ([category, items]): SelectedFilterCategory => ({
      heading: { text: category },
      items,
    }),
  )
}
