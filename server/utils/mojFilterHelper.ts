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

export const buildMojSelectedFilter = (
  filtersConfig: Record<string, FilterConfigItem>,
  query: QueryString.ParsedQs,
): SelectedFilterCategory[] => {
  const selectedMap: Record<string, SelectedFilterItem[]> = {}

  Object.entries(filtersConfig).forEach(([key, filterConf]) => {
    const value = query[key]

    if (value) {
      const newQuery = { ...query }
      delete newQuery[key]

      const queryString = new URLSearchParams(newQuery as Record<string, string>).toString()

      const item: SelectedFilterItem = {
        text: filterConf.label,
        href: `?${queryString}#filterForm`,
      }

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
