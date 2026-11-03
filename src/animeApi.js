
const API_URL = 'https://graphql.anilist.co'

export async function searchAnime(query) {
  if (!query.trim()) return []

  const graphqlQuery = `
    query ($search: String) {
      Page(page: 1, perPage: 12) {
        media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
          id
          title {
            romaji
            english
          }
          episodes
          averageScore
          genres
          startDate {
            year
          }
          coverImage {
            large
          }
        }
      }
    }
  `

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { search: query.trim() },
    }),
  })

  if (!response.ok) {
    throw new Error(`Anime API error: ${response.status}`)
  }

  const result = await response.json()

  if (result.errors?.length) {
    throw new Error(result.errors[0].message)
  }

  return (result.data?.Page?.media ?? []).map(anime => ({
    id: `anime-${anime.id}`,
    title: anime.title.english || anime.title.romaji,
    category: 'Anime',
    year: anime.startDate.year ?? '',
    status: 'Planned',
    icon: '⛩️',
    image: anime.coverImage.large,
    episodes: anime.episodes ?? 'Unknown',
    score: anime.averageScore
      ? `${anime.averageScore}/100`
      : 'Not rated',
    rating: anime.averageScore,
    genres: anime.genres ?? [],
  }))
}
