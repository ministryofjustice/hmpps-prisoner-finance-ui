import assert from 'node:assert/strict'
import arrayToCSV from './csv'

describe('arrayToCsv', () => {
  test('converts basic primitive types correctly', () => {
    const input = [
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false },
    ]

    const expected = ['id,name,active', '1,Alice,true', '2,Bob,false'].join('\r\n')

    assert.equal(arrayToCSV(input), expected)
  })

  test('escapes fields containing commas', () => {
    const input = [
      { id: 1, address: 'San Francisco, CA' },
      { id: 2, address: 'London, UK' },
    ]

    const expected = ['id,address', '1,"San Francisco, CA"', '2,"London, UK"'].join('\r\n')

    assert.equal(arrayToCSV(input), expected)
  })

  test('escapes fields containing double quotes by doubling them', () => {
    const input = [{ id: 1, quote: 'He said "Hello World"' }]

    const expected = ['id,quote', '1,"He said ""Hello World"""'].join('\r\n')

    assert.equal(arrayToCSV(input), expected)
  })

  test('escapes fields containing newlines', () => {
    const input = [{ id: 1, bio: 'First line\nSecond line\r\nThird line' }]

    const expected = ['id,bio', '1,"First line\nSecond line\r\nThird line"'].join('\r\n')

    assert.equal(arrayToCSV(input), expected)
  })

  test('escapes column headers containing reserved characters', () => {
    const input = [{ 'User, Name': 'Alice', 'Say "Hi"': 'Yes' }]

    const expected = ['"User, Name","Say ""Hi"""', 'Alice,Yes'].join('\r\n')

    assert.equal(arrayToCSV(input), expected)
  })

  test('handles null, undefined, and missing keys as empty strings', () => {
    const input: Array<Record<string, unknown>> = [
      { a: null, b: undefined, c: 'present' },
      { a: 1 }, // b and c are omitted
    ]

    const expected = ['a,b,c', ',,present', '1,,'].join('\r\n')

    assert.equal(arrayToCSV(input), expected)
  })

  test('respects explicit column order and filters unselected keys', () => {
    const input = [
      { id: 1, name: 'Alice' },
      { name: 'Bill', id: 2 },
    ]

    const result = arrayToCSV(input)
    const expected = ['id,name', '1,Alice', '2,Bill'].join('\r\n')

    assert.equal(result, expected)
  })
})
