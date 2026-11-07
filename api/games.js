export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const query = String(req.query.search || '').trim()

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    const clientId = process.env.TWITCH_CLIENT_ID
    const clientSecret = process.env.TWITCH_CLIENT_SECRET
    console.log('Twitch environment check:', {
  clientIdPresent: Boolean(clientId),
  clientSecretPresent: Boolean(clientSecret),
  clientIdLength: clientId?.length || 0,
  clientSecretLength: clientSecret?.length || 0,
})

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        error: 'Twitch credentials are missing'
      })
    }

    const tokenResponse = await fetch(
      'https://id.twitch.tv/oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials'
        })
      }
    )

   if (!tokenResponse.ok) {
  const authError = await tokenResponse.json()

  console.error('Twitch authentication error:', {
    status: tokenResponse.status,
    error: authError.message || authError.error
  })

  throw new Error(
    `Twitch authentication failed: ${authError.message || authError.error}`
  )
}

    const tokenData = await tokenResponse.json()

    const safeQuery = query.replace(/["\\]/g, '')

    const igdbResponse = await fetch(
      'https://api.igdb.com/v4/games',
      {
        method: 'POST',
        headers: {
          'Client-ID': clientId,
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'text/plain'
        },
        body: `
          search "${safeQuery}";
          fields name, cover.url, first_release_date, rating, genres.name;
          limit 12;
        `
      }
    )

    if (!igdbResponse.ok) {
      throw new Error(`IGDB request failed: ${igdbResponse.status}`)
    }

    const games = await igdbResponse.json()

    return res.status(200).json(
      games.map(game => ({
        id: `game-${game.id}`,
        title: game.name,
        category: 'Games',
        year: game.first_release_date
          ? new Date(game.first_release_date * 1000).getUTCFullYear()
          : '',
        status: 'Planned',
        icon: '🎮',
        image: game.cover?.url
          ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}`
          : '',
        rating: game.rating != null
          ? Number((game.rating / 10).toFixed(1))
          : null,
        genres: game.genres?.map(genre => genre.name) || []
      }))
    )
  } catch (error) {
    console.error('Game search error:', error)

    return res.status(500).json({
      error: error.message || 'Unable to search games'
    })
  }
}