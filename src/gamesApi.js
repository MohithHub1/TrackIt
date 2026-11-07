export async function searchGames(query) {
  if (!query.trim()) return []

  const response = await fetch(
    `/api/games?search=${encodeURIComponent(query)}`
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Unable to search games')
  }

  return result
}