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
  const newQuery = { ...query }
  delete newQuery[key]

  const queryString = new URLSearchParams(newQuery as Record<string, string>).toString()

  return {
    text: label,
    href: `?${queryString}#filterForm`,
  }
}

export const buildMojSelectedFilter = (
  filtersConfig: Record<string, FilterConfigItem>,
  query: QueryString.ParsedQs,
): SelectedFilterCategory[] => {
  const selectedMap: Record<string, SelectedFilterItem[]> = {}

  Object.entries(filtersConfig).forEach(([key, filterConf]) => {
    const queryStringParam = query[key]

    if (queryStringParam) {
      const item: SelectedFilterItem = buildClearFilterItem(query, key, filterConf.label)

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
