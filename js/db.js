import { INITIAL_SERIES, INITIAL_ARTICLES, INITIAL_VIDEOS, INITIAL_TOURNAMENTS } from "./seedData.js";

// Constant Keys for LocalStorage (Pro version isolated database)
const STORAGE_KEYS = {
  SERIES: "togosen_series_pro",
  ARTICLES: "togosen_articles_pro",
  VIDEOS: "togosen_videos_pro",
  TOURNAMENTS: "togosen_tournaments_pro",
  SUGGESTIONS: "togosen_suggestions_pro",
  AUTH: "togosen_admin_auth_pro"
};

// Default password for administrative actions
const ADMIN_PASSWORD = "togosen";

// Helper: load from localStorage or return default
function loadData(key, defaultValue) {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`Failed to parse storage key: ${key}`, e);
    }
  }
  // Store default value if not set
  localStorage.setItem(key, JSON.stringify(defaultValue));
  return defaultValue;
}

// Helper: save to localStorage
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

const DB_VERSION_KEY = "togosen_db_pro_init";

// --- Initialize Database ---
export function initDB() {
  saveData(STORAGE_KEYS.SERIES, INITIAL_SERIES); // Sync series to get correct image paths
  
  // Force sync seed data once for pro version flag to transition from empty state
  if (!localStorage.getItem(DB_VERSION_KEY)) {
    saveData(STORAGE_KEYS.ARTICLES, INITIAL_ARTICLES);
    saveData(STORAGE_KEYS.VIDEOS, INITIAL_VIDEOS);
    saveData(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    saveData(STORAGE_KEYS.SUGGESTIONS, []);
    localStorage.setItem(DB_VERSION_KEY, "true");
  } else {
    // Keep user edits but guarantee structure
    if (!localStorage.getItem(STORAGE_KEYS.ARTICLES)) {
      saveData(STORAGE_KEYS.ARTICLES, INITIAL_ARTICLES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VIDEOS)) {
      saveData(STORAGE_KEYS.VIDEOS, INITIAL_VIDEOS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENTS)) {
      saveData(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUGGESTIONS)) {
      saveData(STORAGE_KEYS.SUGGESTIONS, []);
    }
  }
}

// --- Authentication ---
export function verifyAdminPassword(password) {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(STORAGE_KEYS.AUTH, "true");
    return true;
  }
  return false;
}

export function isAdminLoggedIn() {
  return localStorage.getItem(STORAGE_KEYS.AUTH) === "true";
}

export function adminLogout() {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
}

// --- Articles API ---
export function getArticles() {
  return loadData(STORAGE_KEYS.ARTICLES, INITIAL_ARTICLES);
}

export function getArticleById(id) {
  const articles = getArticles();
  return articles.find(a => a.id === id);
}

export function saveArticle(article) {
  const articles = getArticles();
  const index = articles.findIndex(a => a.id === article.id);
  
  const now = new Date().toISOString();
  
  if (index !== -1) {
    // Edit existing article
    const existing = articles[index];
    
    const updatedArticle = {
      ...existing,
      ...article,
      updatedAt: now
    };
    
    articles[index] = updatedArticle;
  } else {
    // Create new article
    const newArticle = {
      ...article,
      createdAt: now,
      updatedAt: now,
      history: []
    };
    articles.unshift(newArticle); // Put newest on top
  }
  
  saveData(STORAGE_KEYS.ARTICLES, articles);
  return true;
}

export function deleteArticle(id) {
  let articles = getArticles();
  articles = articles.filter(a => a.id !== id);
  saveData(STORAGE_KEYS.ARTICLES, articles);
}

// --- Videos API ---
export function getVideos() {
  return loadData(STORAGE_KEYS.VIDEOS, INITIAL_VIDEOS);
}

export function saveVideo(video) {
  const videos = getVideos();
  const index = videos.findIndex(v => v.id === video.id);
  
  if (index !== -1) {
    videos[index] = { ...videos[index], ...video };
  } else {
    const newVideo = {
      ...video,
      id: "v_" + Date.now()
    };
    videos.unshift(newVideo);
  }
  saveData(STORAGE_KEYS.VIDEOS, videos);
}

export function deleteVideo(id) {
  let videos = getVideos();
  videos = videos.filter(v => v.id !== id);
  saveData(STORAGE_KEYS.VIDEOS, videos);
}

// --- Tournaments API ---
export function getTournaments() {
  return loadData(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
}

export function saveTournament(tournament) {
  const tournaments = getTournaments();
  const index = tournaments.findIndex(t => t.id === tournament.id);
  
  if (index !== -1) {
    tournaments[index] = { ...tournaments[index], ...tournament };
  } else {
    const newTournament = {
      ...tournament,
      id: "t_" + Date.now()
    };
    tournaments.unshift(newTournament);
  }
  saveData(STORAGE_KEYS.TOURNAMENTS, tournaments);
}

export function deleteTournament(id) {
  let tournaments = getTournaments();
  tournaments = tournaments.filter(t => t.id !== id);
  saveData(STORAGE_KEYS.TOURNAMENTS, tournaments);
}

// --- Suggestions API (Wiki edit requests / user feedback) ---
export function getSuggestions() {
  return loadData(STORAGE_KEYS.SUGGESTIONS, []);
}

export function saveSuggestion(suggestion) {
  const suggestions = getSuggestions();
  const newSuggestion = {
    ...suggestion,
    id: "sug_" + Date.now(),
    createdAt: new Date().toISOString()
  };
  suggestions.unshift(newSuggestion); // Newest suggestions on top
  saveData(STORAGE_KEYS.SUGGESTIONS, suggestions);
  return true;
}

export function deleteSuggestion(id) {
  let suggestions = getSuggestions();
  suggestions = suggestions.filter(s => s.id !== id);
  saveData(STORAGE_KEYS.SUGGESTIONS, suggestions);
}

// --- Series API ---
export function getSeries() {
  return loadData(STORAGE_KEYS.SERIES, INITIAL_SERIES);
}
export function getSeriesById(id) {
  const seriesList = getSeries();
  return seriesList.find(s => s.id === id);
}

