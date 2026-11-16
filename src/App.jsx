import { useState, useEffect, useRef } from 'react'
import './App.css'
import { searchAnime } from './animeApi'
import { searchGames } from './gamesApi'
import {
  extractPdfText,
  parseCoursesFromText,
} from './curriculumParser'
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
  let isMounted = true

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!isMounted) return

    setUser(session?.user ?? null)

    if (session?.user) {
      loadCloudItems(session.user)
    }
  })

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!isMounted) return

    setUser(session?.user ?? null)

    if (session?.user) {
      setTimeout(() => {
        if (isMounted) {
          loadCloudItems(session.user)
        }
      }, 0)
    }
  })

  return () => {
    isMounted = false
    subscription.unsubscribe()
  }
}, [])


async function handleLogout() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    showNotification(error.message, 'error')
  } else {
    setUser(null)
    showNotification('Logged out successfully.', 'success')
  }
}
const [showDiscover, setShowDiscover] = useState(true)
const [deleteConfirmation, setDeleteConfirmation] = useState(null)
const [importingBackup, setImportingBackup] = useState(false)
const backupFileRef = useRef(null)
const [notification, setNotification] = useState(null)
const [theme, setTheme] = useState('dark')
  const [category, setCategory] = useState('All')
  useEffect(() => {
  setMovieQuery('')
  setAnimeQuery('')
  setGameQuery('')

  setMovieResults([])
  setAnimeResults([])
  setGameResults([])
  setMovieError('')
setAnimeError('')
setGameError('')
if (category === 'Anime') {
  setSearchType('anime')
} else if (category === 'Games') {
  setSearchType('game')
} else if (category === 'Movies') {
  setSearchType('movie')
  setMovieType('movie')
} else if (category === 'TV Shows') {
  setSearchType('tv')
  setMovieType('tv')
} else {
  setSearchType('multi')
  setMovieType('multi')
}}, [category])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [curriculumFile, setCurriculumFile] = useState(null)
const [curriculumText, setCurriculumText] = useState('')
const [curriculumLoading, setCurriculumLoading] = useState(false)
const [curriculumError, setCurriculumError] = useState('')
const [parsedCourses, setParsedCourses] = useState([])
const [curriculumSaving, setCurriculumSaving] = useState(false)
const [curriculumCourses, setCurriculumCourses] = useState([])
const [curriculumSearch, setCurriculumSearch] = useState('')
const [activeCurriculumId, setActiveCurriculumId] = useState(null)

const [openElectiveCode, setOpenElectiveCode] = useState('')
const [openElectiveName, setOpenElectiveName] = useState('')
const [openElectiveCredits, setOpenElectiveCredits] = useState('3')
const [openElectiveSaving, setOpenElectiveSaving] = useState(false)
const [openElectiveMessage, setOpenElectiveMessage] = useState('')
const [curriculumRequiredCredits, setCurriculumRequiredCredits] = useState(160)
const [password, setPassword] = useState('')
const [expandedSections, setExpandedSections] = useState({
  'School Core': false,
  'Program Core': false,
  'Discipline Electives': false,
  'Open Electives': false,
  'Non-Credit Courses': false,
})
async function loadCloudItems(currentUser) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', currentUser.id)

  if (error) {
    showNotification(error.message, 'error')
    return
  }

  setItems(data.map(item => ({
    ...item,
    id: item.id,
  })))

  await loadCurriculumCourses(currentUser)
}

