
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const query = String(req.query.search || '').trim()
    const apiKey = process.env.THEGAMESDB_API_KEY
    console.log(
  'TheGamesDB API key loaded:',
  Boolean(apiKey)
)

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    if (!apiKey) {
      return res.status(500).json({
        error: 'TheGamesDB API key is missing'
      })
    }

    const params = new URLSearchParams({
      apikey: apiKey,
      name: query,
      fields: 'genres,rating',
      include: 'boxart',
      page: '1'
    })

    const response = await fetch(
      `https://api.thegamesdb.net/v1/Games/ByGameName?${params}`
    )

    if (!response.ok) {
      throw new Error(`TheGamesDB request failed: ${response.status}`)
    }

    const result = await response.json()

    const games = result.data?.games || []
    const boxart = result.include?.boxart?.data || {}
    const baseUrl = result.include?.boxart?.base_url
    const genreResponse = await fetch(
  `https://api.thegamesdb.net/v1/Genres?apikey=${encodeURIComponent(apiKey)}`
)

if (!genreResponse.ok) {
  throw new Error('Unable to fetch game genres')
}

const genreResult = await genreResponse.json()
const genreMap = genreResult.data?.genres || {}

   const mappedGames = games.map(game => {
  const images = boxart[game.id] || []
  const frontImage = images.find(img => img.side === 'front')

  const imageUrl = frontImage && baseUrl
    ? `${baseUrl.original}/${frontImage.filename}`
    : ''

  return {
    id: `game-${game.id}`,
    title: game.game_title,
    category: 'Games',
    year: game.release_date
      ? Number(game.release_date.slice(0, 4))
      : '',
    status: 'Planned',
    icon: '🎮',
    image: imageUrl,
    rating: null,
    genres: (game.genres || [])
      .map(id => genreMap[id]?.name)
      .filter(Boolean)
  }
})

// Remove duplicate titles while preserving different editions
const uniqueGames = []
const seenTitles = new Set()

for (const game of mappedGames) {
  const normalizedTitle = game.title.trim().toLowerCase()

  if (!seenTitles.has(normalizedTitle)) {
    seenTitles.add(normalizedTitle)
    uniqueGames.push(game)
  }

  if (uniqueGames.length === 12) break
}
return res.status(200).json(uniqueGames)
console.log('Games before deduplication:', mappedGames.length)
console.log('Games after deduplication:', uniqueGames.length)
  } catch (error) {
    console.error('Game search error:', error)

    return res.status(500).json({
      error: error.message || 'Unable to search games'
    })
  }
}
