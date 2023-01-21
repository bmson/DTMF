/**
 * Check if input of either array or string is included in an second array
 *
 * Example:
 *   getIncluded([1, 2, 3], [1, 3]) => [1, 3]
 *   getIncluded([1, 2, 3], [2, 3]) => [2, 3]
 */
export const getIncluded = (input, compare) => {
  const flatArray = [input].flat(Infinity); // Convert input to array and flatten to one level
  return flatArray.filter(value => compare.includes(value));
}

/**
 * Replace input characters with corresponding mapping
 *
 * Example:
 *   getCollection('abc',  { a:1, b:2, c:3 }) => [1, 2, 3]
 *   getCollection('abcd', { a:1, b:2, c:3 }) => [1, 2, 3, 'd']
 */
export const getCollection = (input, map) => {
  return [...input].flatMap(value => map[value] || value);
}
