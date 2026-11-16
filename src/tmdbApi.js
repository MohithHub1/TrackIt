
const genreMap = {
  28: 'Action', 12: 'Adventure', 16: 'Animation',
  35: 'Comedy', 80: 'Crime', 99: 'Documentary',
  18: 'Drama', 10751: 'Family', 14: 'Fantasy',
  36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War',
  37: 'Western', 10759: 'Action & Adventure',
  10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics',
}

async function tmdbRequest(params) {
  const searchParams = new URLSearchParams(params)
  const response = await fetch(`/api/tmdb?${searchParams}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'TMDB request failed')
  }

  return data
}

export async function searchTMDB(query, mediaType = 'multi') {
  if (!query.trim()) return []

  const data = await tmdbRequest({
    action: 'search',
    query,
    mediaType,
  })

  return (data.results || [])
    .filter(item => {
      const type = item.media_type || mediaType
      const title = item.title || item.name

      return (
        (type === 'movie' || type === 'tv') &&
        title &&
        item.poster_path
      )
    })
    .map(item => {
      const type = item.media_type || mediaType
      const rating = Number(item.vote_average)

      return {
        id: `tmdb-${type}-${item.id}`,
        title: item.title || item.name,
        category: type === 'tv' ? 'TV Shows' : 'Movies',
        year: (item.release_date || item.first_air_date || '').slice(0, 4),
        status: 'Planned',
        icon: type === 'tv' ? '📺' : '🎬',
        image: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        overview: item.overview || '',
        rating: Number.isFinite(rating) && rating > 0 ? rating : null,
        genres: (item.genre_ids || [])
          .map(id => genreMap[id])
          .filter(Boolean),
        tmdbId: item.id,
        mediaType: type,
      }
    })
}

export async function getTMDBDetails(tmdbId, mediaType) {
  const data = await tmdbRequest({
    action: 'details',
    tmdbId,
    mediaType,
  })

  return {
    rating: data.vote_average ?? null,
    genres: (data.genres || []).map(genre => genre.name),
  }
}

export async function getTMDBDetailsByTitle(title, category) {
  const mediaType = category === 'TV Shows' ? 'tv' : 'movie'

  const result = await tmdbRequest({
    action: 'search',
    query: title,
    mediaType,
  })

  const match = result.results?.[0]

  if (!match) return null

  return {
    rating: match.vote_average ?? null,
    genres: (match.genre_ids || [])
      .map(id => genreMap[id])
      .filter(Boolean),
    tmdbId: match.id,
    mediaType,
  }
}
