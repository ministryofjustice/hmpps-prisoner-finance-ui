/**
 * Escapes a single CSV value.
 *
 * @param value - The raw field value.
 * @param delimiter - The field delimiter (default: ',').
 * @returns The escaped string.
 */
function escapeCsvValue(value: unknown, delimiter = ','): string {
  if (value === null || value === undefined) {
    return ''
  }

  const str = String(value)

  // Check if value contains delimiter, double quote, or newline characters
  const needsEscaping = str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')

  if (needsEscaping) {
    return `"${str.replaceAll('"', '""')}"`
  }

  return str
}

/**
 * Converts an array of objects to an RFC 4180 compliant CSV string.
 *
 * @template T - The row object type.
 * @param data - Array of row objects.
 * @param columns - columns to export to csv.
 * @returns The formatted CSV string.
 */
export default function arrayToCsv(data: readonly unknown[]): string {
  const delimiter = ','

  const eol = '\r\n'

  if (!Array.isArray(data) || data.length === 0) {
    return ''
  }

  const rows: string[] = []

  const cols = Object.keys(data[0])
  // Add header row
  rows.push(cols.map(col => escapeCsvValue(col, delimiter)).join(delimiter))

  // Add data rows
  for (const item of data) {
    const row = cols.map(col => escapeCsvValue(item?.[col], delimiter)).join(delimiter)
    rows.push(row)
  }

  return rows.join(eol)
}