async function loadCurriculumCourses(currentUser) {
  const { data: curriculum, error: curriculumError } = await supabase
    .from('student_curricula')
    .select('id, curriculum_name, curriculum_version, total_required_credits')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (curriculumError) {
    console.error('Could not load curriculum:', curriculumError)
    return
  }

 if (!curriculum) {
  setActiveCurriculumId(null)
  setCurriculumCourses([])
  return
}

setActiveCurriculumId(curriculum.id)
  const { data: courses, error: coursesError } = await supabase
    .from('student_curriculum_courses')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('curriculum_id', curriculum.id)
    .order('course_code')

  if (coursesError) {
    console.error('Could not load curriculum courses:', coursesError)
    return
  }

  setCurriculumRequiredCredits(curriculum.total_required_credits || 160)
  setCurriculumCourses(courses || [])
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
    showNotification(checkError.message, 'error')
    return
  }

  if (existingItems.length > 0) {
   showNotification(
  'Cloud items already exist. Upload cancelled to prevent duplicates.',
  'warning',
  'Upload cancelled'
)
    return
  }

  const { error } = await supabase
    .from('items')
    .insert(rows)

  if (error) {
    showNotification(error.message, 'error')
  } else {
    showNotification(
      'Your local items were uploaded to Supabase!',
      'success'
    )
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
  showNotification(error.message, 'error')
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
  
async function handleMovieSearch(e, selectedType = movieType) {
  e.preventDefault()

  if (!movieQuery.trim()) return

  setMovieLoading(true)
  setMovieError('')
  setMovieResults([])

  try {
    const results = await searchTMDB(movieQuery, selectedType)
    setMovieResults(results)

    if (results.length === 0) {
      setMovieError(
        selectedType === 'movie'
          ? 'No movies found. Try another search.'
          : selectedType === 'tv'
            ? 'No TV shows found. Try another search.'
            : 'No movies or shows found. Try another search.'
      )
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


async function handleCurriculumUpload(e) {
  const file = e.target.files?.[0]

  if (!file) return

  setCurriculumFile(file)
  setCurriculumError('')
  setCurriculumText('')
  setParsedCourses([])
  setCurriculumLoading(true)

  try {
    const extractedText = await extractPdfText(file)

    if (!extractedText.trim()) {
      throw new Error('No readable text found in this PDF.')
    }

    const courses = parseCoursesFromText(extractedText)

    if (courses.length === 0) {
      throw new Error(
        'No courses detected. Please check the PDF format.'
      )
    }

    setCurriculumText(extractedText)
    setParsedCourses(courses)
  } catch (error) {
    setCurriculumError(
      error.message || 'Unable to process curriculum PDF.'
    )
  } finally {
    setCurriculumLoading(false)
  }
}


async function handleImportCurriculum() {
  if (!user) {
    setCurriculumError('Please log in before importing your curriculum.')
    return
  }

  if (!parsedCourses.length) {
    setCurriculumError('Upload and review a curriculum PDF first.')
    return
  }

  setCurriculumSaving(true)
  setCurriculumError('')

  let createdCurriculumId = null

  try {
    const firstTitleLine = curriculumText
      .split('\n')
      .map(line => line.trim())
      .find(line => /B\.Tech|Bachelor of Technology/i.test(line))

    const versionMatch = curriculumText.match(
      /Curriculum\s+Version\s*[:.]?\s*([0-9.]+)/i
    )

    const curriculumName =
      firstTitleLine ||
      curriculumFile?.name?.replace(/\.pdf$/i, '') ||
      'Uploaded Curriculum'

    const { data: curriculum, error: curriculumError } = await supabase
      .from('student_curricula')
      .insert({
        user_id: user.id,
        curriculum_name: curriculumName,
        curriculum_version: versionMatch?.[1] || null,
        total_required_credits: 160,
      })
      .select('id')
      .single()

    if (curriculumError) throw curriculumError

    createdCurriculumId = curriculum.id

    const courseRows = parsedCourses.map(course => ({
      curriculum_id: curriculum.id,
      user_id: user.id,
      course_code: course.code,
      course_name: course.title,
      main_section: course.mainSection || null,
      subsection: course.subsection || course.basket || null,
      credits: Number(course.credits) || 0,
      theory: Number(course.theory) || 0,
      practical: Number(course.practical) || 0,
      status: course.status === 'Completed' ? 'Completed' : 'Planned',
    }))

    const { error: coursesError } = await supabase
      .from('student_curriculum_courses')
      .insert(courseRows)

    if (coursesError) throw coursesError

    await loadCurriculumCourses(user)
    setCurriculumError(
      `Successfully imported ${courseRows.length} courses into your account.`
    )
  } catch (error) {
    if (createdCurriculumId) {
      await supabase
        .from('student_curricula')
        .delete()
        .eq('id', createdCurriculumId)
        .eq('user_id', user.id)
    }

    console.error('Curriculum import failed:', error)
    setCurriculumError(
      error.message || 'Unable to import curriculum. Please try again.'
    )
  } finally {
    setCurriculumSaving(false)
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
    showNotification(error.message, 'error')
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
    showNotification(error.message, 'error')
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
  showNotification(error.message, 'error')
  return
}
  }

  updateItems(
    items.map(i =>
      i.id === item.id ? { ...i, status: nextStatus } : i
    )
  )
}
function deleteItem(itemId) {
  setDeleteConfirmation(itemId)
}

async function confirmDelete() {
  const itemId = deleteConfirmation

  const itemToDelete = items.find(
    item => String(item.id) === String(itemId)
  )

  if (user && itemToDelete) {
    const { data: deletedRows, error } = await supabase
  .from('items')
  .delete()
  .eq('user_id', user.id)
  .eq('title', itemToDelete.title)
  .eq('category', itemToDelete.category)
  .select('id')

if (error) {
  showNotification(error.message, 'error')
  setDeleteConfirmation(null)
  return
}

if (!deletedRows || deletedRows.length === 0) {
  showNotification(
    'No cloud record was deleted. Check your Supabase permissions.',
    'error',
    'Cloud deletion failed'
  )
  setDeleteConfirmation(null)
  return
}
  }

  const updatedItems = items.filter(
    item => String(item.id) !== String(itemId)
  )

  updateItems(updatedItems)
  setDeleteConfirmation(null)
}

function pickRandomItem() {
  const plannedItems = items.filter(item => item.status === 'Planned')

  if (plannedItems.length === 0) {
    showNotification(
  'No planned items available!',
  'warning',
  'Nothing to pick'
)
    return
  }

  const randomIndex = Math.floor(Math.random() * plannedItems.length)
  const selectedItem = plannedItems[randomIndex]

  showNotification(
    `Your random pick is: ${selectedItem.title}`,
    'success'
  )
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
  showNotification(error.message, 'error')
} else {
  const { data } = await supabase.auth.getUser()
  setUser(data.user)
  showNotification('Account created successfully!', 'success')
}
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

   if (error) {
  showNotification(error.message, 'error')
} else {
  const { data } = await supabase.auth.getUser()
  setUser(data.user)
  showNotification('Logged in successfully!', 'success')
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
  showNotification(error.message, 'error')
  return
}
  }

  const updatedItems = items.map(item =>
    item.id === editingItem.id ? updatedItem : item
  )

  updateItems(updatedItems)
  setEditingItem(null)
}


 
async function toggleCourse(course) {
  const nextStatus =
    course.status === 'Completed' ? 'Planned' : 'Completed'

  // Prevent Open Elective credits from exceeding 18
  if (
    nextStatus === 'Completed' &&
    course.main_section === 'Discipline Electives' &&
    Object.prototype.hasOwnProperty.call(
      specializedCaps,
      course.subsection
    )
  ) {
    const currentOverflow = specializedOverflow

    const basketLimit = specializedCaps[course.subsection]

    const completedInBasket = curriculumCourses
      .filter(
        item =>
          item.status === 'Completed' &&
          item.main_section === 'Discipline Electives' &&
          item.subsection === course.subsection
      )
      .reduce(
        (total, item) => total + Number(item.credits || 0),
        0
      )

    const additionalOverflow =
      Math.max(0, completedInBasket + Number(course.credits || 0) - basketLimit) -
      Math.max(0, completedInBasket - basketLimit)

    const directOpenCredits = curriculumCourses
      .filter(
        item =>
          item.status === 'Completed' &&
          item.main_section === 'Open Electives'
      )
      .reduce(
        (total, item) => total + Number(item.credits || 0),
        0
      )

    if (directOpenCredits + currentOverflow + additionalOverflow > 18) {
showNotification(
  'Cannot complete this course. Open Electives would exceed 18 credits.',
  'warning',
  'Credit limit reached'
)
      return
    }
  }

  // Save to Supabase first
  const { error } = await supabase
    .from('student_curriculum_courses')
    .update({ status: nextStatus })
    .eq('id', course.id)
    .eq('user_id', user.id)

  if (error) {
  showNotification(error.message, 'error')
  return
}
  // Update the interface
  setCurriculumCourses(previous =>
    previous.map(item =>
      item.id === course.id
        ? { ...item, status: nextStatus }
        : item
    )
  )
}

async function addOpenElective(e) {
  e.preventDefault()
  setOpenElectiveMessage('')

  if (!user || !activeCurriculumId) {
    setOpenElectiveMessage(
      'Please upload and import your curriculum first.'
    )
    return
  }
    
  const code = openElectiveCode.trim().toUpperCase()
  const name = openElectiveName.trim()
  const credits = Number(openElectiveCredits)

  if (!code || !name || !Number.isInteger(credits) || credits < 1) {
    setOpenElectiveMessage('Enter a valid course code, name and credit value.')
    return
  }

  const duplicate = curriculumCourses.some(
    course => course.course_code?.trim().toUpperCase() === code
  )

  if (duplicate) {
    setOpenElectiveMessage('This course code already exists in your curriculum.')
    return
  }

  const existingOpenCourses = curriculumCourses.filter(
    course => course.main_section === 'Open Electives'
  )

  const alreadyAllocated = sumCredits(existingOpenCourses)
  const remainingCredits = Math.max(
    0,
    18 - alreadyAllocated - specializedOverflow
  )

  if (credits > remainingCredits) {
    setOpenElectiveMessage(
      `Only ${remainingCredits} C remaining in Open Electives.`
    )
    return
  }

  setOpenElectiveSaving(true)

  try {
    const { data, error } = await supabase
      .from('student_curriculum_courses')
      .insert({
        curriculum_id: activeCurriculumId,
        user_id: user.id,
        course_code: code,
        course_name: name,
        main_section: 'Open Electives',
        subsection: 'Manual Open Electives',
        credits,
        theory: 0,
        practical: 0,
        status: 'Planned',
      })
      .select()
      .single()

    if (error) throw error

    setCurriculumCourses(previous => [...previous, data])

    setOpenElectiveCode('')
    setOpenElectiveName('')
    setOpenElectiveCredits('3')
    setOpenElectiveMessage('Open Elective added successfully.')
  } catch (error) {
    console.error('Open Elective save failed:', error)
    setOpenElectiveMessage(
      error.message || 'Unable to save Open Elective.'
    )
  } finally {
    setOpenElectiveSaving(false)
  }
} 

function showNotification(message, type = 'warning', title = '') {
  setNotification({ message, type, title })

  setTimeout(() => {
    setNotification(null)
  }, 4000)
}

const filtered = items
  .filter(item =>
    (category === 'All' || item.category === category) &&
    (category !== 'Movies' || item.category === 'Movies') &&
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
const selectedCategoryItems =
  category === 'All'
    ? items
    : items.filter(item => item.category === category)

const selectedCategoryCompleted = selectedCategoryItems.filter(
  item => item.status === 'Completed'
).length

const selectedCategoryPlanned = selectedCategoryItems.filter(
  item => item.status === 'Planned'
).length

const selectedCategoryProgress = selectedCategoryItems.length
  ? Math.round(
      (selectedCategoryCompleted / selectedCategoryItems.length) * 100
    )
  : 0
  const completed = items.filter(i => i.status === 'Completed').length
  const inProgress = items.filter(i => i.status === 'Watching').length
  const progress = items.length
    ? Math.round((completed / items.length) * 100)
    : 0

// Completed curriculum courses
const completedCourses = curriculumCourses.filter(
  course => course.status === 'Completed'
)

// Credit requirements from the official curriculum PDF
const curriculumRequirements = {
  'School Core': 58,
  'Program Core': 41,
  'Discipline Electives': 43,
  'Open Electives': 18,
}

// Maximum credits counted in each specialized elective basket
const specializedCaps = {
  'AI & ML': 12,
  'Cyber Security': 3,
  'Data Analytics': 3,
  'IoT': 3,
  'Cloud Computing': 3,
  'Robotics': 3,
  'Big Data': 0,
  'Full Stack Development': 3,
  'DevOps': 3,
}

// Helper to calculate completed credits
const sumCredits = courses =>
  courses.reduce(
    (total, course) => total + Number(course.credits || 0),
    0
  )

// School Core
const schoolCoreEarned = Math.min(
  sumCredits(completedCourses.filter(
    course => course.main_section === 'School Core'
  )),
  58
)

// Program Core
const programCoreEarned = Math.min(
  sumCredits(completedCourses.filter(
    course => course.main_section === 'Program Core'
  )),
  41
)

// Common Electives: maximum 10 credits
const commonElectiveCourses = completedCourses.filter(
  course =>
    course.main_section === 'Discipline Electives' &&
    course.subsection === 'Common Electives'
)

const commonElectiveEarned = Math.min(
  sumCredits(commonElectiveCourses),
  10
)

// Calculate specialized elective credits basket by basket
const specializedEarnedByBasket = {}
const specializedCountedByBasket = {}
let specializedOverflow = 0

Object.entries(specializedCaps).forEach(([basket, limit]) => {
  const basketCourses = completedCourses.filter(
    course =>
      course.main_section === 'Discipline Electives' &&
      course.subsection === basket
  )

  const earned = sumCredits(basketCourses)
  const counted = Math.min(earned, limit)

  specializedEarnedByBasket[basket] = earned
  specializedCountedByBasket[basket] = counted

  // Excess credits move to Open Electives
  specializedOverflow += Math.max(0, earned - limit)
})

// Specialized Electives: maximum 33 credits
const specializedCounted = Object.values(
  specializedCountedByBasket
).reduce((total, credits) => total + credits, 0)

// Discipline Electives: Common + Specialized
const disciplineEarned = Math.min(
  commonElectiveEarned + specializedCounted,
  43
)

// Open Electives include:
// 1. Completed courses directly assigned to Open Electives
// 2. Excess credits from specialized elective baskets
const directOpenElectiveCredits = sumCredits(
  completedCourses.filter(
    course => course.main_section === 'Open Electives'
  )
)

const openElectiveEarned = Math.min(
  directOpenElectiveCredits + specializedOverflow,
  18
)

// Total credits counted towards the 160-credit requirement
const completedCredits =
  schoolCoreEarned +
  programCoreEarned +
  disciplineEarned +
  openElectiveEarned

// Dashboard groups
const curriculumGroups = [
  {
    name: 'School Core',
    required: 58,
    earned: schoolCoreEarned,
    courses: curriculumCourses.filter(
      course => course.main_section === 'School Core'
    ),
  },
  {
    name: 'Program Core',
    required: 41,
    earned: programCoreEarned,
    courses: curriculumCourses.filter(
      course => course.main_section === 'Program Core'
    ),
  },
  {
    name: 'Discipline Electives',
    required: 43,
    earned: disciplineEarned,
    courses: curriculumCourses.filter(
      course => course.main_section === 'Discipline Electives'
    ),
  },
  {
    name: 'Open Electives',
    required: 18,
    earned: openElectiveEarned,
    courses: curriculumCourses.filter(
      course => course.main_section === 'Open Electives'
    ),
  },
  {
    name: 'Non-Credit Courses',
    required: null,
    earned: 0,
    courses: curriculumCourses.filter(
      course => course.main_section === 'Non-Credit Courses'
    ),
  },
]


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
    const isCourses = category === 'Courses'

    const categoryItems = items.filter(
      item => item.category === category
    )

    const categoryCount = isCourses
      ? curriculumGroups.reduce(
          (total, group) => total + (group.required || 0),
          0
        )
      : categoryItems.length

    const categoryCompleted = isCourses
      ? completedCredits
      : categoryItems.filter(
          item => item.status === 'Completed'
        ).length

    return {
      name: category,
      count: categoryCount,
      completed: categoryCompleted,
      progress: categoryCount
        ? Math.round(
            (categoryCompleted / categoryCount) * 100
          )
        : 0,
    }
  })
  const exportJSON = () => {
  const backupData = {
    app: 'TrackIt',
    version: 1,
    exportedAt: new Date().toISOString(),
    items,
    curriculumCourses,
  }

  const blob = new Blob(
    [JSON.stringify(backupData, null, 2)],
    { type: 'application/json' }
  )

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'trackit-backup.json'
  link.click()

  URL.revokeObjectURL(url)
}

