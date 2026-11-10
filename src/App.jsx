import { useState, useEffect, useRef } from 'react'
import './App.css'
import { searchAnime } from './animeApi'
import { searchGames } from './gamesApi'
import {
  searchTMDB,
  getTMDBDetails,
  getTMDBDetailsByTitle
} from './tmdbApi'
import { supabase } from './supabase'
const initialItems = [
  { id: 1, title: 'Avengers: Endgame', category: 'Movies', year: 2019, status: 'Completed', icon: '🎬' },
  { id: 2, title: 'Spider-Man: No Way Home', category: 'Movies', year: 2021, status: 'Planned', icon: '🎬' },
  { id: 3, title: 'Breaking Bad', category: 'TV Shows', year: 2008, status: 'Watching', icon: '📺' },
  { id: 4, title: 'Attack on Titan', category: 'Anime', year: 2013, status: 'Watching', icon: '⚔️' },
  { id: 5, title: 'Death Note', category: 'Anime', year: 2006, status: 'Planned', icon: '📓' },
  { id: 6, title: 'Grand Theft Auto V', category: 'Games', year: 2013, status: 'Completed', icon: '🎮' },
  { id: 7, title: 'Marvel’s Spider-Man Remastered', category: 'Games', year: 2022, status: 'Planned', icon: '🕹️' },
  { id: 8, title: 'Python Programming', category: 'Courses', year: 2025, status: 'Watching', icon: '🐍' },
]

const categories = ['All', 'Movies', 'TV Shows', 'Anime', 'Games', 'Courses']

function App() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('checklist-items')
      return saved ? JSON.parse(saved) : initialItems
    } catch {
      return initialItems
    }
  })
const [searchType, setSearchType] = useState('multi')
  const [user, setUser] = useState(null)
  useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
  })

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
  })

  return () => subscription.unsubscribe()
}, [])

async function handleLogout() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    alert(error.message)
  } else {
    setUser(null)
  }
}
    useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
  })

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
  })

  return () => subscription.unsubscribe()
}, [])
async function handleLogout() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    alert(error.message)
  } else {
    setUser(null)
  }
}

const [theme, setTheme] = useState('dark')
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
async function loadCloudItems(currentUser) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', currentUser.id)

  if (error) {
    alert(error.message)
    return
  }

  setItems(data.map(item => ({
    ...item,
    id: item.id,
  })))
}
async function uploadLocalItems(currentUser) {
  const localItems = JSON.parse(
    localStorage.getItem('checklist-items') || '[]'
  )

  const rows = localItems.map(item => ({
    user_id: currentUser.id,
    title: item.title,
    category: item.category,
    year: item.year ? String(item.year) : null,
    status: item.status || 'Planned',
    image: item.image || null,
    rating: item.rating ?? null,
    genres: item.genres || [],
  }))

  const { data: existingItems, error: checkError } = await supabase
  .from('items')
  .select('id')
  .eq('user_id', currentUser.id)

if (checkError) {
  alert(checkError.message)
  return
}

if (existingItems.length > 0) {
  alert('Cloud items already exist. Upload cancelled to prevent duplicates.')
  return
}

const { error } = await supabase
  .from('items')
  .insert(rows)

  if (error) {
    alert(error.message)
  } else {
    alert('Your local items were uploaded to Supabase!')
  }
}

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
const [editTitle, setEditTitle] = useState('')
const [editCategory, setEditCategory] = useState('Movies')
const [editYear, setEditYear] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Movies')


  const [animeQuery, setAnimeQuery] = useState('')
  const [animeResults, setAnimeResults] = useState([])
  const [animeLoading, setAnimeLoading] = useState(false)
  const [animeError, setAnimeError] = useState('')
  const [movieQuery, setMovieQuery] = useState('')
