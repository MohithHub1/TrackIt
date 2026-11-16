
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.TMDB_API_KEY
  console.log('TMDB key loaded:', Boolean(apiKey))

  if (!apiKey) {
    return res.status(500).json({
      error: 'TMDB API key is not configured',
    })
  }

  const { action, query, mediaType, tmdbId } = req.query

  let endpoint = ''

  if (action === 'search') {
    if (!query?.trim()) {
      return res.status(400).json({
        error: 'Search query is required',
      })
    }

    const type = ['movie', 'tv', 'multi'].includes(mediaType)
      ? mediaType
      : 'multi'

    endpoint = `/search/${type}`
  } else if (action === 'details') {
    const type = ['movie', 'tv'].includes(mediaType)
      ? mediaType
      : null

    if (!type || !/^\d+$/.test(tmdbId || '')) {
      return res.status(400).json({
        error: 'Invalid TMDB details request',
      })
    }

    endpoint = `/${type}/${tmdbId}`
  } else {
    return res.status(400).json({
      error: 'Invalid TMDB action',
    })
  }

  try {
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`)

    url.searchParams.set('api_key', apiKey)

    if (action === 'search') {
      url.searchParams.set('query', query)
    }

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.status_message || 'TMDB request failed',
      })
    }

    return res.status(200).json(data)
  } catch (error) {
    console.error('TMDB API error:', error)

    return res.status(500).json({
      error: 'Unable to contact TMDB',
    })
  }
}
