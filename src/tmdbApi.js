
const API_KEY = '8b9ae7867f14b60f19fff2b134b27f59'
const API_URL = 'https://api.themoviedb.org/3'

const genreMap = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
}


export async function searchTMDB(query, mediaType = 'multi') {
  if (!query.trim()) return []

  if (API_KEY === 'PASTE_YOUR_TMDB_API_KEY_HERE') {
    throw new Error('Add your TMDB API key in tmdbApi.js first.')
  }

  const response = await fetch(
    `${API_URL}/search/${mediaType}?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
  )

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`)
  }

  const result = await response.json()

  return (result.results || [])
    .filter(item => item.media_type !== 'person')
    .map(item => ({
      id: `tmdb-${item.media_type || mediaType}-${item.id}`,
      title: item.title || item.name,
      category:
        item.media_type === 'tv' || mediaType === 'tv'
          ? 'TV Shows'
          : 'Movies',
      year: (item.release_date || item.first_air_date || '').slice(0, 4),
      status: 'Planned',
      icon: item.media_type === 'tv' ? '📺' : '🎬',
      image: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : '',
      overview: item.overview || '',
      rating: typeof item.vote_average === 'number'
        ? item.vote_average
        : null,
      genres: (item.genre_ids || [])
  .map(id => genreMap[id])
  .filter(Boolean),
      tmdbId: item.id,
      mediaType: item.media_type || mediaType,
    }))
}
export async function getTMDBDetails(tmdbId, mediaType) {
  const response = await fetch(
    `${API_URL}/${mediaType}/${tmdbId}?api_key=${API_KEY}`
  )

  if (!response.ok) {
    throw new Error(`TMDB details error: ${response.status}`)
  }

  const data = await response.json()

  return {
    rating: data.vote_average ?? null,
    genres: (data.genres || []).map(genre => genre.name),
  }
}export async function getTMDBDetailsByTitle(title, category) {
  const mediaType = category === 'TV Shows' ? 'tv' : 'movie'

  const response = await fetch(
    `${API_URL}/search/${mediaType}?api_key=${API_KEY}&query=${encodeURIComponent(title)}`
  )

  if (!response.ok) {
    throw new Error(`TMDB search error: ${response.status}`)
  }

  const result = await response.json()
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