const [movieResults, setMovieResults] = useState([])
const [movieLoading, setMovieLoading] = useState(false)
const [movieError, setMovieError] = useState('')
const [movieType, setMovieType] = useState('multi')
const [gameQuery, setGameQuery] = useState('')
const [gameResults, setGameResults] = useState([])
const [gameLoading, setGameLoading] = useState(false)
const [gameError, setGameError] = useState('')
const [genreFilter, setGenreFilter] = useState('All')
const [addingItems, setAddingItems] = useState([])
const addingItemsRef = useRef(new Set())
const [ratingFilter, setRatingFilter] = useState('All')
const [yearFilter, setYearFilter] = useState('All')

  function updateItems(nextItems) {
    setItems(nextItems)
    localStorage.setItem('checklist-items', JSON.stringify(nextItems))
  }

  async function addItem(e) {
  e.preventDefault()

  if (!newTitle.trim()) return

  const newItem = {
    id: Date.now(),
    title: newTitle.trim(),
    category: newCategory,
    year: new Date().getFullYear(),
    status: 'Planned',
    icon: {
      Movies: '🎬',
      'TV Shows': '📺',
      Anime: '⛩️',
      Games: '🎮',
      Courses: '🎓',
    }[newCategory],
  }
console.log("Current Supabase user:", user)
  if (user) {
    const { error } = await supabase.from('items').insert({
      user_id: user.id,
      title: newItem.title,
      category: newItem.category,
      year: String(newItem.year),
      status: newItem.status,
      image: newItem.image || null,
      rating: newItem.rating ?? null,
      genres: newItem.genres || [],
    })

    if (error) {
      alert(error.message)
      return
    }
  }

  updateItems([...items, newItem])
  setNewTitle('')
  setNewCategory('Movies')
  setShowAddForm(false)
}

  async function handleAnimeSearch(e) {
    e.preventDefault()

    if (!animeQuery.trim()) return

    setAnimeLoading(true)
    setAnimeError('')
    setAnimeResults([])

    try {
      const results = await searchAnime(animeQuery)
      setAnimeResults(results)

      if (results.length === 0) {
        setAnimeError('No anime found. Try another title.')
      }
    } catch (error) {
      setAnimeError(error.message || 'Unable to search anime. Please try again.')
    } finally {
      setAnimeLoading(false)
    }
  }
  
async function handleMovieSearch(e) {
  e.preventDefault()

  if (!movieQuery.trim()) return

  setMovieLoading(true)
  setMovieError('')
  setMovieResults([])

  try {
    const results = await searchTMDB(movieQuery, movieType)
    setMovieResults(results)

    if (results.length === 0) {
      setMovieError('No movies or shows found. Try another search.')
    }
  } catch (error) {
    setMovieError(error.message || 'Unable to search TMDB.')
  } finally {
    setMovieLoading(false)
  }
}
async function handleGameSearch(e) {
  e.preventDefault()

  if (!gameQuery.trim()) return

  setGameLoading(true)
  setGameError('')
  setGameResults([])

  try {
    const results = await searchGames(gameQuery)
    setGameResults(results)

    if (results.length === 0) {
      setGameError('No games found. Try another title.')
    }
  } catch (error) {
    setGameError(error.message || 'Unable to search games. Please try again.')
  } finally {
    setGameLoading(false)
  }
}

async function addMovieToChecklist(movie) {
  const itemKey = String(movie.id)

 const alreadyExists = items.some(
  item =>
    (
      String(item.id) === itemKey ||
      (
        item.category === movie.category &&
        item.title.trim().toLowerCase() === movie.title.trim().toLowerCase()
      )
    )
)

  if (alreadyExists || addingItemsRef.current.has(itemKey)) {
    setMovieError(`"${movie.title}" is already in your checklist.`)
    return
  }

  // Lock immediately to prevent rapid repeated clicks
  addingItemsRef.current.add(itemKey)
  setAddingItems(prev => [...prev, itemKey])

  try {
    let itemToSave = movie

    if (user) {
      const { data, error } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          title: movie.title,
          category: movie.category,
          year: movie.year ? String(movie.year) : null,
          status: movie.status || 'Planned',
          image: movie.image || null,
          rating: movie.rating ?? null,
          genres: movie.genres || [],
        })
        .select()
        .single()

      if (error) throw error

      itemToSave = data
    }

    updateItems([...items, itemToSave])
    setMovieError(`"${movie.title}" added to your checklist.`)

  } catch (error) {
  if (error.code === '23505') {
    setMovieError(`"${movie.title}" is already in your checklist.`)
  } else {
    alert(error.message)
  }
}
}
async function updateExistingTMDBItems() {
  try {
    setMovieError('Updating existing movie and TV details...')

    const updatedItems = await Promise.all(
      items.map(async item => {
        if (
          !['Movies', 'TV Shows'].includes(item.category) ||
          (item.rating != null && item.genres?.length > 0)
        ) {
          return item
        }

        try {
          const details =
            item.tmdbId && item.mediaType
              ? await getTMDBDetails(item.tmdbId, item.mediaType)
              : await getTMDBDetailsByTitle(item.title, item.category)

          if (!details) return item

          return {
            ...item,
            ...details,
          }
        } catch (error) {
          console.error(`Could not update ${item.title}:`, error)
          return item
        }
      })
    )

    updateItems(updatedItems)
    setMovieError('Existing movie and TV details updated!')
  } catch (error) {
    console.error(error)
    setMovieError('Unable to update existing items.')
  }
}



