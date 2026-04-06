/**
 * Convert a snake_case string to camelCase.
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Recursively convert all snake_case keys in an object to camelCase.
 * Handles nested objects and arrays.
 */
export function toCamelCase<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key)

    if (value === null || value === undefined) {
      result[camelKey] = value
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return toCamelCase(item as Record<string, unknown>)
        }
        return item
      })
    } else if (typeof value === 'object') {
      result[camelKey] = toCamelCase(value as Record<string, unknown>)
    } else {
      result[camelKey] = value
    }
  }

  return result as T
}

/**
 * Convert a camelCase string to snake_case.
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Recursively convert all camelCase keys in an object to snake_case.
 * Handles nested objects and arrays.
 */
export function toSnakeCase<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key)

    if (value === null || value === undefined) {
      result[snakeKey] = value
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map((item) => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return toSnakeCase(item as Record<string, unknown>)
        }
        return item
      })
    } else if (typeof value === 'object') {
      result[snakeKey] = toSnakeCase(value as Record<string, unknown>)
    } else {
      result[snakeKey] = value
    }
  }

  return result as T
}
