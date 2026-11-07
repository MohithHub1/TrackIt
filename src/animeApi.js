export async function searchAnime(query) {
  if (!query.trim()) return []

  const graphqlQuery = `
    query ($search: String) {
      Page(page: 1, perPage: 12) {
        media(
          search: $search,
          type: ANIME,
          sort: [SEARCH_MATCH, POPULARITY_DESC]
        ) {
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

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { search: query },
    }),
  })

  if (!response.ok) {
    throw new Error('Unable to search anime.')
  }

  const result = await response.json()

  return (result.data?.Page?.media ?? [])
    .filter(anime => anime.title?.english || anime.title?.romaji)
    .map(anime => ({
      id: `anime-${anime.id}`,
      title: anime.title.english || anime.title.romaji,
      category: 'Anime',
      year: anime.startDate?.year ?? '',
      status: 'Planned',
      icon: '⛩️',
      image: anime.coverImage?.large || '',
      episodes: anime.episodes ?? 'Unknown',
      score: anime.averageScore,
      rating: anime.averageScore,
      genres: anime.genres ?? [],
    }))
}