async function addAnimeToChecklist(anime) {
  const itemKey = String(anime.id)

 if (
  items.some(
    item =>
      item.category === 'Anime' &&
      item.title.trim().toLowerCase() === anime.title.trim().toLowerCase()
  ) ||
  addingItemsRef.current.has(itemKey)
) {
    setAnimeError('This anime is already in your checklist.')
    return
  }

  addingItemsRef.current.add(itemKey)
  setAddingItems(prev => [...prev, itemKey])

  try {
    let itemToSave = anime

    if (user) {
      const { data, error } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          title: anime.title,
          category: 'Anime',
          year: anime.year ? String(anime.year) : null,
          status: anime.status || 'Planned',
          image: anime.image || null,
          rating: anime.rating ?? null,
          genres: anime.genres || [],
        })
        .select()
        .single()

      if (error) throw error

      itemToSave = data
    }

    updateItems([...items, itemToSave])
    setAnimeError(`${anime.title} added to your checklist.`)

  } catch (error) {
  if (error.code === '23505') {
    setAnimeError('This anime is already in your checklist.')
  } else {
    alert(error.message)
  }
}
}
 async function changeStatus(item) {
  const nextStatus =
    item.status === 'Completed' ? 'Planned' : 'Completed'

  if (user) {
    const { error } = await supabase
      .from('items')
      .update({ status: nextStatus })
      .eq('user_id', user.id)
      .eq('title', item.title)
      .eq('category', item.category)

    if (error) {
      alert(error.message)
      return
    }
  }

  updateItems(
    items.map(i =>
      i.id === item.id ? { ...i, status: nextStatus } : i
    )
  )
}
 async function deleteItem(itemId) {
  const confirmed = window.confirm(
    'Are you sure you want to delete this item?'
  )

  if (!confirmed) return

  const itemToDelete = items.find(
    item => String(item.id) === String(itemId)
  )

  if (user && itemToDelete) {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('user_id', user.id)
      .eq('title', itemToDelete.title)
      .eq('category', itemToDelete.category)

    if (error) {
      alert(error.message)
      return
    }
  }

  const updatedItems = items.filter(
    item => String(item.id) !== String(itemId)
  )

  updateItems(updatedItems)
}