const importJSON = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  setImportingBackup(true)

  try {
    const backup = JSON.parse(await file.text())

    if (
      backup.app !== 'TrackIt' ||
      !Array.isArray(backup.items) ||
      !Array.isArray(backup.curriculumCourses)
    ) {
      throw new Error('Invalid TrackIt backup file.')
    }

    // Find items not already in the library
    const newItems = backup.items.filter(imported =>
      !items.some(existing =>
        existing.title?.trim().toLowerCase() ===
          imported.title?.trim().toLowerCase() &&
        existing.category === imported.category
      )
    )

    if (user && newItems.length) {
      const rows = newItems.map(item => ({
        user_id: user.id,
        title: item.title,
        category: item.category,
        year: item.year ? String(item.year) : null,
        status: item.status === 'Completed' ? 'Completed' : 'Planned',
        image: item.image || null,
        rating: item.rating ?? null,
        genres: item.genres || [],
      }))

      const { error } = await supabase.from('items').insert(rows)
      if (error) throw error

      await loadCloudItems(user)
    } else if (!user && newItems.length) {
      updateItems([...items, ...newItems])
    }

    // Merge curriculum courses by course code
    const existingCodes = new Set(
      curriculumCourses.map(course =>
        course.course_code?.trim().toUpperCase()
      )
    )

    const newCourses = backup.curriculumCourses.filter(course => {
      const code = course.course_code?.trim().toUpperCase()
      if (!code || existingCodes.has(code)) return false
      existingCodes.add(code)
      return true
    })

    if (user && newCourses.length) {
      let curriculumId = activeCurriculumId

      if (!curriculumId) {
        const { data, error } = await supabase
          .from('student_curricula')
          .insert({
            user_id: user.id,
            curriculum_name: 'Imported TrackIt Curriculum',
            total_required_credits: 160,
          })
          .select('id')
          .single()

        if (error) throw error
        curriculumId = data.id
      }

      const courseRows = newCourses.map(course => ({
        curriculum_id: curriculumId,
        user_id: user.id,
        course_code: course.course_code,
        course_name: course.course_name || course.name,
        main_section: course.main_section || null,
        subsection: course.subsection || null,
        credits: Number(course.credits) || 0,
        theory: Number(course.theory) || 0,
        practical: Number(course.practical) || 0,
        status: course.status === 'Completed' ? 'Completed' : 'Planned',
      }))

      const { error } = await supabase
        .from('student_curriculum_courses')
        .insert(courseRows)

      if (error) throw error

      await loadCurriculumCourses(user)
    } else if (!user && newCourses.length) {
      setCurriculumCourses(previous => [...previous, ...newCourses])
    }

    showNotification(
      `Imported ${newItems.length} items and ${newCourses.length} courses. Duplicates skipped.`,
      'success',
      'Backup merged'
    )
  } catch (error) {
    console.error('Backup import failed:', error)
    showNotification(error.message || 'Could not import backup.', 'error')
  } finally {
    setImportingBackup(false)
    event.target.value = ''
  }
}

  return (
    <div className={`app-shell ${theme}-theme`}>

{notification && (
  <div className={`app-notification ${notification.type}`}>
    <div className="notification-content">
<div className="notification-icon">
  {notification.type === 'success'
    ? '✓'
    : notification.type === 'error'
    ? '✕'
    : '⚠'}
</div>
      <div className="notification-text">
       <h3>
  {notification.title ||
    (notification.type === 'success'
      ? 'Success'
      : notification.type === 'error'
      ? 'Something went wrong'
      : 'Notice')}
</h3> 
        <p>{notification.message}</p>
      </div>
    </div>

    <button
      className="notification-close"
      onClick={() => setNotification(null)}
    >
      Got it
    </button>
  </div>
)}
{deleteConfirmation !== null && (
  <div className="delete-modal-overlay">
    <div className="delete-modal">
      <div className="delete-modal-icon">⚠️</div>

      <h3>Delete this item?</h3>

      <p>
        Are you sure you want to delete this item?
        This action cannot be undone.
      </p>

      <div className="delete-modal-actions">
        <button
          className="cancel-delete-btn"
          onClick={() => setDeleteConfirmation(null)}
        >
          Cancel
        </button>

        <button
          className="confirm-delete-btn"
          onClick={confirmDelete}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

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
  onClick={exportJSON}
>
  📦 Backup JSON
</button>
<button
  type="button"
  className="theme-toggle"
  onClick={() => backupFileRef.current?.click()}
>
  📂 Import JSON
</button>

<input
  type="file"
  accept=".json,application/json"
  ref={backupFileRef}
  onChange={importJSON}
  style={{ display: 'none' }}
/>
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

        {category === 'All' ? (
  <>
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
  </>
) : category !== 'Courses' ? (
  <>
    <section className="welcome">
      <div>
        <span className="eyebrow">YOUR COLLECTION</span>
        <h2>{category}</h2>
        <p>Explore and organize your {category.toLowerCase()} collection.</p>
      </div>
      <div className="welcome-star">✦</div>
    </section>

    <section className="stats">
      <div className="stat-card">
        <span>Total {category}</span>
        <strong>{selectedCategoryItems.length}</strong>
        <small>In your collection</small>
      </div>

      <div className="stat-card">
        <span>Completed</span>
        <strong>{selectedCategoryCompleted}</strong>
        <small>Finished items</small>
      </div>

      <div className="stat-card">
        <span>Planned</span>
        <strong>{selectedCategoryPlanned}</strong>
        <small>Waiting to explore</small>
      </div>

      <div className="stat-card">
        <span>Overall progress</span>
        <strong>{selectedCategoryProgress}%</strong>
        <div className="progress-track">
          <div style={{ width: `${selectedCategoryProgress}%` }} />
        </div>
        <small>Category completion</small>
      </div>
    </section>
  </>
) : null}

{category === 'Courses' && curriculumCourses.length > 0 && (
  <section className="curriculum-dashboard">

    <div className="curriculum-header">
      <div>
        <span className="eyebrow">ACADEMIC PROGRESS</span>
        <h2>My Curriculum</h2>
        <p>Mark each course when you complete it.</p>
      </div>

      <div className="total-credits">
        <strong>{completedCredits} C</strong>
        <span>of 160 C earned</span>
      </div>
    </div>

    <div className="overall-credit-track">
      <div
        style={{
          width: `${Math.min((completedCredits / 160) * 100, 100)}%`,
        }}
      />
    </div>
    <div className="curriculum-search">
  <span>⌕</span>
  <input
    type="text"
    placeholder="Search course by code or name..."
    value={curriculumSearch}
    onChange={(e) => setCurriculumSearch(e.target.value)}
  />
  {curriculumSearch && (
    <button
      type="button"
      onClick={() => setCurriculumSearch('')}
    >
      ✕
    </button>
  )}
</div>
    <div className="curriculum-section-list">

      {curriculumGroups.map(group => {
        if (
  group.courses.length === 0 &&
  group.name !== 'Open Electives'
) return null

        const searchQuery = curriculumSearch.trim().toLowerCase()

const hasMatchingCourses = group.courses.some(course =>
  String(course.course_code || '').toLowerCase().includes(searchQuery) ||
  String(course.course_name || course.name || '').toLowerCase().includes(searchQuery)
)

const isOpen = searchQuery
  ? hasMatchingCourses
  : expandedSections[group.name]

        const toggleSection = () => {
          setExpandedSections(previous => ({
            ...previous,
            [group.name]: !previous[group.name],
          }))
        }

        const renderCourse = course => (
          <div
            className={`curriculum-course ${
              course.status === 'Completed' ? 'course-completed' : ''
            }`}
            key={course.id}
          >
            <button
              type="button"
              className={`course-tick ${
                course.status === 'Completed' ? 'checked' : ''
              }`}
              onClick={() => toggleCourse(course)}
              aria-label={
                course.status === 'Completed'
                  ? `Mark ${course.course_name} incomplete`
                  : `Mark ${course.course_name} complete`
              }
            >
              {course.status === 'Completed' ? '✓' : ''}
            </button>

            <div className="course-details">
              <strong>{course.course_name}</strong>
              <span>{course.course_code}</span>
            </div>

            <span className="course-credits">
              {Number(course.credits)} C
            </span>
          </div>
        )
 
        return (
          <div className="curriculum-section" key={group.name}>

            <button
              type="button"
              className="curriculum-section-heading"
              onClick={toggleSection}
            >
              <span className={`section-chevron ${isOpen ? 'open' : ''}`}>
                ›
              </span>

              <span className="section-name">
                {group.name}
              </span>

              <span className="section-credit">
                {group.earned} C
                {group.required !== null && ` / ${group.required} C`}
              </span>
            </button>

            {isOpen && (
              <div className="curriculum-section-content">

                {/* School Core subsections */}
                {group.name === 'School Core' && (
                  [...new Set(
                    group.courses.map(course => course.subsection || group.name)
                  )].map(subsection => (
                    <div className="curriculum-subsection" key={subsection}>
                      <h4>{subsection}</h4>

                      {group.courses
  .filter(course => {
    const matchesSubsection =
      (course.subsection || group.name) === subsection

    const query = curriculumSearch.trim().toLowerCase()

    const matchesSearch =
      !query ||
      String(course.course_code || '').toLowerCase().includes(query) ||
      String(course.course_name || course.name || '').toLowerCase().includes(query)

    return matchesSubsection && matchesSearch
  })
  .map(renderCourse)}
                    </div>
                  ))
                )}

                {/* Discipline Electives */}
                {group.name === 'Discipline Electives' && (
                  <>
                    <div className="curriculum-subsection">
                      <h4>Common Electives — 10 C</h4>

                      {group.courses
                        .filter(course => {
  const query = curriculumSearch.trim().toLowerCase()

  return (
    course.subsection === 'Common Electives' &&
    (
      !query ||
      String(course.course_code || '').toLowerCase().includes(query) ||
      String(course.course_name || '').toLowerCase().includes(query)
    )
  )
})
                        .map(renderCourse)}
                    </div>

                    <div className="curriculum-subsection">
                      <h4>Specialized Electives — 33 C</h4>

                      {Object.entries(specializedCaps).map(
                        ([basket, limit]) => {
                          const basketCourses = group.courses.filter(course => {
  const query = curriculumSearch.trim().toLowerCase()

  return (
    course.subsection === basket &&
    (
      !query ||
      String(course.course_code || '').toLowerCase().includes(query) ||
      String(course.course_name || '').toLowerCase().includes(query)
    )
  )
})

                          if (basketCourses.length === 0) return null

                          const basketEarned =
                            specializedEarnedByBasket[basket] || 0

                          const basketCounted =
                            specializedCountedByBasket[basket] || 0

                          return (
                            <div
                              className="curriculum-subsection"
                              key={basket}
                            >
                              <h4>
                                {basket} — {basketCounted} / {limit} C
                              </h4>

                              {basketEarned > limit && (
                                <p className="elective-overflow-note">
                                  {basketEarned - limit} C excess counted
                                  towards Open Electives.
                                </p>
                              )}

                              {basketCourses.map(renderCourse)}
                            </div>
                          )
                        }
                      )}
                    </div>
                  </>
                )}

                {/* Open Electives */}
{group.name === 'Open Electives' && (
  <>
    <div className="open-elective-form-wrapper">
      <h4>Add Open Elective</h4>

      <p>
        Add an approved course that is not listed in your curriculum PDF.
      </p>

      <form
        className="open-elective-form"
        onSubmit={addOpenElective}
      >
        <input
          type="text"
          placeholder="Course code"
          value={openElectiveCode}
          onChange={e => setOpenElectiveCode(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Course name"
          value={openElectiveName}
          onChange={e => setOpenElectiveName(e.target.value)}
          required
        />

        <select
          value={openElectiveCredits}
          onChange={e => setOpenElectiveCredits(e.target.value)}
        >
          {[1, 2, 3, 4, 5, 6].map(value => (
            <option key={value} value={value}>
              {value} Credits
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="add-item-button"
          disabled={
            openElectiveSaving ||
            Math.max(
              0,
              18 -
              sumCredits(
                curriculumCourses.filter(
                  course => course.main_section === 'Open Electives'
                )
              ) -
              specializedOverflow
            ) === 0
          }
        >
          {openElectiveSaving ? 'Saving...' : '+ Add Open Elective'}
        </button>
      </form>

      {openElectiveMessage && (
        <p className="open-elective-message">
          {openElectiveMessage}
        </p>
      )}

      <p className="open-elective-remaining">
        Available capacity: {
          Math.max(
            0,
            18 -
            sumCredits(
              curriculumCourses.filter(
                course => course.main_section === 'Open Electives'
              )
            ) -
            specializedOverflow
          )
        } C
      </p>
    </div>

    {specializedOverflow > 0 && (
      <div className="curriculum-course">
        <div className="course-details">
          <strong>Specialized Elective Overflow</strong>
          <span>Excess credits from specialized baskets</span>
        </div>

        <span className="course-credits">
          {Math.min(specializedOverflow, 18)} C
        </span>
      </div>
    )}

    {group.courses
  .filter(course => {
    const query = curriculumSearch.trim().toLowerCase()

    return (
      !query ||
      String(course.course_code || '').toLowerCase().includes(query) ||
      String(course.course_name || '').toLowerCase().includes(query)
    )
  })
  .map(renderCourse)}
  </>
)}

{/* Other sections */}
{/* Other sections */}
{![
  'School Core',
  'Discipline Electives',
  'Open Electives',
].includes(group.name) &&
  group.courses
    .filter(course => {
      const query = curriculumSearch.trim().toLowerCase()

      return (
        !query ||
        String(course.course_code || '').toLowerCase().includes(query) ||
        String(course.course_name || '').toLowerCase().includes(query)
      )
    })
    .map(renderCourse)}

              </div>
            )}

          </div>
        )
      })}

    </div>
  </section>
)}
        {category === 'All' && (
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
                <strong>
  {category.name === 'Courses'
    ? `${category.count} C`
    : category.count}
</strong>
                <small>
                  {category.completed} of {category.count} completed
                </small>
                <div className="category-progress-track">
                  <div
                    style={{
                      width: `${category.progress}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        )}
{category !== 'Courses' && showDiscover && (
  <section className="anime-search-section">
    <button
  type="button"
  className="discover-close-button"
  onClick={() => setShowDiscover(false)}
  aria-label="Close Discover"
>
  ✕
</button>
  <div>
    <span className="eyebrow">DISCOVER</span>
<h2>
  {category === 'Movies'
    ? 'Find your next movie'
    : category === 'TV Shows'
      ? 'Find your next TV show'
      : category === 'Anime'
        ? 'Find your next anime'
        : category === 'Games'
          ? 'Find your next game'
          : 'Find your next watch'}
</h2>

<p>
  {category === 'Movies'
    ? 'Search and discover movies to add to your collection.'
    : category === 'TV Shows'
      ? 'Search and discover TV shows to add to your collection.'
      : category === 'Anime'
        ? 'Search and discover anime to add to your collection.'
        : category === 'Games'
          ? 'Search and discover games to add to your collection.'
          : 'Search movies, TV shows, and anime from one place.'}
</p>
  </div>

  <form
    className="anime-search-form"
onSubmit={async (e) => {
  e.preventDefault()

  if (category === 'Anime') {
    await handleAnimeSearch(e)
  } else if (category === 'Games') {
    await handleGameSearch(e)
  } else if (category === 'Movies') {
    await handleMovieSearch(e, 'movie')
  } else if (category === 'TV Shows') {
    await handleMovieSearch(e, 'tv')
  } else {
    await handleMovieSearch(e)
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
placeholder={
  category === 'Movies'
    ? 'Search movies...'
    : category === 'TV Shows'
      ? 'Search TV shows...'
      : category === 'Anime'
        ? 'Search anime...'
        : category === 'Games'
          ? 'Search games...'
          : 'Search movies, TV shows, or anime...'
}
      required
    />

{category !== 'Movies' &&
  category !== 'TV Shows' &&
  category !== 'Anime' &&
  category !== 'Games' && (
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
)}

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
)}
{category !== 'Courses' && !showDiscover && (
  <button
    type="button"
    className="add-item-button"
    onClick={() => setShowDiscover(true)}
  >
    + Show Discover
  </button>
)}


        {category !== 'Courses' && (
  <section className="library-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR COLLECTION</span>
              <h2>
  {category === 'All'
    ? 'Explore your library'
    : category === 'Movies'
      ? 'Explore your movies'
      : `Explore your ${category.toLowerCase()}`}
</h2>
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
              {newCategory === 'Courses' && (
  <div className="curriculum-upload">
    <label htmlFor="curriculum-pdf">
      Upload your curriculum PDF
    </label>

    <input
      id="curriculum-pdf"
      type="file"
      accept=".pdf,application/pdf"
      onChange={handleCurriculumUpload}
    />

    {curriculumLoading && <p>Reading curriculum PDF...</p>}

    {curriculumError && (
      <p className="error-message">{curriculumError}</p>
    )}

    {curriculumFile && !curriculumLoading && (
      <p>Selected: {curriculumFile.name}</p>
    )}

{parsedCourses.length > 0 && (
  <div className="parsed-courses">
    <h3>Detected Courses ({parsedCourses.length})</h3>

    <div className="curriculum-table-wrapper">
      <table className="curriculum-table">
        <thead>
  <tr>
    <th>Course Code</th>
    <th>Course Name</th>
    <th>Basket</th>
    <th>Credits</th>
    <th>Status</th>
  </tr>
</thead>

        <tbody>
          {parsedCourses.map(course => (
            <tr key={course.code}>
              <td>{course.code}</td>
              <td>{course.title}</td>
              <td>{course.basket}</td>
              <td>{course.credits}</td>
              <td>{course.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

   <button
  type="button"
  className="add-item-button"
  onClick={handleImportCurriculum}
>
  Import {parsedCourses.length} Courses
</button>
  </div>
)}

  </div>
)}
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

          {category === 'All' && (
  <div className="category-pills">
            {categories.map(c => (
              <button
                key={c}
                className={category === c ? 'pill selected' : 'pill'}
                onClick={() => {
  setCategory(c)

  if (c === 'Movies') {
  setSearchType('movie')
  setMovieType('movie')
}

if (c === 'TV Shows') {
  setSearchType('tv')
  setMovieType('tv')
}
if (c === 'Anime') {
  setSearchType('anime')
}
if (c === 'Games') {
  setSearchType('game')
}
}}
              >
                {c}
              </button>
            ))}
          </div>
          )}

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
        )}
         </main>
  </>
  )}
  </div>
  )
}

export default App
