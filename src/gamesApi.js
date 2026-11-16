export async function searchGames(query) {
  if (!query.trim()) return []

  const response = await fetch(
    `/api/games?search=${encodeURIComponent(query)}`
  )

  const contentType = response.headers.get('content-type') || ''

if (!contentType.includes('application/json')) {
  const body = await response.text()
  console.error('Games API returned:', response.status, body.slice(0, 500))
  throw new Error('Games API returned an invalid response. Check the console.')
}

const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Unable to search games')
  }

  return result
}