function pickRandomItem() {
  const plannedItems = items.filter(item => item.status === 'Planned')

  if (plannedItems.length === 0) {
    alert('No planned items available!')
    return
  }

  const randomIndex = Math.floor(Math.random() * plannedItems.length)
  const selectedItem = plannedItems[randomIndex]

  alert(`Your random pick is: ${selectedItem.title}`)
}
function startEditing(item) {
  setEditingItem(item)
  setEditTitle(item.title)
  setEditCategory(item.category)
  setEditYear(item.year || '')
}
async function handleAuth(e) {
  e.preventDefault()

  if (authMode === 'signup') {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

  if (error) {
  alert(error.message)
} else {
  const { data } = await supabase.auth.getUser()
  setUser(data.user)
  alert('Logged in successfully!')
}
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

   if (error) {
  alert(error.message)
} else {
  const { data } = await supabase.auth.getUser()
  setUser(data.user)
  await loadCloudItems(data.user)
  alert('Logged in successfully!')
}
  }
}
async function saveEditedItem(e) {
  e.preventDefault()

  if (!editTitle.trim()) return

  const updatedItem = {
    ...editingItem,
    title: editTitle.trim(),
    category: editCategory,
    year: editYear,
  }

  if (user) {
    const { error } = await supabase
      .from('items')
      .update({
        title: updatedItem.title,
        category: updatedItem.category,
        year: String(updatedItem.year),
      })
      .eq('user_id', user.id)
      .eq('title', editingItem.title)
      .eq('category', editingItem.category)

    if (error) {
      alert(error.message)
      return
    }
  }

  const updatedItems = items.map(item =>
    item.id === editingItem.id ? updatedItem : item
  )

  updateItems(updatedItems)
  setEditingItem(null)
}


 
const filtered = items
  .filter(item =>
    (category === 'All' || item.category === category) &&
    (status === 'All' || item.status === status) &&
    item.title.toLowerCase().includes(search.toLowerCase()) &&

    (category !== 'Games' || genreFilter === 'All' ||
      item.genres?.includes(genreFilter)) &&

    (category !== 'Games' || ratingFilter === 'All' ||
      (item.rating != null &&
        item.rating >= Number(ratingFilter))) &&

    (category !== 'Games' || yearFilter === 'All' ||
      String(item.year) === yearFilter)
  )
 .sort((a, b) => {
  if (sortBy === 'title') {
    return a.title.localeCompare(b.title)
  }

  if (sortBy === 'year') {
    return Number(b.year || 0) - Number(a.year || 0)
  }

  if (sortBy === 'rating') {
    return Number(b.rating ?? -1) - Number(a.rating ?? -1)
  }

  if (sortBy === 'year-oldest') {
    return Number(a.year || 9999) - Number(b.year || 9999)
  }

  return Number(b.id) - Number(a.id)
})
  const completed = items.filter(i => i.status === 'Completed').length
  const inProgress = items.filter(i => i.status === 'Watching').length
  const progress = items.length
    ? Math.round((completed / items.length) * 100)
    : 0
      const progressMessage =
  items.length === 0
    ? 'Add your first item to get started!'
    : progress === 100
      ? 'Amazing! You completed everything!'
      : progress >= 75
        ? 'Almost there! Keep up the great work.'
        : progress >= 40
          ? 'Great progress! Keep going.'
          : 'Every journey starts with one step.'
      const categoryStats = categories
  .filter(category => category !== 'All')
  .map(category => {
    const categoryItems = items.filter(
      item => item.category === category
    )

    const categoryCompleted = categoryItems.filter(
      item => item.status === 'Completed'
    ).length

    return {
      name: category,
      count: categoryItems.length,
      completed: categoryCompleted,
      progress: categoryItems.length
        ? Math.round(
            (categoryCompleted / categoryItems.length) * 100
          )
        : 0,
    }
  })
  return (
    <div className={`app-shell ${theme}-theme`}>
      {!user ? (
  <div className="auth-screen">
    <form className="auth-card" onSubmit={handleAuth}>
      <h1>TrackIt</h1>
      <p>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</p>

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email address"
        required
      />

      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        minLength={6}
        required
      />

      <button type="submit">
        {authMode === 'signup' ? 'Sign Up' : 'Log In'}
      </button>

      <button
        type="button"
        onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
      >
        {authMode === 'signup'
          ? 'Already have an account? Log in'
          : 'Need an account? Sign up'}
      </button>
    </form>
  </div>
) : (
      <>
      
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">✦</span> TrackIt
        </div>

        <p className="nav-heading">YOUR LIBRARY</p>

        {categories.map(c => (
          <button
            key={c}
            className={`nav-item ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            <span>
              {({
                All: '◈',
                Movies: '🎬',
                'TV Shows': '📺',
                Anime: '⛩️',
                Games: '🎮',
                Courses: '🎓',
              })[c]}
            </span>
            {c}
            {c === 'All' && (
              <span className="nav-count">{items.length}</span>
            )}
          </button>
        ))}

        <div className="sidebar-note">
          <span>✧</span>
          <p>Your next favourite thing is waiting to be discovered.</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">YOUR PERSONAL UNIVERSE</span>
            <h1>My Checklist</h1>
          </div>
          <div className="topbar-actions">
            <button
  type="button"
  className="theme-toggle"
  onClick={handleLogout}
>
  Log Out
</button>
  <button
    type="button"
    className="theme-toggle"
    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
  >
    {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
  </button>

  <div className="profile">M</div>
</div>
        </header>

        <section className="welcome">
          <div>
            <span className="eyebrow">WELCOME BACK</span>
            <h2>
              Keep track of what you love<span>.</span>
            </h2>
            <p>
              One place for every story, game and skill you want to explore.
            </p>
          </div>
          <div className="welcome-star">✦</div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <span>Total in library</span>
            <strong>{items.length}</strong>
            <small>Across all categories</small>
          </div>

          <div className="stat-card">
            <span>Completed</span>
            <strong>{completed}</strong>
            <small>Things you've finished</small>
          </div>

          <div className="stat-card">
            <span>In progress</span>
            <strong>{inProgress}</strong>
            <small>Currently exploring</small>
          </div>

         <div className="stat-card">
  <span>Overall progress</span>
  <strong>{progress}%</strong>
  <div className="progress-track">
    <div style={{ width: `${progress}%` }} />
  </div>
  <small>{progressMessage}</small>
</div>
        </section>
        <section className="category-stats-section">
  <div className="section-heading">
    <div>
      <span className="eyebrow">YOUR BREAKDOWN</span>
      <h2>Library by category</h2>
    </div>
  </div>

  <div className="category-stats-grid">
    {categoryStats.map(category => (
      <div className="category-stat-card" key={category.name}>
        <span>{category.name}</span>
        <strong>{category.count}</strong>
        <small>
  {category.completed} of {category.count} completed
</small>
        <div className="category-progress-track">
          <div
            style={{
              width: `${
                items.length
                  ? (category.count / items.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>
    ))}
  </div>
</section>
<section className="anime-search-section">
  <div>
    <span className="eyebrow">DISCOVER</span>
    <h2>Find your next watch</h2>
    <p>Search movies, TV shows, and anime from one place.</p>
  </div>

  <form
    className="anime-search-form"
    onSubmit={async (e) => {
      e.preventDefault();

     if (searchType === 'anime') {
  await handleAnimeSearch(e);
} else if (searchType === 'game') {
  await handleGameSearch(e);
} else {
  await handleMovieSearch(e);
}
    }}
  >
    <input
      value={
  searchType === 'anime'
    ? animeQuery
    : searchType === 'game'
      ? gameQuery
      : movieQuery
}
     onChange={(e) => {
  const value = e.target.value

  if (searchType === 'anime') {
    setAnimeQuery(value)
  } else if (searchType === 'game') {
    setGameQuery(value)
  } else {
    setMovieQuery(value)
  }
}}
      placeholder="Search movies, TV shows, or anime..."
      required
    />

<select
  value={searchType}
  onChange={(e) => {
    const value = e.target.value
    setSearchType(value)

    if (['multi', 'movie', 'tv'].includes(value)) {
      setMovieType(value)
    }
  }}
>
  <option value="multi">Movies & TV Shows</option>
  <option value="anime">Anime</option>
  <option value="game">Games</option>
  <option value="movie">Movies only</option>
  <option value="tv">TV shows only</option>
</select>

    <button
      type="submit"
      disabled={searchType === 'anime' ? animeLoading : movieLoading}
    >
      {
  (
    searchType === 'anime'
      ? animeLoading
      : searchType === 'game'
        ? gameLoading
        : movieLoading
  )
    ? 'Searching...'
    : 'Search'
}
    </button>
  </form>

  {animeError && searchType === 'anime' && (
    <p className="anime-error" role="status">{animeError}</p>
  )}

  {movieError && searchType !== 'anime' && (
    <p className="anime-error" role="status">{movieError}</p>
  )}
{searchType === 'game' && gameError && (
  <p className="anime-error" role="status">{gameError}</p>
)}
  {searchType === 'anime' && (
    <div className="anime-results">
      {animeResults.map(anime => (
        <article className="anime-result-card" key={anime.id}>
          {anime.image && (
            <img src={anime.image} alt={anime.title} />
          )}

         <div className="anime-result-info">
  <h3>{anime.title}</h3>

  <p>Category: Anime</p>
  <p>Episodes: {anime.episodes ?? 'Unknown'}</p>

 {Number.isFinite(Number(anime.score)) && Number(anime.score) > 0 && (
  <p>⭐ Rating: {Number(anime.score).toFixed(1)}/100</p>
)}

  {anime.genres?.length > 0 && (
    <p>Genres: {anime.genres.join(', ')}</p>
  )}

  <button
    type="button"
    onClick={() => addAnimeToChecklist(anime)}
  >
    + Add to Checklist
  </button>
</div>
        </article>
      ))}
    </div>
  )}
{searchType === 'game' && (
  <div className="anime-results">
    {gameResults.map(game => (
      <article className="anime-result-card" key={game.id}>
        {game.image && (
          <img src={game.image} alt={game.title} />
        )}

        <div className="anime-result-info">
          <h3>{game.title}</h3>

          <p>Category: Games</p>

          <p>📅 Release year: {game.year || 'Unknown'}</p>

          {game.rating != null && (
            <p>⭐ Rating: {Number(game.rating).toFixed(1)}/10</p>
          )}

          {game.genres?.length > 0 && (
            <p>🎭 Genres: {game.genres.join(', ')}</p>
          )}

         <button
  type="button"
  disabled={addingItems.includes(String(game.id))}
  onClick={() => addMovieToChecklist(game)}
>
  {addingItems.includes(String(game.id))
    ? 'Adding...'
    : '+ Add to Checklist'}
</button>
        </div>
      </article>
    ))}
  </div>
)}
  {searchType !== 'anime' && (
    <div className="anime-results">
      {movieResults.map(movie => (
        <article className="anime-result-card" key={movie.id}>
          {movie.image && (
            <img src={movie.image} alt={movie.title} />
          )}

         <div className="anime-result-info">
  <h3>{movie.title}</h3>

  <p>Category: {movie.category || 'Movie / TV'}</p>
  <p>Year: {movie.year || 'Unknown'}</p>

  {movie.rating != null && (
    <p>⭐ Rating: {Number(movie.rating).toFixed(1)}/10</p>
  )}

  {movie.genres?.length > 0 && (
    <p>Genres: {movie.genres.join(', ')}</p>
  )}

  <button
    type="button"
    onClick={() => addMovieToChecklist(movie)}
  >
    + Add to Checklist
  </button>
</div>
        </article>
      ))}
    </div>
  )}
</section>


        <section className="library-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR COLLECTION</span>
              <h2>Explore your library</h2>
            </div>

            <div className="heading-actions">
              <span className="result-count">
                {filtered.length} items
              </span>
<button
  type="button"
  className="add-item-button"
  onClick={pickRandomItem}
>
  🎲 Random Pick
</button>
             <button
  className="add-item-button"
  onClick={updateExistingTMDBItems}
>
  ↻ Update Details
</button>

<button
  className="add-item-button"
  onClick={() => setShowAddForm(!showAddForm)}
>
  + Add Item
</button>
            </div>
          </div>

          {showAddForm && (
            <form className="add-item-form" onSubmit={addItem}>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Enter movie, anime, course or game name"
                required
              />

              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
              >
                <option value="Movies">Movies</option>
                <option value="TV Shows">TV Shows</option>
                <option value="Anime">Anime</option>
                <option value="Games">Games</option>
                <option value="Courses">Courses</option>
              </select>

              <button type="submit" className="add-item-button">
                Save Item
              </button>
            </form>
          )}

         
<div className="toolbar">
  <div className="search-box">
    <span>⌕</span>
    <input
      value={search}
      onChange={e => setSearch(e.target.value)}
      placeholder="Search your collection..."
    />
    {search && (
      <button
        type="button"
        className="clear-search-button"
        onClick={() => setSearch('')}
      >
        Clear
      </button>
    )}
  </div>

  <select
    aria-label="Filter by status"
    value={status}
    onChange={e => setStatus(e.target.value)}
  >
    <option value="All">All statuses</option>
    <option value="Planned">Planned</option>
    <option value="Completed">Completed</option>
  </select>

  <label className="sort-control">
    <span>Sort:</span>
    <select
  aria-label="Sort collection"
  value={sortBy}
  onChange={e => setSortBy(e.target.value)}
>
  <option value="newest">Newest added</option>
  <option value="title">Title (A–Z)</option>
  <option value="year">Year (newest first)</option>

  {category === 'Games' && (
    <>
      <option value="rating">Highest rated</option>
      <option value="year-oldest">Oldest release</option>
    </>
  )}
</select>
  </label>
</div>
{category === 'Games' && (
  <div className="toolbar game-filters">

    <select
      value={genreFilter}
      onChange={e => setGenreFilter(e.target.value)}
    >
      <option value="All">All Genres</option>
      {[...new Set(
        items
          .filter(item => item.category === 'Games')
          .flatMap(item => item.genres || [])
      )].sort().map(genre => (
        <option key={genre} value={genre}>{genre}</option>
      ))}
    </select>

    <select
      value={ratingFilter}
      onChange={e => setRatingFilter(e.target.value)}
    >
      <option value="All">All Ratings</option>
      <option value="7">7+ Rating</option>
      <option value="8">8+ Rating</option>
      <option value="9">9+ Rating</option>
    </select>

    <select
      value={yearFilter}
      onChange={e => setYearFilter(e.target.value)}
    >
      <option value="All">All Years</option>
      {[...new Set(
        items
          .filter(item => item.category === 'Games' && item.year)
          .map(item => String(item.year))
      )].sort((a, b) => Number(b) - Number(a)).map(year => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>

    <button
      type="button"
      onClick={() => {
        setGenreFilter('All')
        setRatingFilter('All')
        setYearFilter('All')
      }}
    >
      Reset Filters
    </button>

  </div>
)}

          <div className="category-pills">
            {categories.map(c => (
              <button
                key={c}
                className={category === c ? 'pill selected' : 'pill'}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="item-grid">
            {filtered.map(item => (
              <article className="item-card" key={item.id}>
                <div
                  className={`item-art art-${item.category
                    .toLowerCase()
                    .replace(' ', '-')}`}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <span>{item.icon}</span>
                  )}
                  <small>{item.year || '—'}</small>
                </div>

<div className="item-info">
  {editingItem?.id === item.id ? (
    <form className="edit-item-form" onSubmit={saveEditedItem}>
      <input
        type="text"
        value={editTitle}
        onChange={e => setEditTitle(e.target.value)}
        placeholder="Item title"
        required
      />

      <select
        value={editCategory}
        onChange={e => setEditCategory(e.target.value)}
      >
        <option value="Movies">Movies</option>
        <option value="TV Shows">TV Shows</option>
        <option value="Anime">Anime</option>
        <option value="Games">Games</option>
        <option value="Courses">Courses</option>
      </select>

      <input
        type="text"
        value={editYear}
        onChange={e => setEditYear(e.target.value)}
        placeholder="Year"
      />

      <button type="submit">Save</button>

      <button
        type="button"
        onClick={() => setEditingItem(null)}
      >
        Cancel
      </button>
    </form>
  ) : (
    <>
      <span className="item-category">{item.category}</span>

      <h3>{item.title}</h3>

      {item.rating != null && (
        <div className="item-rating">
          ⭐ {item.category === 'Anime'
            ? `${item.rating}/100`
            : `${Number(item.rating).toFixed(1)}/10`}
        </div>
      )}

    {item.genres?.length > 0 && (
  <div className="item-genres">
    {item.genres.slice(0, 3).join(', ')}
  </div>
)}

      <div className="item-bottom">
        <span className={`status status-${item.status.toLowerCase()}`}>
          {item.status}
        </span>

        <button
          className="check-button"
          aria-label={`Mark ${item.title} ${
            item.status === 'Completed' ? 'planned' : 'completed'
          }`}
          onClick={() => changeStatus(item)}
        >
          {item.status === 'Completed' ? '✓' : '+'}
        </button>

        <button
          type="button"
          className="edit-button"
          onClick={() => startEditing(item)}
        >
          Edit
        </button>

        <button
          type="button"
          className="delete-button"
          onClick={() => deleteItem(item.id)}
        >
          Delete
        </button>
      </div>
    </>
  )}
</div>
              </article>
            ))}
          </div>
        </section>
         </main>
  </>
  )}
  </div>
  )
}3
         export default App      