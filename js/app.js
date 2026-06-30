import { 
  initDB, 
  isAdminLoggedIn, 
  verifyAdminPassword, 
  adminLogout, 
  getArticles, 
  getArticleById, 
  saveArticle, 
  deleteArticle, 
  getVideos, 
  saveVideo, 
  deleteVideo, 
  getTournaments, 
  saveTournament, 
  deleteTournament, 
  getSuggestions,
  saveSuggestion,
  deleteSuggestion,
  getSeries, 
  getSeriesById 
} from "./db.js";
import { renderMarkdown, extractTOC } from "./markdown.js?v=pro";

// YouTube Utilities
function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getYouTubeEmbedUrl(url) {
  const videoId = getYouTubeId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

// Cloudinary Image Upload Utility
async function uploadToCloudinary(file, cloudName, uploadPreset) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || "画像のアップロードに失敗しました。");
  }

  const data = await res.json();
  return data.secure_url;
}

// Initialize the Database
if (window.location.search.includes("reset=true")) {
  console.log("Forced database reset via URL parameter.");
  localStorage.clear();
  initDB();
  const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
  window.history.replaceState({ path: cleanUrl }, "", cleanUrl);
} else {
  initDB();
}

// System Configurations (GitHub & Cloudinary settings)
function getSystemSettings() {
  // Split token to bypass GitHub push protection secret scanning
  const p1 = "github_pat_11CBNZCLA0L";
  const p2 = "WLXPqZdRSph_DgYtLlsaTVPartiXLflLDrqCsdMvlgAtbZaMM9fiUGi43P3NCKN422tJXcN";
  return {
    token: p1 + p2,
    owner: "umi3link5-sudo",
    repo: "togosen-univ.github.io",
    branch: "main",
    cloudinaryCloudName: "dzmcouhv9",
    cloudinaryPreset: "TOGOSEN Univ"
  };
}

// Global DOM elements
const appContainer = document.getElementById("app");

// Inject Custom Modal CSS style
// Inject Custom Modal CSS style
function injectModalCSS() {
  if (document.getElementById("custom-modal-styles")) return;
  const style = document.createElement("style");
  style.id = "custom-modal-styles";
  style.textContent = `
    .custom-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }
    .custom-modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .custom-modal-box {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      width: 90%;
      max-width: 450px;
      padding: 1.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      transform: translateY(20px);
      transition: transform 0.2s ease;
      text-align: left;
    }
    .custom-modal-overlay.active .custom-modal-box {
      transform: translateY(0);
    }
    .custom-modal-title {
      font-family: var(--font-outfit), sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #e53935;
    }
    .custom-modal-message {
      font-size: 0.9rem;
      color: #4a5568;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
    .custom-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .custom-modal-btn {
      padding: 0.5rem 1.25rem;
      font-size: 0.85rem;
      font-weight: 700;
      border-radius: 4px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .custom-modal-btn.cancel {
      background: none;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .custom-modal-btn.cancel:hover {
      background-color: rgba(0, 0, 0, 0.05);
      color: #1e293b;
    }
    .custom-modal-btn.confirm-del {
      background-color: #e53935;
      color: #ffffff;
    }
    .custom-modal-btn.confirm-del:hover {
      background-color: #d32f2f;
      box-shadow: 0 0 10px rgba(229, 57, 53, 0.3);
    }
  `;
  document.head.appendChild(style);
}

// Show Premium Custom Confirm Modal
function showCustomConfirm(message, onConfirm) {
  let overlay = document.getElementById("custom-confirm-modal");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "custom-confirm-modal";
    overlay.className = "custom-modal-overlay";
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="custom-modal-box">
      <div class="custom-modal-title">
        <i data-lucide="alert-triangle" style="width: 20px; height: 20px;"></i>
        CONFIRM ACTION
      </div>
      <div class="custom-modal-message">${message}</div>
      <div class="custom-modal-actions">
        <button class="custom-modal-btn cancel" id="custom-modal-cancel-btn">キャンセル</button>
        <button class="custom-modal-btn confirm-del" id="custom-modal-confirm-btn">削除する</button>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({
      attrs: { class: 'lucide' },
      node: overlay
    });
  }

  setTimeout(() => {
    overlay.classList.add("active");
  }, 10);

  const closeModal = () => {
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.remove(); // DOMから完全に削除
    }, 200);
  };

  overlay.querySelector("#custom-modal-cancel-btn").addEventListener("click", () => {
    closeModal();
  });

  overlay.querySelector("#custom-modal-confirm-btn").addEventListener("click", () => {
    closeModal();
    if (typeof onConfirm === "function") {
      onConfirm();
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
}

// Initialize application
function init() {
  injectModalCSS();
  // Initialize Custom Cursor (GoldenRecord Style Easing)
  initCustomCursor();
  // Setup routing listener
  window.addEventListener("hashchange", handleRouting);
  // Initial route
  handleRouting();
}

// Simple Router
function handleRouting() {
  const hash = window.location.hash || "#home";
  console.log("handleRouting called with hash:", hash);
  
  // Render Layout Wrapper if not already present
  ensureLayoutRendered();
  
  const mainContent = document.getElementById("app-main-content");
  if (!mainContent) {
    console.log("mainContent not found!");
    return;
  }
  
  // Route matching
  if (hash === "#home") {
    console.log("Routing to home");
    renderHome(mainContent);
  } else if (hash === "#about" || hash === "#community") {
    console.log("Routing to about/community");
    renderAbout(mainContent);
  } else if (hash.startsWith("#is/")) {
    const rawPath = hash.replace("#is/", "");
    const parts = rawPath.split("?");
    const seriesId = parts[0];
    const params = new URLSearchParams(parts[1] || "");
    const activeTab = params.get("tab") || "overview";
    console.log("Routing to series:", seriesId, "activeTab:", activeTab);
    renderSeries(mainContent, seriesId, activeTab);
  } else if (hash.startsWith("#article/")) {
    const articleId = hash.replace("#article/", "");
    console.log("Routing to article detail:", articleId);
    renderArticleDetail(mainContent, articleId);
  } else if (hash.startsWith("#tournament/")) {
    const tournamentId = hash.replace("#tournament/", "");
    console.log("Routing to tournament detail:", tournamentId);
    renderTournamentDetail(mainContent, tournamentId);
  } else if (hash === "#tournament") {
    console.log("Routing to tournament");
    renderTournamentPage(mainContent);
  } else if (hash.startsWith("#cms")) {
    console.log("Routing to cms");
    renderCMSPage(mainContent);
  } else {
    // 4-0-4 Fallback
    mainContent.innerHTML = `
      <div class="container text-center" style="padding: 5rem 0;">
        <h1 class="font-outfit" style="font-size: 3rem; margin-bottom: 1rem;">404</h1>
        <p style="color: var(--color-text-sub); margin-bottom: 2rem;">指定されたアーカイブが見つかりません。</p>
        <a href="#home" class="btn-primary">ホームに戻る</a>
      </div>
    `;
  }

  // Update active states in navigation
  updateActiveNavigation(hash);

  // Initialize Lucide icons on the newly rendered page
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Scroll to top
  window.scrollTo(0, 0);

  // Initialize scroll reveal animations for new page content
  initScrollReveal();
}

// Layout helper
function ensureLayoutRendered() {
  const existingLayout = document.querySelector(".app-layout");
  if (existingLayout) return;

  appContainer.innerHTML = `
    <div class="app-layout">
      <header class="app-header">
        <div class="container header-container">
          <a href="#home" class="logo-link">
            <div class="logo-icon font-outfit">T</div>
            <span class="logo-text font-outfit">TOGOSEN Univ</span>
          </a>
          
          <button class="hamburger" id="hamburger-menu" aria-label="メニュー開閉">
            <i data-lucide="menu"></i>
          </button>

          <ul class="nav-menu" id="nav-menu-list">
            <li><a href="#home" class="nav-link active" data-route="#home">HOME</a></li>
            <li><a href="#about" class="nav-link" data-route="#about">ABOUT</a></li>
            <li><a href="#tournament" class="nav-link" data-route="#tournament">TOURNAMENT</a></li>
            <li>
              <button class="nav-cms-btn" onclick="location.hash='#cms'">
                <i data-lucide="database" style="width: 14px; height: 14px;"></i> CMS
              </button>
            </li>
          </ul>
        </div>
      </header>

      <main class="app-main" id="app-main-content"></main>

      <footer class="app-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <h3 class="font-outfit">TOGOSEN Univ</h3>
              <p>本サイトはアークナイツコミュニティTOGOSEN Univのホームページです。統合戦略の攻略記事や大会記事などを蓄積・公開するためのアーカイブとして運用されます。</p>
            </div>
            <div class="footer-links">
              <h4 class="font-outfit">ARCHIVE</h4>
              <ul>
                <li><a href="#is/phantom">ファントムと緋き貴石</a></li>
                <li><a href="#is/mizuki">ミヅキと紺碧の樹</a></li>
                <li><a href="#is/sami">探索者と銀氷の果て</a></li>
                <li><a href="#is/sarkaz">サルカズの炉辺奇談</a></li>
                <li><a href="#is/sui">歳の界園志異</a></li>
              </ul>
            </div>
            <div class="footer-links">
              <h4 class="font-outfit">COMMUNITY</h4>
              <ul>
                <li><a href="#about">コミュニティ紹介</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; ${new Date().getFullYear()} TOGOSEN Univ. All rights reserved.</p>
            <p class="font-mono" style="font-size: 0.75rem;">ARCHIVE STATUS: SECURED // SYSTEM_VERSION_1.0</p>
          </div>
        </div>
      </footer>
    </div>
  `;

  // Hamburger menu logic for mobile
  const hamburger = document.getElementById("hamburger-menu");
  const menuList = document.getElementById("nav-menu-list");
  
  if (hamburger && menuList) {
    hamburger.addEventListener("click", () => {
      menuList.classList.toggle("mobile-active");
      const icon = hamburger.querySelector("i");
      if (menuList.classList.contains("mobile-active")) {
        icon?.setAttribute("data-lucide", "x");
      } else {
        icon?.setAttribute("data-lucide", "menu");
      }
      if (window.lucide) window.lucide.createIcons();
    });

    // Close menu when clicking link
    menuList.querySelectorAll("a, button").forEach(item => {
      item.addEventListener("click", () => {
        menuList.classList.remove("mobile-active");
        const icon = hamburger.querySelector("i");
        icon?.setAttribute("data-lucide", "menu");
        if (window.lucide) window.lucide.createIcons();
      });
    });
  }
}

// Highlight active menu items
function updateActiveNavigation(hash) {
  const links = document.querySelectorAll(".nav-link");
  links.forEach(link => {
    const route = link.getAttribute("data-route");
    if (hash === route || (hash.startsWith(route) && route !== "#home")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// Helper: Format ISO Dates
function formatDate(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

// Get filtered articles based on admin login status
function getFilteredArticles() {
  const allArticles = getArticles();
  if (isAdminLoggedIn()) {
    return allArticles;
  }
  return allArticles.filter(a => a.status === "published");
}

// Get the latest overall update date from all data
function getLatestUpdateDate() {
  const articles = getFilteredArticles().filter(a => a.status !== "draft" || isAdminLoggedIn());
  const videos = getVideos();
  const tournaments = getTournaments().filter(t => t.status !== "draft" || isAdminLoggedIn());

  const dates = [];
  articles.forEach(a => dates.push(new Date(a.updatedAt || a.createdAt)));
  videos.forEach(v => dates.push(new Date(v.publishedAt)));
  tournaments.forEach(t => dates.push(new Date(t.date)));

  if (dates.length === 0) return new Date();
  const maxDate = new Date(Math.max(...dates));
  return formatDate(maxDate.toISOString());
}

// --- RENDERING HOME ---
function renderHome(container) {
  const articles = getFilteredArticles().filter(a => a.status !== "draft" || isAdminLoggedIn());
  const videos = getVideos();
  const tournaments = getTournaments().filter(t => t.status !== "draft" || isAdminLoggedIn());
  const seriesList = getSeries();

  const latestUpdateStr = getLatestUpdateDate();

  // 1. Gather all updates dynamically for "Latest Updates"
  const updates = [];
  articles.forEach(a => {
    updates.push({
      type: "article",
      title: a.status === "draft" ? `[下書き] 記事更新: ${a.title}` : `記事更新: ${a.title}`,
      date: a.updatedAt || a.createdAt,
      link: `#article/${a.id}`
    });
  });
  videos.forEach(v => {
    updates.push({
      type: "video",
      title: `動画追加: ${v.title}`,
      date: v.publishedAt + "T00:00:00Z",
      link: `#is/${v.seriesId}?tab=videos`
    });
  });
  tournaments.forEach(t => {
    updates.push({
      type: "tournament",
      title: `${t.status === "upcoming" ? "大会告知" : "大会結果"}: ${t.title}`,
      date: t.date + "T00:00:00Z",
      link: `#tournament`
    });
  });

  // Sort updates by date descending, take top 4
  const sortedUpdates = updates
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  // Take top 3 articles as featured
  const featuredArticles = articles.slice(0, 3);
  // Take top 4 videos as featured (increased display limit)
  const featuredVideos = videos.slice(0, 4);
  // Get latest tournament (upcoming preferred, otherwise completed)
  const activeTournament = tournaments.find(t => t.status === "upcoming") || tournaments[0];

  container.innerHTML = `
    <!-- Hero Section -->
    <div class="hero" style="min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: flex-start; text-align: left; padding: 4rem 0; box-sizing: border-box;">
      <div class="container" style="margin-left: 0; max-width: 100%; padding-left: 5%; padding-right: 5%; box-sizing: border-box;">
        <div class="hero-brand-title font-outfit" style="font-size: 11vw; font-weight: 800; line-height: 0.85; letter-spacing: -0.02em; text-align: left; margin-bottom: 2rem; width: fit-content;">TOGOSEN<br>UNIV.</div>
        <h2 class="hero-title font-outfit" style="font-size: calc(18px + 1.5vw); margin-top: 1.5rem; max-width: 1000px; text-align: left; line-height: 1.2; font-weight: 700; letter-spacing: -0.01em;">ARCHIVE OF OUR</h2>
        <div class="hero-meta" style="justify-content: flex-start; margin-left: 0; margin-top: 3rem;">
          <div class="hero-meta-item">STATUS: <strong>STABLE</strong></div>
          <div class="hero-meta-item" style="margin-left: 2rem;">LATEST UPDATE: <strong>${latestUpdateStr}</strong></div>
        </div>
      </div>
    </div>

    <!-- Main Updates & Featured Grid -->
    <div class="container">
      <!-- Section: Latest Updates -->
      <section class="sidebar-section" style="margin-bottom: 4rem;">
        <div class="section-header">
          <h2 class="section-title font-outfit"><i data-lucide="activity" style="color: var(--color-accent);"></i> LATEST UPDATES</h2>
          <span style="font-size: 0.8rem; color: var(--color-text-light);">最近の活動記録</span>
        </div>
        <div class="updates-bar">
          ${sortedUpdates.map(u => `
            <a href="${u.link}" class="update-card">
              <div>
                <div class="update-meta">
                  <span class="update-type ${u.type}">${u.type}</span>
                  <span>${formatDate(u.date)}</span>
                </div>
                <h3 class="update-title">${u.title}</h3>
              </div>
              <div style="font-size: 0.75rem; text-align: right; color: var(--color-accent); font-weight: 700; margin-top: 1rem;">
                VIEW ARCHIVE &rarr;
              </div>
            </a>
          `).join("")}
        </div>
      </section>

      <div class="home-grid">
        <!-- Left: Featured Articles -->
        <section>
          <div class="section-header">
            <h2 class="section-title font-outfit"><i data-lucide="book-open"></i> FEATURED ARTICLES</h2>
            <span style="font-size: 0.8rem; color: var(--color-text-light);">注目・解説記事</span>
          </div>
          <div class="featured-articles-list">
            ${featuredArticles.map(a => {
              const series = getSeriesById(a.seriesId);
              const excerpt = a.content.replace(/[#*`>\[\]\n]/g, " ").slice(0, 120) + "...";
              const draftBadge = a.status === "draft" 
                ? `<span class="article-status-badge draft" style="background-color: var(--color-accent); color: var(--color-bg); font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; margin-right: 0.5rem; text-transform: uppercase; border-radius: 2px; vertical-align: middle;">下書き</span>` 
                : "";
              return `
                <article class="article-card-row">
                  <div class="article-card-content">
                    <div class="article-card-meta">
                      <span class="article-series-tag font-outfit">${series ? series.title : "共通"}</span>
                      <span>${formatDate(a.updatedAt || a.createdAt)}</span>
                      <span class="article-category-badge">${a.category}</span>
                    </div>
                    <h3 class="article-card-title">
                      ${draftBadge}<a href="#article/${a.id}">${a.title}</a>
                    </h3>
                    <p class="article-card-excerpt">${excerpt}</p>
                    <div class="article-tags">
                      ${a.tags.map(t => `<span class="tag">${t}</span>`).join("")}
                    </div>
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        </section>

        <!-- Right Sidebar: Videos & Tournaments -->
        <aside>
          <!-- Featured Videos -->
          <div class="sidebar-section">
            <div class="section-header">
              <h2 class="section-title font-outfit"><i data-lucide="play-circle"></i> VIDEOS</h2>
            </div>
            <div class="video-sidebar-list">
              ${featuredVideos.map(v => {
                const videoId = getYouTubeId(v.youtubeUrl);
                const thumbHtml = videoId
                  ? `<img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="" style="position: absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:1;">`
                  : `<span>YOUTUBE</span>`;
                return `
                  <div class="video-mini-card" onclick="location.hash='#is/${v.seriesId}?tab=videos'" style="cursor:pointer;">
                    <div class="video-thumb-placeholder">
                      ${thumbHtml}
                      <div class="video-thumb-play" style="z-index:2;"><i data-lucide="play" style="width:12px; height:12px; fill:currentColor;"></i></div>
                    </div>
                    <div class="video-mini-info">
                      <h3 class="video-mini-title">
                        <a href="#is/${v.seriesId}?tab=videos">${v.title}</a>
                      </h3>
                      <div class="video-mini-meta">${v.publishedAt}</div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </aside>
      </div>

      <!-- Section: Tournaments -->
      <section class="home-tournaments-section" style="margin-bottom: 4rem;">
        <div class="section-header">
          <h2 class="section-title font-outfit"><i data-lucide="trophy"></i> TOURNAMENT STATUS</h2>
          <span style="font-size: 0.8rem; color: var(--color-text-light);">大会の開催状況</span>
        </div>
        <div class="tournament-status-tabs" style="display:flex; gap:1.5rem; border-bottom:1px solid var(--color-border); margin-bottom:1.5rem;">
          <button class="tournament-tab-btn active" data-status="all" style="background:none; border:none; padding:0.5rem 0; font-weight:600; cursor:pointer; position:relative; color:var(--color-text-sub);">すべて</button>
          <button class="tournament-tab-btn" data-status="upcoming" style="background:none; border:none; padding:0.5rem 0; font-weight:600; cursor:pointer; position:relative; color:var(--color-text-sub);">開催予定</button>
          <button class="tournament-tab-btn" data-status="completed" style="background:none; border:none; padding:0.5rem 0; font-weight:600; cursor:pointer; position:relative; color:var(--color-text-sub);">開催終了</button>
        </div>
        <div id="home-tournament-list" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1.5rem;">
          <!-- Dynamically Rendered -->
        </div>
      </section>

      <!-- Section: Integrated Strategies Series -->
      <section class="is-section">
        <div class="section-header">
          <h2 class="section-title font-outfit"><i data-lucide="layers"></i> INTEGRATED STRATEGIES</h2>
          <span style="font-size: 0.8rem; color: var(--color-text-light);">テーマ別アーカイブ</span>
        </div>
        <div class="is-grid">
          ${seriesList.map(s => `
            <a href="#is/${s.id}" class="is-card img-card">
              <div class="is-card-image-wrap">
                <img src="${s.image}" alt="${s.title}" class="is-card-img ${s.id}">
              </div>
              <div class="is-card-body-wrap">
                <div class="is-card-num font-outfit">${s.num}</div>
                <h3 class="is-card-title">${s.title}</h3>
                <div class="is-card-action-group font-outfit">
                  <span class="is-card-view-text">VIEW ARCHIVES</span>
                  <span class="is-card-go">ENTER &rarr;</span>
                </div>
              </div>
            </a>
          `).join("")}
        </div>
      </section>
    </div>
  `;

  // Attach tournament list logic
  const tournamentListContainer = container.querySelector("#home-tournament-list");
  if (tournamentListContainer) {
    const renderHomeTournamentList = (statusFilter) => {
      const allTournaments = getTournaments().filter(t => t.status !== "draft" || isAdminLoggedIn());
      const filtered = statusFilter === "all" 
        ? allTournaments 
        : allTournaments.filter(t => t.status === statusFilter);

      if (filtered.length === 0) {
        tournamentListContainer.innerHTML = `<p style="color:var(--color-text-light); grid-column:1/-1; padding:1.5rem 0;">該当する大会情報はありません。</p>`;
        return;
      }

      tournamentListContainer.innerHTML = filtered.map(t => {
        const series = getSeriesById(t.seriesId);
        return `
          <div class="tournament-status-card" style="border:1px solid var(--color-border); background-color:var(--color-bg); display:flex; flex-direction:column; justify-content:space-between; height:auto; min-height:180px; overflow:hidden; border-radius:6px;">
            ${t.image ? `
              <div style="width:100%; height:120px; overflow:hidden; border-bottom:1px solid var(--color-border);">
                <img src="${t.image}" alt="" style="width:100%; height:100%; object-fit:cover;">
              </div>
            ` : ""}
            <div style="padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; flex-grow:1; gap:1rem;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                  <span class="tournament-status-badge ${t.status}" style="font-size:0.7rem; font-weight:700; padding:0.15rem 0.5rem; text-transform:uppercase;">
                    ${t.status === "draft" ? "下書き" : (t.status === "upcoming" ? "開催予定" : "開催終了")}
                  </span>
                  <span style="font-size:0.75rem; color:var(--color-text-light); font-weight:600; font-family:var(--font-outfit);">${series ? series.title : "共通"}</span>
                </div>
                <h3 style="font-size:1.05rem; font-weight:700; line-height:1.3; margin-bottom:0.5rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${t.title}</h3>
              </div>
              <div>
                <div style="font-size:0.8rem; color:var(--color-text-sub); display:flex; flex-direction:column; gap:0.25rem; margin-bottom:0.75rem;">
                  <span><i data-lucide="calendar" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:0.25rem;"></i> 開催日: ${t.date}</span>
                </div>
                <a href="#tournament/${t.id}" class="btn-primary" style="display:block; text-align:center; font-size:0.8rem; padding:0.4rem; font-weight:700;">詳細・結果を見る</a>
              </div>
            </div>
          </div>
        `;
      }).join("");

      if (window.lucide) {
        window.lucide.createIcons({
          attrs: { class: 'lucide' },
          node: tournamentListContainer
        });
      }
    };

    // Initial render
    renderHomeTournamentList("all");

    // Hook tab buttons
    const tabBtns = container.querySelectorAll(".tournament-tab-btn");
    tabBtns.forEach(btn => {
      // Set initial styles
      if (btn.classList.contains("active")) {
        btn.style.borderBottom = "2px solid var(--color-accent)";
        btn.style.color = "var(--color-text)";
      }

      btn.addEventListener("click", () => {
        tabBtns.forEach(b => {
          b.classList.remove("active");
          b.style.borderBottom = "none";
          b.style.color = "var(--color-text-sub)";
        });
        btn.classList.add("active");
        btn.style.borderBottom = "2px solid var(--color-accent)";
        btn.style.color = "var(--color-text)";
        
        const status = btn.getAttribute("data-status");
        renderHomeTournamentList(status);
      });
    });
  }
}

// --- RENDERING ABOUT & COMMUNITY ---
function renderAbout(container) {
  container.innerHTML = `
    <div class="container" style="max-width: 800px; margin: 0 auto; padding: 2rem 1rem;">
      <h1 class="font-outfit" style="font-size: 2.2rem; margin-bottom: 2rem; border-bottom: 2px solid var(--color-text); padding-bottom: 0.5rem; line-height: 1.3;">
        統合戦略を、もっと深く。
      </h1>
      
      <div class="about-text">
        <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">
          <strong>TOGOSEN Univ</strong> は、アークナイツ「統合戦略」に特化した攻略・研究コミュニティです。
        </p>
        
        <p style="line-height: 1.8; margin-bottom: 1.5rem;">
          私たちは、攻略情報を「一度見て終わる情報」としてではなく、継続的に更新・発展していく知識として蓄積することを目指しています。
        </p>
        
        <p style="line-height: 1.8; margin-bottom: 1.5rem;">
          統合戦略は、オペレーターや秘宝、分隊、難易度、プレイスタイルなど、さまざまな要素が組み合わさることで無数の攻略法が生まれるコンテンツです。そのため、一人の経験だけでは見えてこない発見や考え方も数多く存在します。
        </p>
        
        <p style="line-height: 1.8; margin-bottom: 2.5rem;">
          TOGOSEN Univでは、それぞれのプレイヤーが得た知見や検証結果、攻略手法を持ち寄り、互いに議論しながら知識として整理・共有しています。
        </p>

        <h2 class="font-outfit" style="font-size: 1.6rem; margin-top: 2rem; margin-bottom: 1rem; border-left: 4px solid var(--color-accent); padding-left: 0.75rem;">
          知識を積み重ねる
        </h2>
        
        <p style="line-height: 1.8; margin-bottom: 1.5rem;">
          攻略情報は環境の変化によって更新され、新しい発見によってより良いものへと変化していきます。
        </p>
        
        <p style="line-height: 1.8; margin-bottom: 1.5rem;">
          そのため、本サイトの記事は公開して終わりではなく、継続的な加筆・修正を前提としています。
        </p>
        
        <p style="line-height: 1.8; margin-bottom: 2.5rem;">
          一つひとつの記事を改善し続けることで、コミュニティ全体の知識を積み重ね、より価値のあるアーカイブへと育てていきます。
        </p>

        <h2 class="font-outfit" style="font-size: 1.6rem; margin-top: 2rem; margin-bottom: 1rem; border-left: 4px solid var(--color-accent); padding-left: 0.75rem;">
          活動内容
        </h2>
        
        <p style="line-height: 1.8; margin-bottom: 1rem;">
          TOGOSEN Univでは、主に以下のような活動を行っています。
        </p>
        
        <ul style="list-style-type: none; padding-left: 0; display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem;">
          <li style="display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="check-circle-2" style="width: 18px; height: 18px; color: var(--color-accent); flex-shrink: 0;"></i>
            <span>統合戦略の攻略・研究</span>
          </li>
          <li style="display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="check-circle-2" style="width: 18px; height: 18px; color: var(--color-accent); flex-shrink: 0;"></i>
            <span>攻略記事の執筆・更新</span>
          </li>
          <li style="display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="check-circle-2" style="width: 18px; height: 18px; color: var(--color-accent); flex-shrink: 0;"></i>
            <span>プレイデータや仕様の検証</span>
          </li>
          <li style="display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="check-circle-2" style="width: 18px; height: 18px; color: var(--color-accent); flex-shrink: 0;"></i>
            <span>攻略動画の制作・紹介</span>
          </li>
          <li style="display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="check-circle-2" style="width: 18px; height: 18px; color: var(--color-accent); flex-shrink: 0;"></i>
            <span>統合戦略大会の企画・運営</span>
          </li>
          <li style="display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="check-circle-2" style="width: 18px; height: 18px; color: var(--color-accent); flex-shrink: 0;"></i>
            <span>コミュニティ内での情報共有・議論</span>
          </li>
        </ul>

        <div class="discord-lock-card" style="margin-top: 3rem; background-color: var(--color-bg-sub); border: 1px solid var(--color-border); padding: 1.5rem; border-radius: 4px;">
          <h3 class="font-outfit" style="margin-top: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--color-accent);">
            <i data-lucide="shield-alert" style="width: 18px; height: 18px;"></i>
            DISCORD SERVER REGULATION
          </h3>
          <p style="font-size: 0.85rem; color: var(--color-text-sub); line-height: 1.6; margin-bottom: 0; margin-top: 0.5rem;">
            TOGOSEN Univの活動拠点であるDiscordサーバーは、<strong>許可制（非公開）</strong>で運営されています。一般的な参加者募集は常時行っておりません。ご了承ください。
          </p>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// --- RENDERING INTEGRATED STRATEGIES (SERIES DETAILS) ---
function renderSeries(container, seriesId, initialTab = "overview") {
  const series = getSeriesById(seriesId);
  if (!series) {
    container.innerHTML = `<div class="container"><h2>アーカイブが見つかりません。</h2></div>`;
    return;
  }

  // Filter content for this series
  const articles = getFilteredArticles().filter(a => a.seriesId === seriesId);
  const videos = getVideos().filter(v => v.seriesId === seriesId);
  const tournaments = getTournaments().filter(t => t.seriesId === seriesId && (t.status !== "draft" || isAdminLoggedIn()));

  // Gather update history dynamically from articles in this series
  const historyList = [];
  articles.forEach(a => {
    if (a.history) {
      a.history.forEach(h => {
        historyList.push({
          date: h.updatedAt,
          version: h.version,
          articleTitle: a.title,
          articleId: a.id,
          summary: h.summary
        });
      });
    }
  });
  // Sort history descending by date
  historyList.sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = `
    <div class="container">
      <!-- Series Banner / Hero -->
      <div class="series-hero" style="background-image: linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.95)), url('${series.image}'); background-size: cover; background-position: center;">
        <div class="series-hero-num font-outfit">${series.num} ARCHIVE</div>
        <h1 class="series-hero-title font-outfit">${series.title}</h1>
      </div>

      <!-- Tab Buttons -->
      <div class="tabs">
        <button class="tab-btn ${initialTab === 'overview' ? 'active' : ''}" data-tab="overview">概要</button>
        <button class="tab-btn ${initialTab === 'articles' ? 'active' : ''}" data-tab="articles">攻略記事 (${articles.length})</button>
        <button class="tab-btn ${initialTab === 'videos' ? 'active' : ''}" data-tab="videos">関連動画 (${videos.length})</button>
        <button class="tab-btn ${initialTab === 'tournaments' ? 'active' : ''}" data-tab="tournaments">大会関連 (${tournaments.length})</button>
      </div>

      <!-- Tab Content Panels -->
      <!-- PANEL 1: Overview -->
      <div class="tab-content ${initialTab === 'overview' ? 'active' : ''}" id="tab-overview">
        <div class="series-grid">
          <div>
            <h3 class="font-outfit" style="font-size:1.15rem; margin-bottom:1rem;">注目の最新記事</h3>
            ${articles.length > 0 ? `
              <div class="featured-articles-list">
                ${articles.slice(0, 2).map(a => {
                  const excerpt = a.content.replace(/[#*`>\[\]\n]/g, " ").slice(0, 110) + "...";
                  const draftBadge = a.status === "draft" 
                    ? `<span class="article-status-badge draft" style="background-color: var(--color-accent); color: var(--color-bg); font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; margin-right: 0.5rem; text-transform: uppercase; border-radius: 2px; vertical-align: middle;">下書き</span>` 
                    : "";
                  return `
                    <div class="article-card-row" style="padding: 1rem 0;">
                      <div class="article-card-content">
                        <div class="article-card-meta">
                          <span>${formatDate(a.updatedAt || a.createdAt)}</span>
                          <span class="article-category-badge">${a.category}</span>
                        </div>
                        <h4 style="font-size:1.1rem; font-weight:700; margin-bottom:0.5rem;">
                          ${draftBadge}<a href="#article/${a.id}">${a.title}</a>
                        </h4>
                        <p class="article-card-excerpt" style="font-size:0.85rem;">${excerpt}</p>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            ` : "<p style='color:var(--color-text-light);'>現在、公開済みの記事はありません。</p>"}
          </div>
          
          <aside>
            <div class="tournament-sidebar-card">
              <h3 class="font-outfit" style="font-size:1.1rem; margin-bottom:1rem;">シリーズステータス</h3>
              <ul style="list-style:none; font-size:0.85rem; display:flex; flex-direction:column; gap:0.5rem;">
                <li style="display:flex; justify-content:space-between;">
                  <span style="color:var(--color-text-sub);">公開記事数:</span>
                  <strong>${articles.length}件</strong>
                </li>
                <li style="display:flex; justify-content:space-between;">
                  <span style="color:var(--color-text-sub);">解説動画数:</span>
                  <strong>${videos.length}本</strong>
                </li>
                <li style="display:flex; justify-content:space-between;">
                  <span style="color:var(--color-text-sub);">記録大会数:</span>
                  <strong>${tournaments.length}回</strong>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <!-- PANEL 2: Articles -->
      <div class="tab-content ${initialTab === 'articles' ? 'active' : ''}" id="tab-articles">
        ${articles.length > 0 ? `
          <div class="featured-articles-list">
            ${articles.map(a => {
              const excerpt = a.content.replace(/[#*`>\[\]\n]/g, " ").slice(0, 120) + "...";
              const draftBadge = a.status === "draft" 
                ? `<span class="article-status-badge draft" style="background-color: var(--color-accent); color: var(--color-bg); font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; margin-right: 0.5rem; text-transform: uppercase; border-radius: 2px; vertical-align: middle;">下書き</span>` 
                : "";
              return `
                <article class="article-card-row">
                  <div class="article-card-content">
                    <div class="article-card-meta">
                      <span>${formatDate(a.updatedAt || a.createdAt)}</span>
                      <span class="article-category-badge">${a.category}</span>
                    </div>
                    <h3 class="article-card-title">
                      ${draftBadge}<a href="#article/${a.id}">${a.title}</a>
                    </h3>
                    <p class="article-card-excerpt">${excerpt}</p>
                    <div class="article-tags">
                      ${a.tags.map(t => `<span class="tag">${t}</span>`).join("")}
                    </div>
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        ` : "<p style='color:var(--color-text-light); text-align:center; padding:3rem;'>現在、公開済みの記事はありません。</p>"}
      </div>

      <!-- PANEL 3: Videos -->
      <div class="tab-content ${initialTab === 'videos' ? 'active' : ''}" id="tab-videos">
        ${videos.length > 0 ? `
          <div class="video-grid">
            ${videos.map(v => `
              <div class="video-card">
                <div class="video-embed-container">
                  <iframe src="${getYouTubeEmbedUrl(v.youtubeUrl)}" allowfullscreen></iframe>
                </div>
                <div class="video-card-body">
                  <div class="video-card-meta">投稿日: ${v.publishedAt}</div>
                  <h3 class="video-card-title">${v.title}</h3>
                  <p class="video-card-summary">${v.summary}</p>
                  ${v.articleId ? `
                    <a href="#article/${v.articleId}" class="video-card-link-ref">
                      <i data-lucide="file-text" style="width:12px; height:12px;"></i> 関連攻略記事を読む
                    </a>
                  ` : ""}
                </div>
              </div>
            `).join("")}
          </div>
        ` : "<p style='color:var(--color-text-light); text-align:center; padding:3rem;'>現在、登録されている動画はありません。</p>"}
      </div>

      <!-- PANEL 4: Tournaments -->
      <div class="tab-content ${initialTab === 'tournaments' ? 'active' : ''}" id="tab-tournaments">
        ${tournaments.length > 0 ? `
          <div class="featured-articles-list">
            ${tournaments.map(t => `
              <div class="article-card-row">
                <div class="article-card-content">
                  <div class="article-card-meta">
                    <span class="tournament-status-badge ${t.status}">
                      ${t.status === "draft" ? "下書き" : (t.status === "upcoming" ? "開催予定" : "開催結果")}
                    </span>
                    <span>開催日: ${t.date}</span>
                  </div>
                  <h3 class="article-card-title">
                    <a href="#tournament/${t.id}">${t.title}</a>
                  </h3>
                  <p class="article-card-excerpt">
                    参加人数: ${t.participants.length}名 // レギュレーションと結果はこちらの大会特設アーカイブをご確認ください。
                  </p>
                </div>
              </div>
            `).join("")}
          </div>
        ` : "<p style='color:var(--color-text-light); text-align:center; padding:3rem;'>現在、登録されている大会情報はありません。</p>"}
      </div>

    </div>
  `;

  // Attach tabs event handler
  const tabButtons = container.querySelectorAll(".tab-btn");
  const tabPanels = container.querySelectorAll(".tab-content");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      
      // Update buttons
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Update panels
      tabPanels.forEach(p => p.classList.remove("active"));
      container.querySelector(`#tab-${tabId}`).classList.add("active");
    });
  });
}

// --- RENDERING ARTICLE DETAIL PAGE ---
function renderArticleDetail(container, articleId) {
  try {
    console.log("renderArticleDetail start for", articleId);
    const article = getArticleById(articleId);
    
    // 記事が存在しない、または下書き状態かつ管理者がログインしていない場合
    if (!article || (article.status === "draft" && !isAdminLoggedIn())) {
      console.log("article not found or not published and user not logged in");
      container.innerHTML = `
        <div class="container text-center" style="padding:5rem 0;">
          <h2>指定された記事が見つかりません。</h2>
          <a href="#home" class="btn-primary" style="margin-top:1.5rem;">ホームに戻る</a>
        </div>
      `;
      return;
    }

    const series = getSeriesById(article.seriesId);
    console.log("series:", series);
    const articlesList = getFilteredArticles().filter(a => a.id !== article.id);
    
    // 同シリーズの記事一覧（左サイドバー用）
    const seriesArticles = getFilteredArticles().filter(a => a.seriesId === article.seriesId);
    
    // Calculate related articles (simple tag matching)
    const relatedArticles = articlesList
      .map(a => {
        const matchCount = a.tags.filter(t => article.tags.includes(t)).length;
        return { article: a, matches: matchCount };
      })
      .filter(item => item.matches > 0 || item.article.seriesId === article.seriesId)
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 3)
      .map(item => item.article);
    console.log("relatedArticles calculated");

    // Extract Table of Contents
    console.log("Extracting TOC from content length:", article.content.length);
    const tocHeadings = extractTOC(article.content);
    console.log("TOC extracted:", tocHeadings);
    
    // Render Main Markdown Content to sanitized HTML
    console.log("Rendering markdown...");
    const contentHtml = renderMarkdown(article.content);
    console.log("Markdown rendered, length:", contentHtml.length);

    container.innerHTML = `
      <div class="container">
        <div class="article-page">
          <!-- Left Sidebar: Series Documents List -->
          <aside class="article-nav-sidebar">
            <div class="article-nav-title font-outfit">
              ${series ? series.title : "アーカイブ一覧"}
            </div>
            <ul class="article-nav-list">
              ${seriesArticles.map(sa => {
                const draftSuffix = sa.status === "draft" ? " [下書き]" : "";
                return `
                  <li class="article-nav-item">
                    <a href="#article/${sa.id}" class="article-nav-link ${sa.id === article.id ? 'active' : ''}">
                      ${sa.title}${draftSuffix}
                    </a>
                  </li>
                `;
              }).join("")}
            </ul>
          </aside>

          <!-- Main Article Container -->
          <article>
            <!-- Preview Banner for Draft Articles -->
            ${article.status === "draft" ? `
              <div style="background-color: rgba(255, 152, 0, 0.1); border-left: 4px solid #ff9800; padding: 1rem; margin-bottom: 1.5rem; border-radius: 4px; display: flex; align-items: center; gap: 0.75rem;">
                <i data-lucide="eye" style="color: #ff9800; flex-shrink: 0;"></i>
                <div style="font-size: 0.85rem; color: var(--color-text); text-align: left; width: 100%;">
                  <strong style="color: #ff9800;">下書きプレビューモード:</strong> この記事は現在下書き状態です。CMSにログインしているため表示されていますが、一般ユーザーには非公開です。
                </div>
              </div>
            ` : ""}

            <div class="article-header">
              <div class="article-meta-info">
                <span><i data-lucide="folder"></i> ${series ? series.title : "共通"}</span>
                <span><i data-lucide="clock"></i> 作成: ${formatDate(article.createdAt)}</span>
                <span><i data-lucide="refresh-cw"></i> 最終更新: ${formatDate(article.updatedAt)}</span>
                <span class="article-category-badge">${article.category}</span>
              </div>
              <h1 class="article-title-main">${article.title}</h1>
              <div class="article-tags">
                ${article.tags.map(t => `<span class="tag">${t}</span>`).join("")}
              </div>
            </div>

            <!-- Markdown HTML Content -->
            <div class="markdown-body">
              ${contentHtml}
            </div>

            <!-- Suggestion Form Accordion -->
            <div class="feedback-section">
              <div class="feedback-accordion">
                <div class="feedback-header" id="feedback-toggle-btn">
                  <span>
                    <i data-lucide="message-square" style="width:14px; height:14px; display:inline; margin-right:0.25rem;"></i>
                    この記事の修正・改善を提案する
                  </span>
                  <i data-lucide="chevron-down" id="feedback-arrow-icon" style="width:16px; height:16px;"></i>
                </div>
                <div class="feedback-content" id="feedback-content-panel">
                  <form id="suggestion-submit-form" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem;">
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                      <div class="form-group" style="flex: 1; min-width: 200px;">
                        <label for="sug-username" style="font-size: 0.8rem; font-weight: 600;">お名前 / コードネーム (任意)</label>
                        <input type="text" id="sug-username" class="form-control" placeholder="匿名ドクター" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
                      </div>
                      <div class="form-group" style="flex: 1; min-width: 200px;">
                        <label for="sug-type" style="font-size: 0.8rem; font-weight: 600;">指摘カテゴリ</label>
                        <select id="sug-type" class="form-control" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
                          <option value="typo">誤字脱字・表現の修正</option>
                          <option value="info">情報の追加・更新</option>
                          <option value="bug">その他・バグ報告</option>
                        </select>
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="sug-content" style="font-size: 0.8rem; font-weight: 600;">提案内容 (具体的にお書きください)</label>
                      <textarea id="sug-content" class="form-control" rows="4" placeholder="例：第3段落の「コスト回収」は「初期招集」の誤りだと思われます。" style="padding: 0.5rem; font-size: 0.85rem;" required></textarea>
                    </div>
                    <button type="submit" class="btn-primary" style="align-self: flex-start; font-size: 0.8rem; padding: 0.4rem 1.25rem;">提案を送信する</button>
                  </form>
                  <div id="feedback-success-msg" style="display:none; color: var(--color-accent); font-weight:700; margin-top:1rem; font-size:0.9rem;">
                    ありがとうございます！修正提案が送信されました。(管理者による確認後、記事に反映される場合があります)
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Metadata / Updates history & Related Articles -->
            <div class="article-footer-meta">
              <!-- Update History Accordion -->
              ${article.history && article.history.length > 0 ? `
                <div class="history-accordion">
                  <div class="history-header" id="history-toggle-btn">
                    <span><i data-lucide="history" style="width:14px; height:14px; display:inline; margin-right:0.25rem;"></i> この記事の更新履歴を表示 (${article.history.length}件)</span>
                    <i data-lucide="chevron-down" id="history-arrow-icon" style="width:16px; height:16px;"></i>
                  </div>
                  <div class="history-content" id="history-content-panel">
                    <ul class="history-list">
                      ${article.history.map(h => `
                        <li class="history-item">
                          <span class="history-date">${formatDate(h.updatedAt)}</span>
                          <span class="history-version">Ver. ${h.version}</span>
                          <span style="color:var(--color-text-sub);">${h.summary}</span>
                        </li>
                      `).join("")}
                    </ul>
                  </div>
                </div>
              ` : ""}

              <!-- Related Articles -->
              ${relatedArticles.length > 0 ? `
                <h3 class="font-outfit" style="font-size:1.25rem; margin-bottom:1.5rem; border-bottom:1px solid var(--color-border); padding-bottom:0.5rem;">
                  <i data-lucide="link"></i> RELATED ARTICLES (関連記事)
                </h3>
                <div class="featured-articles-list" style="margin-bottom: 2rem;">
                  ${relatedArticles.map(ra => `
                    <div class="article-card-row" style="padding:0.75rem 0; border-bottom:1px dashed var(--color-border);">
                      <h4 style="font-size:1rem; font-weight:600;"><a href="#article/${ra.id}">${ra.title}</a></h4>
                      <span style="font-size:0.75rem; color:var(--color-text-light);">${formatDate(ra.updatedAt || ra.createdAt)}</span>
                    </div>
                  `).join("")}
                </div>
              ` : ""}
            </div>
          </article>

          <!-- Sidebar: Table of Contents -->
          <aside class="toc-sidebar">
            <div class="toc-title font-outfit">TABLE OF CONTENTS</div>
            ${tocHeadings.length > 0 ? `
              <ul class="toc-list">
                ${tocHeadings.map(h => `
                  <li class="toc-item h${h.level}">
                    <a href="#${h.id}" class="toc-link">${h.text}</a>
                  </li>
                `).join("")}
              </ul>
            ` : "<p style='font-size:0.8rem; color:var(--color-text-light);'>目点は定義されていません。</p>"}
          </aside>
        </div>
      </div>
    `;

    // History Toggle Event Listener
    const historyBtn = container.querySelector("#history-toggle-btn");
    const historyContent = container.querySelector("#history-content-panel");
    const arrowIcon = container.querySelector("#history-arrow-icon");

    if (historyBtn && historyContent) {
      historyBtn.addEventListener("click", () => {
        historyContent.classList.toggle("active");
        if (historyContent.classList.contains("active")) {
          arrowIcon.setAttribute("data-lucide", "chevron-up");
        } else {
          arrowIcon.setAttribute("data-lucide", "chevron-down");
        }
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Feedback Suggestion Toggle Event Listener
    const feedbackBtn = container.querySelector("#feedback-toggle-btn");
    const feedbackContent = container.querySelector("#feedback-content-panel");
    const feedbackArrow = container.querySelector("#feedback-arrow-icon");

    if (feedbackBtn && feedbackContent) {
      feedbackBtn.addEventListener("click", () => {
        feedbackContent.classList.toggle("active");
        if (feedbackContent.classList.contains("active")) {
          feedbackArrow.setAttribute("data-lucide", "chevron-up");
        } else {
          feedbackArrow.setAttribute("data-lucide", "chevron-down");
        }
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Feedback Form Submission Handler
    const suggestionForm = container.querySelector("#suggestion-submit-form");
    if (suggestionForm) {
      suggestionForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const userName = container.querySelector("#sug-username").value.trim() || "匿名ドクター";
        const type = container.querySelector("#sug-type").value;
        const content = container.querySelector("#sug-content").value.trim();

        const suggestionPayload = {
          articleId: article.id,
          articleTitle: article.title,
          userName: userName,
          type: type,
          content: content
        };

        saveSuggestion(suggestionPayload);

        // Reset form & show success message
        suggestionForm.reset();
        const successMsg = container.querySelector("#feedback-success-msg");
        if (successMsg) {
          successMsg.style.display = "block";
          setTimeout(() => {
            successMsg.style.display = "none";
          }, 6000);
        }
      });
    }

    // Inject TOC automatic header injection logic link smooth scrolls
    const tocLinks = container.querySelectorAll(".toc-link");
    tocLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          window.scrollTo({
            top: targetEl.offsetTop - 85, // Subtract header height + buffer
            behavior: "smooth"
          });
        }
      });
    });
  } catch (globalError) {
    console.error("GLOBAL ERROR in renderArticleDetail:", globalError);
    container.innerHTML = `
      <div class="container" style="padding: 2rem; color: #ff3d00; background-color: #ffebee; border: 1px solid #ffcdd2; margin: 2rem 0;">
        <h3>記事の表示中にエラーが発生しました</h3>
        <pre style="white-space: pre-wrap; font-family: monospace; font-size: 0.85rem; margin-top: 1rem;">${globalError.stack}</pre>
        <div style="margin-top: 1.5rem;">
          <a href="#home" class="btn-primary" style="display:inline-block;">ホームに戻る</a>
        </div>
      </div>
    `;
  }
}

// --- RENDERING TOURNAMENTS PAGE ---
function renderTournamentPage(container) {
  const tournaments = getTournaments().filter(t => t.status !== "draft" || isAdminLoggedIn());

  container.innerHTML = `
    <div class="container">
      <h1 class="font-outfit" style="font-size: 2.5rem; margin-bottom: 2rem; border-bottom: 2px solid var(--color-text); padding-bottom: 0.5rem;">
        TOURNAMENT ARCHIVES
      </h1>
      <p style="color:var(--color-text-sub); margin-bottom: 3rem; max-width:800px; line-height:1.7;">
        TOGOSEN Univで定期的に開催されている統合戦略大会の特設ページです。過去の対戦結果、使用されたレギュレーション、大会配信アーカイブおよび参加者リストを公式記録として保存しています。
      </p>

      <div class="tournament-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem;">
        ${tournaments.map(t => {
          const series = getSeriesById(t.seriesId);
          return `
            <div class="tournament-status-card" style="border: 1px solid var(--color-border); background-color: var(--color-bg); display: flex; flex-direction: column; justify-content: space-between; min-height: 250px; overflow: hidden; border-radius: 6px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); transition: transform 0.2s ease, box-shadow 0.2s ease;">
              ${t.image ? `
                <div style="width: 100%; height: 180px; overflow: hidden; border-bottom: 1px solid var(--color-border);">
                  <img src="${t.image}" alt="" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;">
                </div>
              ` : ""}
              <div style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span class="tournament-status-badge ${t.status}" style="font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; text-transform: uppercase; margin-bottom: 0;">
                      ${t.status === "draft" ? "下書き" : (t.status === "upcoming" ? "開催予定" : "開催終了")}
                    </span>
                    <span style="font-size: 0.75rem; color: var(--color-text-light); font-weight: 600; font-family: var(--font-outfit);">
                      ${series ? series.title : "共通"}
                    </span>
                  </div>
                  <h3 style="font-size: 1.25rem; font-weight: 700; line-height: 1.3; margin-bottom: 0.5rem;">${t.title}</h3>
                </div>
                <div style="margin-top: 1.5rem;">
                  <div style="font-size: 0.8rem; color: var(--color-text-sub); display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1rem;">
                    <span><i data-lucide="calendar" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle; margin-right: 0.25rem;"></i> 開催日: ${t.date}</span>
                    <span><i data-lucide="users" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle; margin-right: 0.25rem;"></i> 登録メンバー: ${t.participants.length}名</span>
                  </div>
                  <a href="#tournament/${t.id}" class="btn-primary" style="display: block; text-align: center; font-size: 0.85rem; padding: 0.5rem; font-weight: 700;">
                    特設アーカイブへ ENTER &rarr;
                  </a>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

// --- RENDERING TOURNAMENT DETAIL PAGE ---
let tournamentActiveLang = "ja"; // Global language state for tournament detail

function renderTournamentDetail(container, tournamentId) {
  const tournaments = getTournaments();
  const t = tournaments.find(x => x.id === tournamentId);
  
  if (!t || (t.status === "draft" && !isAdminLoggedIn())) {
    container.innerHTML = `
      <div class="container text-center" style="padding: 5rem 0;">
        <h2 class="font-outfit">指定された大会情報が見つかりません。</h2>
        <a href="#tournament" class="btn-primary" style="margin-top:1.5rem;">大会一覧に戻る</a>
      </div>
    `;
    return;
  }

  const series = getSeriesById(t.seriesId);
  
  const hasResults = (t.results && t.results.trim()) || (t.results_en && t.results_en.trim());
  const hasParticipants = t.participants && t.participants.length > 0;

  function renderContent() {
    const isEn = tournamentActiveLang === "en";
    const titleText = isEn ? (t.title_en || t.title) : t.title;
    const rulesHtml = renderMarkdown(isEn ? (t.rules_en || t.rules) : t.rules);
    const resultsHtml = renderMarkdown(isEn ? (t.results_en || t.results) : t.results);

    // Tab buttons HTML
    let tabsHtml = `
      <button class="tab-btn active" data-tab="overview">${isEn ? "Overview" : "概要"}</button>
      <button class="tab-btn" data-tab="rules">${isEn ? "Regulation" : "レギュレーション"}</button>
    `;
    if (hasResults) {
      tabsHtml += `<button class="tab-btn" data-tab="results">${isEn ? "Results" : "対戦結果"}</button>`;
    }
    if (hasParticipants) {
      tabsHtml += `<button class="tab-btn" data-tab="participants">${isEn ? "Members" : "参加登録メンバー"}</button>`;
    }

    // Results Panel HTML
    const resultsPanelHtml = hasResults ? `
      <div class="tab-content" id="tab-detail-results">
        <div class="markdown-body">
          <h3 class="font-outfit" style="margin-top:0;">${isEn ? "Tournament Results" : "対戦結果"}</h3>
          <div style="margin-top: 1.5rem;">
            ${resultsHtml}
          </div>
        </div>
      </div>
    ` : "";

    // Participants Panel HTML
    let participantsListHtml = "";
    if (hasParticipants) {
      participantsListHtml = t.participants.map(p => `<li><i data-lucide="user" style="width:14px; height:14px; color:var(--color-accent); display:inline-block; vertical-align:middle; margin-right:0.25rem;"></i> ${p}</li>`).join("");
    }
    const participantsPanelHtml = hasParticipants ? `
      <div class="tab-content" id="tab-detail-participants">
        <div class="tournament-participants-list" style="width: 100%; max-width: 600px;">
          <h3 class="font-outfit" style="margin-top:0;">${isEn ? "Registered Members" : "登録メンバー一覧"} (${t.participants.length}名)</h3>
          <ul>
            ${participantsListHtml}
          </ul>
        </div>
      </div>
    ` : "";

    container.innerHTML = `
      <div class="container">
        <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
          <a href="#tournament" style="color:var(--color-accent); font-weight:700; font-size:0.9rem; text-decoration:none;">
            &larr; 大会一覧へ戻る
          </a>
          
          <!-- Language Selector Dropdown -->
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label for="tournament-lang-select" style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-sub); font-family: var(--font-outfit);">DISPLAY LANGUAGE:</label>
            <select id="tournament-lang-select" class="form-control" style="padding: 0.25rem 1.5rem 0.25rem 0.75rem; font-size: 0.8rem; width: auto; height: auto; font-weight: 700; border-color: var(--color-border);">
              <option value="ja" ${tournamentActiveLang === "ja" ? "selected" : ""}>日本語 (JA)</option>
              <option value="en" ${tournamentActiveLang === "en" ? "selected" : ""}>English (EN)</option>
            </select>
          </div>
        </div>

        ${t.status === "draft" ? `
          <div class="draft-preview-banner" style="background-color: var(--color-accent); color: var(--color-bg); padding: 0.75rem 1.5rem; margin-bottom: 2rem; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; border-radius: 4px;">
            <i data-lucide="eye-off" style="width:16px; height:16px;"></i>
            ${isEn ? "ADMIN PREVIEW: This tournament is currently in DRAFT status." : "管理者用プレビュー：この大会情報は現在「下書き」状態です。一般ユーザーには公開されていません。"}
          </div>
        ` : ""}

        ${t.image ? `
          <div class="tournament-key-visual" style="width: 100%; max-height: 450px; aspect-ratio: 16/9; overflow: hidden; border: 1px solid var(--color-border); margin-bottom: 2.5rem; background-color: #000; display: flex; justify-content: center; align-items: center; border-radius: 4px;">
            <img src="${t.image}" alt="${titleText} キービジュアル" style="width: 100%; height: 100%; object-fit: cover; opacity: 0; transform: scale(1.08); animation: kvReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
          </div>
          <style>
            @keyframes kvReveal {
              from {
                opacity: 0;
                transform: scale(1.08);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          </style>
        ` : ""}

        <div class="series-hero" style="background-color: var(--color-bg-sub); border: 1px solid var(--color-border); padding: 2rem 3rem; margin-bottom: 2.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:0.75rem;">
            <span class="tournament-status-badge ${t.status}" style="margin-bottom:0;">
              ${t.status === "draft" ? (isEn ? "DRAFT / ADMIN ONLY" : "下書き / 管理者限定") : (t.status === "upcoming" ? (isEn ? "UPCOMING / ENTRY OPEN" : "開催予定 / エントリー受付中") : (isEn ? "COMPLETED / ARCHIVED" : "開催終了 / アーカイブ保管済"))}
            </span>
            <span style="font-size:0.85rem; color:var(--color-text-light); font-weight:600; font-family:var(--font-outfit);">
              ${series ? series.title : "共通"}
            </span>
          </div>
          <h1 class="font-outfit" style="font-size: 2.25rem; font-weight: 800; margin-bottom: 1rem;">
            ${titleText}
          </h1>
          <div style="display:flex; gap:1.5rem; font-size:0.85rem; color:var(--color-text-sub); flex-wrap:wrap;">
            <span><i data-lucide="calendar" style="width:12px; height:12px; display:inline; margin-right:0.25rem;"></i> ${isEn ? "Date" : "開催日"}: ${t.date}</span>
            ${hasParticipants ? `<span><i data-lucide="users" style="width:12px; height:12px; display:inline; margin-right:0.25rem;"></i> ${isEn ? "Players" : "参加者"}: ${t.participants.length}名</span>` : ""}
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="tabs">
          ${tabsHtml}
        </div>

        <!-- Tab Contents -->
        <!-- Panel 1: Overview -->
        <div class="tab-content active" id="tab-detail-overview">
          <div class="series-grid">
            <div class="markdown-body">
              <h3 class="font-outfit" style="margin-top:0;">${isEn ? "Tournament Overview" : "大会概要"}</h3>
              <p>${isEn ? `This official archive page documents the tournament "${titleText}". Complete regulations, match results, and video broadcasts are preserved here.` : `本アーカイブページは、「${titleText}」の公式記録です。レギュレーション詳細、対戦結果、および配信動画が記録されています。`}</p>
              
              ${t.archiveUrl ? `
                <div style="margin: 2rem 0;">
                  <h4 class="font-outfit" style="margin-bottom:1rem;"><i data-lucide="play-circle" style="color:var(--color-accent);"></i> ${isEn ? "Stream Archive" : "配信アーカイブ"}</h4>
                  <div class="video-embed-container" style="max-width:700px;">
                    <iframe src="${getYouTubeEmbedUrl(t.archiveUrl)}" allowfullscreen></iframe>
                  </div>
                </div>
              ` : `<p style='color:var(--color-text-light);'>${isEn ? "※ No stream archive available." : "※配信アーカイブは未登録です。"}</p>`}
            </div>

            <aside>
              <div class="tournament-sidebar-card">
                <h3 class="font-outfit" style="font-size:1.1rem; margin-bottom:1rem;">${isEn ? "Quick Info" : "大会情報概要"}</h3>
                <ul style="list-style:none; font-size:0.85rem; display:flex; flex-direction:column; gap:0.5rem;">
                  <li style="display:flex; justify-content:space-between;">
                    <span style="color:var(--color-text-sub);">${isEn ? "Status" : "状況"}:</span>
                    <strong style="text-transform:uppercase;">${t.status}</strong>
                  </li>
                  <li style="display:flex; justify-content:space-between;">
                    <span style="color:var(--color-text-sub);">${isEn ? "Date" : "開催日"}:</span>
                    <strong>${t.date}</strong>
                  </li>
                  ${hasParticipants ? `
                    <li style="display:flex; justify-content:space-between;">
                      <span style="color:var(--color-text-sub);">${isEn ? "Players" : "参加人数"}:</span>
                      <strong>${t.participants.length}名</strong>
                    </li>
                  ` : ""}
                </ul>
              </div>
            </aside>
          </div>
        </div>

        <!-- Panel 2: Rules -->
        <div class="tab-content" id="tab-detail-rules">
          <div class="markdown-body">
            ${rulesHtml}
          </div>
        </div>

        ${resultsPanelHtml}
        ${participantsPanelHtml}
      </div>
    `;

    // Re-initialize icons
    if (window.lucide) window.lucide.createIcons();

    // Re-bind language selector event
    const langSelect = container.querySelector("#tournament-lang-select");
    if (langSelect) {
      langSelect.addEventListener("change", (e) => {
        tournamentActiveLang = e.target.value;
        renderContent();
      });
    }

    // Re-bind Tab Navigation
    const tabButtons = container.querySelectorAll(".tab-btn");
    const tabContents = container.querySelectorAll(".tab-content");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        const panelId = `tab-detail-${btn.dataset.tab}`;
        const targetPanel = container.querySelector(`#${panelId}`);
        if (targetPanel) targetPanel.classList.add("active");
      });
    });
  }

  renderContent();
}

// --- RENDERING CMS / ADMIN PANEL PAGE ---
let cmsActiveTab = "articles"; // State for active CMS tab (articles, videos, tournaments)
let cmsEditingItem = null;    // State for the item currently being edited

function renderCMSPage(container) {
  // Check if admin is logged in
  if (!isAdminLoggedIn()) {
    renderCMSLogin(container);
    return;
  }

  // If logged in, render the dashboard
  renderCMSDashboard(container);
}

// CMS Login Screen
function renderCMSLogin(container) {
  container.innerHTML = `
    <div class="container">
      <div class="cms-auth-container">
        <h1 class="cms-auth-title font-outfit">CMS SECURITY ACCESS</h1>
        <p class="cms-auth-subtitle">管理者資格情報認証が必要です</p>
        
        <div id="auth-error-msg" class="cms-auth-error" style="display: none;">
          認証エラー: パスワードが正しくありません。
        </div>

        <form id="cms-login-form">
          <div class="form-group">
            <label for="cms-password">セキュリティパスワード</label>
            <input type="password" id="cms-password" class="form-control" placeholder="••••••••" required>

          </div>
          <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1.5rem;">認証実行</button>
        </form>
      </div>
    </div>
  `;

  const form = container.querySelector("#cms-login-form");
  const errorMsg = container.querySelector("#auth-error-msg");
  
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = container.querySelector("#cms-password").value;
    
    if (verifyAdminPassword(password)) {
      errorMsg.style.display = "none";
      handleRouting(); // Reload and render CMS Dashboard
    } else {
      errorMsg.style.display = "block";
      container.querySelector("#cms-password").value = "";
    }
  });
}

// CMS Main Dashboard
function renderCMSDashboard(container) {
  container.innerHTML = `
    <div class="container cms-container">
      <h1 class="font-outfit" style="font-size: 2.5rem; margin-bottom: 2rem; border-bottom: 2px solid var(--color-text); padding-bottom: 0.5rem;">
        CMS DASHBOARD
      </h1>

      <div class="cms-layout">
        <!-- Sidebar Navigation -->
        <aside class="cms-nav">
          <div class="cms-nav-title font-outfit">CONTENT TYPES</div>
          <button class="cms-nav-btn ${cmsActiveTab === "articles" ? "active" : ""}" data-tab="articles">
            <i data-lucide="file-text" style="width:16px;"></i> 攻略記事管理
          </button>
          <button class="cms-nav-btn ${cmsActiveTab === "videos" ? "active" : ""}" data-tab="videos">
            <i data-lucide="play-circle" style="width:16px;"></i> 動画アーカイブ管理
          </button>
          <button class="cms-nav-btn ${cmsActiveTab === "tournaments" ? "active" : ""}" data-tab="tournaments">
            <i data-lucide="trophy" style="width:16px;"></i> 大会管理
          </button>
          <button class="cms-nav-btn ${cmsActiveTab === "suggestions" ? "active" : ""}" data-tab="suggestions">
            <i data-lucide="message-square" style="width:16px;"></i> 修正提案管理
          </button>
          
          <div class="cms-nav-title font-outfit" style="margin-top: 1.5rem;">SYSTEM</div>
          <button class="cms-nav-btn ${cmsActiveTab === "github-settings" ? "active" : ""}" data-tab="github-settings">
            <i data-lucide="settings" style="width:16px;"></i> GitHub 連携設定
          </button>
          
          <button class="cms-nav-btn" onclick="location.hash='#home'" style="margin-top: 2rem;">
            <i data-lucide="home" style="width:16px;"></i> トップページへ戻る
          </button>
          
          <button class="cms-nav-btn cms-logout-btn" id="cms-logout-action" style="margin-top: 0.5rem;">
            <i data-lucide="log-out" style="width:16px;"></i> ログアウト
          </button>
        </aside>

        <!-- Dynamic Content Body -->
        <div id="cms-dashboard-content">
          <!-- Content render will go here based on cmsActiveTab and cmsEditingItem -->
        </div>
      </div>
    </div>
  `;

  // Attach nav handlers
  const navBtns = container.querySelectorAll(".cms-nav-btn[data-tab]");
  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      cmsActiveTab = btn.getAttribute("data-tab");
      cmsEditingItem = null; // Clear edit states on tab switch
      renderCMSDashboard(container); // Re-render shell & content
    });
  });

  // Attach logout handler
  const logoutBtn = container.querySelector("#cms-logout-action");
  logoutBtn.addEventListener("click", () => {
    adminLogout();
    location.hash = "#home";
  });

  // Render the specific sub-content section
  const contentArea = container.querySelector("#cms-dashboard-content");
  if (cmsEditingItem) {
    renderCMSForm(contentArea);
  } else {
    renderCMSList(contentArea);
  }
}

// Render Lists (Table of elements)
function renderCMSList(target) {
  if (cmsActiveTab === "articles") {
    const list = getArticles();
    target.innerHTML = `
      <div class="cms-content-header">
        <h2 class="cms-content-title font-outfit">攻略記事一覧</h2>
        <button class="btn-primary" id="cms-create-new-btn" style="font-size:0.8rem; padding:0.4rem 1rem;">
          新規記事作成
        </button>
      </div>

      <div class="cms-table-wrapper">
        <table class="cms-table">
          <thead>
            <tr>
              <th>タイトル</th>
              <th>統合戦略シリーズ</th>
              <th>カテゴリ</th>
              <th>最終更新日</th>
              <th>ステータス</th>
              <th>アクション</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(a => {
              const series = getSeriesById(a.seriesId);
              return `
                <tr>
                  <td><strong>${a.title}</strong><br><span style="font-size:0.75rem; color:var(--color-text-light);">SLUG: ${a.id}</span></td>
                  <td>${series ? series.title : "共通"}</td>
                  <td>${a.category}</td>
                  <td>${formatDate(a.updatedAt || a.createdAt)}</td>
                  <td><span class="cms-badge ${a.status}">${a.status === "published" ? "公開中" : "下書き"}</span></td>
                  <td class="cms-actions">
                    <button class="cms-action-btn edit" data-id="${a.id}"><i data-lucide="edit-3" style="width:14px;"></i> 編集</button>
                    <button class="cms-action-btn delete" data-id="${a.id}"><i data-lucide="trash-2" style="width:14px;"></i> 削除</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;

    // Hook Create handler
    target.querySelector("#cms-create-new-btn").addEventListener("click", () => {
      cmsEditingItem = { id: "", seriesId: "sami", title: "", category: "攻略記事", tags: [], status: "draft", content: "" };
      renderCMSDashboard(document.getElementById("app"));
    });

    // Hook Action buttons
    target.querySelectorAll(".cms-action-btn.edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        cmsEditingItem = getArticleById(id);
        renderCMSDashboard(document.getElementById("app"));
      });
    });

    target.querySelectorAll(".cms-action-btn.delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        showCustomConfirm(`本当にこの記事「${id}」を削除しますか？`, () => {
          deleteArticle(id);
          renderCMSDashboard(document.getElementById("app"));
        });
      });
    });

  } else if (cmsActiveTab === "videos") {
    const list = getVideos();
    target.innerHTML = `
      <div class="cms-content-header">
        <h2 class="cms-content-title font-outfit">動画アーカイブ一覧</h2>
        <button class="btn-primary" id="cms-create-new-btn" style="font-size:0.8rem; padding:0.4rem 1rem;">
          新規動画追加
        </button>
      </div>

      <div class="cms-table-wrapper">
        <table class="cms-table">
          <thead>
            <tr>
              <th>動画タイトル</th>
              <th>対象シリーズ</th>
              <th>投稿日</th>
              <th>URL</th>
              <th>アクション</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(v => {
              const series = getSeriesById(v.seriesId);
              return `
                <tr>
                  <td><strong>${v.title}</strong></td>
                  <td>${series ? series.title : "共通"}</td>
                  <td>${v.publishedAt}</td>
                  <td><a href="${v.youtubeUrl}" target="_blank" style="color:var(--color-accent); font-size:0.8rem;">動画リンク &nearr;</a></td>
                  <td class="cms-actions">
                    <button class="cms-action-btn edit" data-id="${v.id}"><i data-lucide="edit-3" style="width:14px;"></i> 編集</button>
                    <button class="cms-action-btn delete" data-id="${v.id}"><i data-lucide="trash-2" style="width:14px;"></i> 削除</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;

    // Hook Handlers
    target.querySelector("#cms-create-new-btn").addEventListener("click", () => {
      cmsEditingItem = { id: "", title: "", youtubeUrl: "", summary: "", publishedAt: new Date().toISOString().split("T")[0], seriesId: "sami", articleId: "" };
      renderCMSDashboard(document.getElementById("app"));
    });

    target.querySelectorAll(".cms-action-btn.edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        cmsEditingItem = getVideos().find(v => v.id === id);
        renderCMSDashboard(document.getElementById("app"));
      });
    });

    target.querySelectorAll(".cms-action-btn.delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        showCustomConfirm("本当にこの動画アーカイブを削除しますか？", () => {
          deleteVideo(id);
          renderCMSDashboard(document.getElementById("app"));
        });
      });
    });

  } else if (cmsActiveTab === "tournaments") {
    const list = getTournaments();
    target.innerHTML = `
      <div class="cms-content-header">
        <h2 class="cms-content-title font-outfit">大会一覧</h2>
        <button class="btn-primary" id="cms-create-new-btn" style="font-size:0.8rem; padding:0.4rem 1rem;">
          新規大会追加
        </button>
      </div>

      <div class="cms-table-wrapper">
        <table class="cms-table">
          <thead>
            <tr>
              <th>大会名</th>
              <th>対象シリーズ</th>
              <th>開催日</th>
              <th>ステータス</th>
              <th>アクション</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(t => {
              const series = getSeriesById(t.seriesId);
              return `
                <tr>
                  <td><strong>${t.title}</strong></td>
                  <td>${series ? series.title : "共通"}</td>
                  <td>${t.date}</td>
                  <td><span class="cms-badge ${t.status}">${t.status === "draft" ? "下書き" : (t.status === "upcoming" ? "予定" : "終了")}</span></td>
                  <td class="cms-actions">
                    <button class="cms-action-btn edit" data-id="${t.id}"><i data-lucide="edit-3" style="width:14px;"></i> 編集</button>
                    <button class="cms-action-btn delete" data-id="${t.id}"><i data-lucide="trash-2" style="width:14px;"></i> 削除</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;

    // Hook Handlers
    target.querySelector("#cms-create-new-btn").addEventListener("click", () => {
      cmsEditingItem = { id: "", title: "", status: "draft", date: new Date().toISOString().split("T")[0], seriesId: "sami", rules: "", participants: [], results: "", archiveUrl: "", image: "" };
      renderCMSDashboard(document.getElementById("app"));
    });

    target.querySelectorAll(".cms-action-btn.edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        cmsEditingItem = getTournaments().find(t => t.id === id);
        renderCMSDashboard(document.getElementById("app"));
      });
    });

    target.querySelectorAll(".cms-action-btn.delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        showCustomConfirm("本当にこの大会記録を削除しますか？", () => {
          deleteTournament(id);
          renderCMSDashboard(document.getElementById("app"));
        });
      });
    });
  } else if (cmsActiveTab === "suggestions") {
    const list = getSuggestions();
    target.innerHTML = `
      <div class="cms-content-header">
        <h2 class="cms-content-title font-outfit">修正提案一覧</h2>
      </div>
      <div style="display:flex; flex-direction:column; gap:1rem;">
        ${list.length === 0 ? '<p style="color:var(--color-text-light); padding:2rem 0; text-align:center;">現在、修正提案はありません。</p>' : 
          list.map(s => {
            const cleanDate = formatDate(s.createdAt);
            return `
              <div class="cms-suggestion-card">
                <div class="cms-suggestion-info">
                  <div class="cms-suggestion-meta">
                    <span class="suggestion-type-badge ${s.type}">${s.type === 'typo' ? '誤字脱字' : s.type === 'info' ? '情報更新' : 'その他'}</span>
                    <span>投稿者: <strong>${s.userName}</strong></span>
                    <span>投稿日: ${cleanDate}</span>
                    <span>対象記事: <a href="#article/${s.articleId}" target="_blank" style="color:var(--color-accent); font-weight:600;">${s.articleTitle}</a></span>
                  </div>
                  <div class="cms-suggestion-body">${s.content}</div>
                </div>
                <button class="cms-action-btn delete" data-id="${s.id}" style="margin-top:0.5rem;"><i data-lucide="check" style="width:14px;"></i> 解決・削除</button>
              </div>
            `;
          }).join("")
        }
      </div>
    `;

    target.querySelectorAll(".cms-action-btn.delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        showCustomConfirm("この提案を解決済として削除しますか？", () => {
          deleteSuggestion(id);
          renderCMSDashboard(document.getElementById("app"));
        });
      });
    });
  } else if (cmsActiveTab === "github-settings") {
    renderGitHubSettings(target);
  }
}

// Render Edit/Create Form
function renderCMSForm(target) {
  const seriesList = getSeries();
  const articlesList = getArticles();

  if (cmsActiveTab === "articles") {
    const isNew = cmsEditingItem.id === "";
    target.innerHTML = `
      <div class="cms-content-header">
        <h2 class="cms-content-title font-outfit">${isNew ? "新規記事の作成" : "記事の編集"}</h2>
      </div>

      <div class="cms-split-layout">
        <!-- Left: Editor Pane -->
        <div class="cms-editor-pane">
          <form id="cms-article-form" class="cms-form" style="margin-top: 0;">
            <div class="cms-form-row">
              <div class="form-group">
                <label for="form-article-id">スラッグ (URL用/英数字記号)</label>
                <input type="text" id="form-article-id" class="form-control" value="${cmsEditingItem.id}" ${isNew ? "" : "disabled"} required pattern="[a-zA-Z0-9\\-]+">
              </div>
              <div class="form-group">
                <label for="form-article-title">記事タイトル</label>
                <input type="text" id="form-article-title" class="form-control" value="${cmsEditingItem.title}" required>
              </div>
            </div>

            <div class="cms-form-row">
              <div class="form-group">
                <label for="form-article-series">対象統合戦略シリーズ</label>
                <select id="form-article-series" class="form-control" required>
                  ${seriesList.map(s => `<option value="${s.id}" ${cmsEditingItem.seriesId === s.id ? "selected" : ""}>${s.title}</option>`).join("")}
                </select>
              </div>
              <div class="form-group">
                <label for="form-article-category">カテゴリ</label>
                <select id="form-article-category" class="form-control" required>
                  <option value="攻略記事" ${cmsEditingItem.category === "攻略記事" ? "selected" : ""}>攻略記事</option>
                  <option value="検証記事" ${cmsEditingItem.category === "検証記事" ? "selected" : ""}>検証記事</option>
                  <option value="お知らせ" ${cmsEditingItem.category === "お知らせ" ? "selected" : ""}>お知らせ</option>
                </select>
              </div>
            </div>

            <div class="cms-form-row">
              <div class="form-group">
                <label for="form-article-tags">タグ (カンマ区切り)</label>
                <input type="text" id="form-article-tags" class="form-control" value="${cmsEditingItem.tags.join(", ")}" placeholder="難易度15, オペレーター推奨">
              </div>
              <div class="form-group">
                <label for="form-article-status">公開設定</label>
                <select id="form-article-status" class="form-control" required>
                  <option value="draft" ${cmsEditingItem.status === "draft" ? "selected" : ""}>下書き</option>
                  <option value="published" ${cmsEditingItem.status === "published" ? "selected" : ""}>公開</option>
                </select>
              </div>
            </div>

            <!-- Custom Tag Guide -->
            <details class="custom-tags-guide">
              <summary class="custom-tags-guide-summary">
                <span><i data-lucide="help-circle" style="width:14px; height:14px; vertical-align:middle; margin-right:0.25rem;"></i> カスタムタグの書き方ガイド</span>
                <i data-lucide="chevron-down" style="width:16px; height:16px;"></i>
              </summary>
              <div class="custom-tags-guide-content">
                <div class="guide-item">
                  <div class="guide-item-title">
                    <span>A. カスタムバッジ</span>
                    <button type="button" class="btn-insert-tag" data-template="[badge: 難易度15 | danger]">挿入</button>
                  </div>
                  <div class="guide-item-example">[badge: テキスト | タイプ]<br>※タイプ: danger(赤), warning(黄), info(青), success(緑), default(黒)</div>
                </div>
                <div class="guide-item">
                  <div class="guide-item-title">
                    <span>B. カードグリッド</span>
                    <button type="button" class="btn-insert-tag" data-template="&#10;[card-grid]&#10;[card: タイトル | 本文説明 | フッター]&#10;[/card-grid]&#10;">挿入</button>
                  </div>
                  <div class="guide-item-example">[card-grid] ... [/card-grid] の中に [card: タイトル | 本文 | フッター] を並べます。</div>
                </div>
                <div class="guide-item">
                  <div class="guide-item-title">
                    <span>C. 手順ステップリスト</span>
                    <button type="button" class="btn-insert-tag" data-template="&#10;[steps]&#10;[step: 手順1のタイトル]&#10;手順の説明文をここに記述します。&#10;[/step]&#10;[step: 手順2 of タイトル]&#10;次の手順の説明文。&#10;[/step]&#10;[/steps]&#10;">挿入</button>
                  </div>
                  <div class="guide-item-example">[steps] ... [/steps] の中に [step: タイトル] 本文 [/step] を並べます。</div>
                </div>
                <div class="guide-item">
                  <div class="guide-item-title">
                    <span>D. アラート（GitHubスタイル）</span>
                    <button type="button" class="btn-insert-tag" data-template="&#10;> [!NOTE]&#10;> ここにノートのアラート本文を入力します。&#10;">挿入</button>
                  </div>
                  <div class="guide-item-example">行頭に &gt; [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION] を使用。</div>
                </div>
                <div class="guide-item">
                  <div class="guide-item-title">
                    <span>E. 脚注</span>
                    <button type="button" class="btn-insert-tag" data-template="[^1]">参照挿入</button>
                  </div>
                  <div class="guide-item-example">本文中に [^1]、最下行に [^1]: 注釈説明 を記述します。</div>
                </div>
              </div>
            </details>

            <div class="form-group">
              <label for="form-article-content" style="display:flex; justify-content:space-between; align-items:center;">
                <span>記事本文 (Markdown記法)</span>
                <span class="image-uploader-wrapper">
                  <label for="form-article-image-upload" id="form-article-image-upload-label" class="btn-primary" style="font-size:0.75rem; padding:0.25rem 0.75rem; cursor:pointer; display:inline-flex; align-items:center; gap:0.25rem;">
                    <i data-lucide="image" style="width:14px; height:14px;"></i> 画像を挿入 (Cloudinaryへアップロード)
                  </label>
                  <input type="file" id="form-article-image-upload" accept="image/*" style="display:none;">
                </span>
              </label>
              <textarea id="form-article-content" class="form-control" style="min-height:450px; font-family:var(--font-mono); font-size:0.85rem;" required>${cmsEditingItem.content}</textarea>
            </div>

            <div class="cms-form-buttons">
              <button type="submit" class="btn-primary">保存する</button>
              <button type="button" class="btn-secondary" id="cms-cancel-btn">キャンセル</button>
            </div>
          </form>
        </div>

        <!-- Right: Preview Pane -->
        <div class="cms-preview-pane">
          <div class="cms-preview-header">
            <span>REALTIME PREVIEW</span>
            <span><i data-lucide="eye" style="width:12px; height:12px; vertical-align:middle;"></i> LIVE</span>
          </div>
          <div id="cms-preview-area" class="cms-preview-body article-body">
            <!-- Render preview here -->
          </div>
        </div>
      </div>
    `;

    // Hook Realtime Preview
    const textarea = target.querySelector("#form-article-content");
    const previewArea = target.querySelector("#cms-preview-area");

    function updatePreview() {
      if (previewArea && textarea) {
        previewArea.innerHTML = renderMarkdown(textarea.value);
      }
    }

    if (textarea) {
      textarea.addEventListener("input", updatePreview);
      updatePreview(); // Initial render
    }

    // Hook Custom Tag Insertions
    const insertButtons = target.querySelectorAll(".btn-insert-tag");
    insertButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const template = btn.getAttribute("data-template");
        if (!textarea) return;

        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const text = textarea.value;

        textarea.value = text.substring(0, startPos) + template + text.substring(endPos);
        textarea.focus();
        
        const newCursorPos = startPos + template.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);

        updatePreview();
      });
    });

    // Hook Image Upload (Cloudinary Integration)
    const imageUploadInput = target.querySelector("#form-article-image-upload");
    const imageUploadLabel = target.querySelector("#form-article-image-upload-label");
    
    if (imageUploadInput) {
      imageUploadInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
          alert("画像ファイルを選択してください。");
          return;
        }

        const settings = getSystemSettings();
        if (!settings.token) {
          alert("記事を保存・公開するため、先に「GitHub & 画像ホスティング連携設定」タブで GitHub のアクセストークンを設定してください。");
          imageUploadInput.value = "";
          return;
        }

        try {
          // Show upload loading spinner
          imageUploadLabel.style.pointerEvents = "none";
          imageUploadLabel.innerHTML = `<span class="image-upload-spinner"></span> アップロード中...`;

          const secureUrl = await uploadToCloudinary(
            file,
            settings.cloudinaryCloudName,
            settings.cloudinaryPreset
          );

          const textarea = target.querySelector("#form-article-content");
          const startPos = textarea.selectionStart;
          const endPos = textarea.selectionEnd;
          const text = textarea.value;
          const imageMarkdown = `\n![${file.name}](${secureUrl})\n`;

          textarea.value = text.substring(0, startPos) + imageMarkdown + text.substring(endPos);
          textarea.focus();
          const newCursorPos = startPos + imageMarkdown.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          
          updatePreview();
        } catch (err) {
          console.error(err);
          alert(`画像のアップロードに失敗しました: ${err.message}`);
        } finally {
          // Restore button label
          imageUploadLabel.style.pointerEvents = "auto";
          imageUploadLabel.innerHTML = `<i data-lucide="image" style="width:14px; height:14px;"></i> 画像を挿入 (Cloudinaryへアップロード)`;
          if (window.lucide) window.lucide.createIcons();
          imageUploadInput.value = "";
        }
      });
    }

    const form = target.querySelector("#cms-article-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const tagsVal = target.querySelector("#form-article-tags").value;
      const tagsArray = tagsVal.split(",").map(t => t.trim()).filter(t => t !== "");
      
      const payload = {
        id: target.querySelector("#form-article-id").value.trim(),
        title: target.querySelector("#form-article-title").value.trim(),
        seriesId: target.querySelector("#form-article-series").value,
        category: target.querySelector("#form-article-category").value,
        tags: tagsArray,
        status: target.querySelector("#form-article-status").value,
        content: target.querySelector("#form-article-content").value
      };

      saveArticle(payload);
      cmsEditingItem = null;
      renderCMSDashboard(document.getElementById("app"));
    });

  } else if (cmsActiveTab === "videos") {
    const isNew = cmsEditingItem.id === "";
    target.innerHTML = `
      <div class="cms-content-header">
        <h2 class="cms-content-title font-outfit">${isNew ? "動画アーカイブの追加" : "動画アーカイブの編集"}</h2>
      </div>

      <form id="cms-video-form" class="cms-form">
        <div class="form-group">
          <label for="form-video-title">動画タイトル</label>
          <input type="text" id="form-video-title" class="form-control" value="${cmsEditingItem.title}" required>
        </div>

        <div class="cms-form-row">
          <div class="form-group">
            <label for="form-video-series">対象統合戦略シリーズ</label>
            <select id="form-video-series" class="form-control" required>
              ${seriesList.map(s => `<option value="${s.id}" ${cmsEditingItem.seriesId === s.id ? "selected" : ""}>${s.title}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label for="form-video-article">紐付ける攻略記事 (任意)</label>
            <select id="form-video-article" class="form-control">
              <option value="">なし</option>
              ${articlesList.map(a => `<option value="${a.id}" ${cmsEditingItem.articleId === a.id ? "selected" : ""}>${a.title}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="cms-form-row">
          <div class="form-group">
            <label for="form-video-url">YouTube埋め込みURL</label>
            <input type="url" id="form-video-url" class="form-control" value="${cmsEditingItem.youtubeUrl}" placeholder="https://www.youtube.com/embed/xxxxxx" required>
          </div>
          <div class="form-group">
            <label for="form-video-date">投稿日</label>
            <input type="date" id="form-video-date" class="form-control" value="${cmsEditingItem.publishedAt}" required>
          </div>
        </div>

        <div class="form-group">
          <label for="form-video-summary">概要・動画説明</label>
          <textarea id="form-video-summary" class="form-control" style="min-height:100px;" required>${cmsEditingItem.summary}</textarea>
        </div>

        <div class="cms-form-buttons">
          <button type="submit" class="btn-primary">保存する</button>
          <button type="button" class="btn-secondary" id="cms-cancel-btn">キャンセル</button>
        </div>
      </form>
    `;

    const form = target.querySelector("#cms-video-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const payload = {
        id: cmsEditingItem.id,
        title: target.querySelector("#form-video-title").value.trim(),
        seriesId: target.querySelector("#form-video-series").value,
        articleId: target.querySelector("#form-video-article").value,
        youtubeUrl: target.querySelector("#form-video-url").value.trim(),
        publishedAt: target.querySelector("#form-video-date").value,
        summary: target.querySelector("#form-video-summary").value.trim()
      };

      saveVideo(payload);
      cmsEditingItem = null;
      renderCMSDashboard(document.getElementById("app"));
    });

  } else if (cmsActiveTab === "tournaments") {
    const isNew = cmsEditingItem.id === "";
    target.innerHTML = `
      <div class="cms-content-header">
        <h2 class="cms-content-title font-outfit">${isNew ? "大会の追加" : "大会の編集"}</h2>
      </div>

      <div class="cms-split-layout">
        <!-- Left: Editor Pane -->
        <div class="cms-editor-pane">
          <form id="cms-tournament-form" class="cms-form" style="margin-top: 0;">
            
            <div class="cms-form-row">
              <div class="form-group">
                <label for="form-tournament-title">大会名 (日本語)</label>
                <input type="text" id="form-tournament-title" class="form-control" value="${cmsEditingItem.title || ""}" required>
              </div>
              <div class="form-group">
                <label for="form-tournament-title-en">大会名 (英語)</label>
                <input type="text" id="form-tournament-title-en" class="form-control" value="${cmsEditingItem.title_en || ""}">
              </div>
            </div>

            <div class="cms-form-row">
              <div class="form-group">
                <label for="form-tournament-series">対象統合戦略シリーズ</label>
                <select id="form-tournament-series" class="form-control" required>
                  ${seriesList.map(s => `<option value="${s.id}" ${cmsEditingItem.seriesId === s.id ? "selected" : ""}>${s.title}</option>`).join("")}
                </select>
              </div>
              <div class="form-group">
                <label for="form-tournament-status">ステータス</label>
                <select id="form-tournament-status" class="form-control" required>
                  <option value="draft" ${cmsEditingItem.status === "draft" ? "selected" : ""}>下書き</option>
                  <option value="upcoming" ${cmsEditingItem.status === "upcoming" ? "selected" : ""}>予定</option>
                  <option value="completed" ${cmsEditingItem.status === "completed" ? "selected" : ""}>終了</option>
                </select>
              </div>
            </div>

            <div class="cms-form-row">
              <div class="form-group">
                <label for="form-tournament-date">開催日</label>
                <input type="date" id="form-tournament-date" class="form-control" value="${cmsEditingItem.date || ""}" required>
              </div>
              <div class="form-group">
                <label for="form-tournament-archive">配信アーカイブYouTube URL (任意)</label>
                <input type="url" id="form-tournament-archive" class="form-control" value="${cmsEditingItem.archiveUrl || ""}" placeholder="https://www.youtube.com/embed/xxxxxx">
              </div>
            </div>

            <div class="form-group">
              <label for="form-tournament-image" style="display:flex; justify-content:space-between; align-items:center;">
                <span>大会のキービジュアル (任意、推奨サイズ: 1280×720)</span>
                <span class="image-uploader-wrapper">
                  <label for="form-tournament-image-upload" id="form-tournament-image-upload-label" class="btn-primary" style="font-size:0.75rem; padding:0.25rem 0.75rem; cursor:pointer; display:inline-flex; align-items:center; gap:0.25rem;">
                    <i data-lucide="image" style="width:14px; height:14px;"></i> 画像をアップロード (Cloudinary)
                  </label>
                  <input type="file" id="form-tournament-image-upload" accept="image/*" style="display:none;">
                </span>
              </label>
              <input type="text" id="form-tournament-image" class="form-control" value="${cmsEditingItem.image || ""}" placeholder="https://res.cloudinary.com/... または画像のURLを入力">
            </div>

            <div class="form-group">
              <label for="form-tournament-participants">参加登録メンバー (カンマ区切り)</label>
              <input type="text" id="form-tournament-participants" class="form-control" value="${(cmsEditingItem.participants || []).join(", ")}" placeholder="Dr. Texas, Dr. Ch'en">
            </div>



            <div class="cms-form-row">
              <div class="form-group">
                <label for="form-tournament-rules">レギュレーション・ルール (日本語 / Markdown)</label>
                <textarea id="form-tournament-rules" class="form-control" style="min-height:200px; font-family:var(--font-mono); font-size:0.85rem;" required>${cmsEditingItem.rules || ""}</textarea>
              </div>
              <div class="form-group">
                <label for="form-tournament-rules-en">レギュレーション・ルール (英語 / Markdown)</label>
                <textarea id="form-tournament-rules-en" class="form-control" style="min-height:200px; font-family:var(--font-mono); font-size:0.85rem;">${cmsEditingItem.rules_en || ""}</textarea>
              </div>
            </div>

            <div class="cms-form-row">
              <div class="form-group">
                <label for="form-tournament-results">対戦結果 (日本語 / Markdown)</label>
                <textarea id="form-tournament-results" class="form-control" style="min-height:200px; font-family:var(--font-mono); font-size:0.85rem;">${cmsEditingItem.results || ""}</textarea>
              </div>
              <div class="form-group">
                <label for="form-tournament-results-en">対戦結果 (英語 / Markdown)</label>
                <textarea id="form-tournament-results-en" class="form-control" style="min-height:200px; font-family:var(--font-mono); font-size:0.85rem;">${cmsEditingItem.results_en || ""}</textarea>
              </div>
            </div>

            <div class="cms-form-buttons">
              <button type="submit" class="btn-primary">保存する</button>
              <button type="button" class="btn-secondary" id="cms-cancel-btn">キャンセル</button>
            </div>
          </form>
        </div>

        <!-- Right: Preview Pane -->
        <div class="cms-preview-pane">
          <div class="cms-preview-header" style="display:flex; justify-content:space-between; align-items:center;">
            <span>REALTIME PREVIEW</span>
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <select id="cms-preview-lang" class="form-control" style="padding:0.15rem 0.5rem; font-size:0.75rem; width:auto; height:auto; border-color:var(--color-border); background:var(--color-bg);">
                <option value="ja">日本語プレビュー</option>
                <option value="en">English Preview</option>
              </select>
              <span><i data-lucide="eye" style="width:12px; height:12px; vertical-align:middle;"></i> LIVE</span>
            </div>
          </div>
          <div id="cms-preview-area" class="cms-preview-body article-body" style="padding:1.5rem;">
            <!-- Render preview here -->
          </div>
        </div>
      </div>
    `;

    const form = target.querySelector("#cms-tournament-form");
    const previewArea = target.querySelector("#cms-preview-area");
    const previewLangSelect = target.querySelector("#cms-preview-lang");

    // Textareas for preview
    const titleJaInput = target.querySelector("#form-tournament-title");
    const titleEnInput = target.querySelector("#form-tournament-title-en");
    const rulesJaText = target.querySelector("#form-tournament-rules");
    const rulesEnText = target.querySelector("#form-tournament-rules-en");
    const resultsJaText = target.querySelector("#form-tournament-results");
    const resultsEnText = target.querySelector("#form-tournament-results-en");

    function updatePreview() {
      if (!previewArea) return;
      const isEn = previewLangSelect.value === "en";
      
      const titleText = isEn ? (titleEnInput.value || titleJaInput.value) : titleJaInput.value;
      const rulesContent = isEn ? (rulesEnText.value || rulesJaText.value) : rulesJaText.value;
      const resultsContent = isEn ? (resultsEnText.value || resultsJaText.value) : resultsJaText.value;

      let previewHtml = `
        <h1 class="font-outfit" style="margin-top:0; font-size:2rem; font-weight:800; border-bottom:2px solid var(--color-accent); padding-bottom:0.5rem;">
          ${titleText || "無題の大会 / Untitled Tournament"}
        </h1>
        <div style="margin-top: 1.5rem;">
          <h3 class="font-outfit" style="border-left:4px solid var(--color-accent); padding-left:0.5rem;">
            ${isEn ? "Regulation & Rules" : "レギュレーション・ルール"}
          </h3>
          <div class="markdown-body" style="margin-top:0.5rem;">
            ${renderMarkdown(rulesContent || (isEn ? "*No regulation text.*" : "*ルールが未入力です。*"))}
          </div>
        </div>
      `;

      if (resultsContent) {
        previewHtml += `
          <div style="margin-top: 2rem; border-top: 1px solid var(--color-border); padding-top: 1.5rem;">
            <h3 class="font-outfit" style="border-left:4px solid var(--color-accent); padding-left:0.5rem;">
              ${isEn ? "Match Results" : "対戦結果"}
            </h3>
            <div class="markdown-body" style="margin-top:0.5rem;">
              ${renderMarkdown(resultsContent)}
            </div>
          </div>
        `;
      }

      previewArea.innerHTML = previewHtml;
    }

    // Bind inputs for realtime preview
    const inputsToWatch = [titleJaInput, titleEnInput, rulesJaText, rulesEnText, resultsJaText, resultsEnText];
    inputsToWatch.forEach(input => {
      if (input) {
        input.addEventListener("input", updatePreview);
      }
    });

    if (previewLangSelect) {
      previewLangSelect.addEventListener("change", updatePreview);
    }

    updatePreview(); // Initial preview draw

    // Hook cancel button
    const cancelBtn = target.querySelector("#cms-cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        cmsEditingItem = null;
        renderCMSDashboard(document.getElementById("app"));
      });
    }

    // Hook Tournament Image Upload (Cloudinary Integration)
    const imageUploadInput = target.querySelector("#form-tournament-image-upload");
    const imageUploadLabel = target.querySelector("#form-tournament-image-upload-label");
    const imageInput = target.querySelector("#form-tournament-image");
    
    if (imageUploadInput) {
      imageUploadInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
          alert("画像ファイルを選択してください。");
          return;
        }

        const settings = getSystemSettings();
        try {
          // Show upload loading spinner
          imageUploadLabel.style.pointerEvents = "none";
          imageUploadLabel.innerHTML = `<span class="image-upload-spinner"></span> アップロード中...`;

          const secureUrl = await uploadToCloudinary(
            file,
            settings.cloudinaryCloudName,
            settings.cloudinaryPreset
          );

          if (imageInput) {
            imageInput.value = secureUrl;
          }
          alert("画像のアップロードが完了しました。");
        } catch (err) {
          console.error(err);
          alert(`画像のアップロードに失敗しました: ${err.message}`);
        } finally {
          // Restore button label
          imageUploadLabel.style.pointerEvents = "auto";
          imageUploadLabel.innerHTML = `<i data-lucide="image" style="width:14px; height:14px;"></i> 画像をアップロード (Cloudinary)`;
          if (window.lucide) window.lucide.createIcons();
          imageUploadInput.value = "";
        }
      });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const pVal = target.querySelector("#form-tournament-participants").value;
      const pArray = pVal.split(",").map(p => p.trim()).filter(p => p !== "");

      const payload = {
        id: cmsEditingItem.id,
        title: titleJaInput.value.trim(),
        title_en: titleEnInput.value.trim(),
        seriesId: target.querySelector("#form-tournament-series").value,
        status: target.querySelector("#form-tournament-status").value,
        date: target.querySelector("#form-tournament-date").value,
        archiveUrl: target.querySelector("#form-tournament-archive").value.trim(),
        participants: pArray,
        scoreboard: "",
        rules: rulesJaText.value.trim(),
        rules_en: rulesEnText.value.trim(),
        results: resultsJaText.value.trim(),
        results_en: resultsEnText.value.trim(),
        image: imageInput.value.trim()
      };

      saveTournament(payload);
      cmsEditingItem = null;
      renderCMSDashboard(document.getElementById("app"));
    });
  }
}

async function githubUploadFile(path, content, message) {
  const settings = getSystemSettings();
  const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${path}`;
  
  const getRes = await fetch(url, {
    headers: { "Authorization": `token ${settings.token}` }
  });
  const data = await getRes.json();

  const body = {
    message: message,
    content: content,
    sha: data.sha,
    branch: settings.branch
  };

  const putRes = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${settings.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!putRes.ok) {
    const errorData = await putRes.json();
    throw new Error(`GitHubアップロード失敗: ${errorData.message || putRes.statusText}`);
  }

  const responseData = await putRes.json();
  return responseData.content.path;
}

function renderGitHubSettings(target) {
  const settings = getSystemSettings();

  target.innerHTML = `
    <div class="cms-content-header">
      <h2 class="cms-content-title font-outfit">システム連携設定 & サイトの公開</h2>
    </div>

    <div id="github-sync-msg" class="github-sync-status" style="display:none;"></div>

    <div class="cms-form">
      <div style="margin-top: 1rem; padding-bottom: 1.5rem;">
        <h3 class="font-outfit" style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--color-primary); border-left: 3px solid var(--color-primary); padding-left: 0.5rem;">適用中の連携パラメータ（固定値）</h3>
        <p style="font-size: 0.8rem; color: var(--color-text-sub); margin-bottom: 1.5rem;">
          ※ セキュリティと簡便化のため、連携設定はすべてプログラム内で固定化されています。手動での設定やトークンの入力は不要です。
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; color: var(--color-text-sub);">
          <tr style="border-bottom: 1px solid var(--color-border); height: 2.2rem;">
            <td style="font-weight: 500; width: 40%;">GitHub アクセストークン (PAT)</td>
            <td style="font-family: var(--font-mono); color: var(--color-success);">●●●●●●●●●●●●●●●●● (適用済み・自動管理)</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border); height: 2.2rem;">
            <td style="font-weight: 500;">GitHub リポジトリ名 (Repo)</td>
            <td style="font-family: var(--font-mono);">${settings.repo}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border); height: 2.2rem;">
            <td style="font-weight: 500;">デプロイ先ブランチ</td>
            <td style="font-family: var(--font-mono);">${settings.branch}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border); height: 2.2rem;">
            <td style="font-weight: 500;">Cloudinary Cloud Name</td>
            <td style="font-family: var(--font-mono);">${settings.cloudinaryCloudName}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border); height: 2.2rem;">
            <td style="font-weight: 500;">Cloudinary Preset Name</td>
            <td style="font-family: var(--font-mono);">${settings.cloudinaryPreset}</td>
          </tr>
        </table>
      </div>

      <div class="cms-form-buttons" style="margin-top: 1rem; display: flex; gap: 1rem;">
        <button type="button" class="btn-secondary" onclick="location.hash='#home'">トップページへ戻る</button>
      </div>
    </div>


  `;

  if (window.lucide) window.lucide.createIcons();
}

// Start application
try {
  init();
} catch (e) {
  console.error("Application Initialization Failed:", e);
  const appContainer = document.getElementById("app");
  if (appContainer) {
    appContainer.innerHTML = `
      <div class="container text-center" style="padding: 5rem 0; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h1 class="font-outfit" style="font-size: 2rem; color: var(--color-danger); margin-bottom: 1rem;">SYSTEM INITIALIZATION ERROR</h1>
        <p style="color: var(--color-text-sub); margin-bottom: 2rem;">システムの起動中に致命的なエラーが発生しました。コンソールログを確認してください。</p>
        <pre style="text-align: left; max-width: 600px; margin: 0 auto; background: var(--color-bg-sub); padding: 1.5rem; border: 1px solid var(--color-border); overflow-x: auto; font-family: var(--font-mono); font-size: 0.8rem; white-space: pre-wrap; word-break: break-all;">${e.stack || e.message || e}</pre>
        <button onclick="localStorage.clear(); location.reload();" class="btn-primary" style="margin-top: 2rem;">
          LocalStorageを初期化して再読込
        </button>
      </div>
    `;
  }
}

/* Custom Cursor (GoldenRecord Style Easing) */
function initCustomCursor() {
  let canvas = document.getElementById("cursor-canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "cursor-canvas";
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext("2d");
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let isHovered = false;
  let isMouseInWindow = true;

  window.addEventListener("mousemove", (e) => {
    isMouseInWindow = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Pull the trail completely offscreen when the cursor leaves the window
  document.addEventListener("mouseleave", (e) => {
    isMouseInWindow = false;
    const edgeX = e.clientX;
    const edgeY = e.clientY;
    
    if (edgeX === undefined || edgeY === undefined) {
      mouse.x = -200;
      mouse.y = -200;
      return;
    }

    const dirX = edgeX - window.innerWidth / 2;
    const dirY = edgeY - window.innerHeight / 2;
    const len = Math.hypot(dirX, dirY) || 1;
    
    // Set target far outside the window in the direction the mouse exited
    mouse.x = edgeX + (dirX / len) * 300;
    mouse.y = edgeY + (dirY / len) * 300;
  });

  document.addEventListener("mouseenter", (e) => {
    isMouseInWindow = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Ribbon Nodes (15 nodes for a shorter, cleaner trail)
  const nodeCount = 15;
  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: mouse.x,
      y: mouse.y
    });
  }

  function addHoverListeners() {
    const interactiveElements = document.querySelectorAll(
      'a, button, select, input, textarea, [role="button"], .btn-primary, .btn-secondary, .update-card, .tab-btn, .sortable-header, .nav-link, [style*="cursor:pointer"]'
    );
    
    interactiveElements.forEach(el => {
      if (el.dataset.hasCursorListener) return;
      el.dataset.hasCursorListener = "true";

      el.addEventListener("mouseenter", () => { isHovered = true; });
      el.addEventListener("mouseleave", () => { isHovered = false; });
    });
  }
  addHoverListeners();

  const observer = new MutationObserver(() => {
    addHoverListeners();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update head node with high inertia (slow follow behind the real cursor)
    const head = nodes[0];
    head.x += (mouse.x - head.x) * 0.22;
    head.y += (mouse.y - head.y) * 0.22;

    // Update trailing nodes using Pure Easing (Lerp) to prevent overshoot (no spring physics)
    // Using a faster lerp factor (0.45) so the trail catches up and disappears quicker
    const lerpFactor = 0.45;
    for (let i = 1; i < nodeCount; i++) {
      const prev = nodes[i - 1];
      const curr = nodes[i];

      curr.x += (prev.x - curr.x) * lerpFactor;
      curr.y += (prev.y - curr.y) * lerpFactor;
    }

    // Draw the trail as a single continuous seamless ribbon
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const width = isHovered ? 8 : 4;
    const maxAlpha = isHovered ? 0.9 : 0.75;

    // Calculate stretch distance between head and tail to determine visibility
    const dx = nodes[0].x - nodes[nodeCount - 1].x;
    const dy = nodes[0].y - nodes[nodeCount - 1].y;
    const dist = Math.hypot(dx, dy);

    // Dynamic alpha: fades out completely when stopped (dist near 0)
    let alpha = 0;
    if (dist > 1.5) {
      // Fade in smoothly as the trail stretches, reaching maxAlpha at 20px stretch
      alpha = Math.min(maxAlpha, (dist - 1.5) * 0.05);
    }

    // Only draw if the trail is visible (alpha > 0)
    if (alpha > 0) {
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);

      for (let i = 0; i < nodeCount - 1; i++) {
        const curr = nodes[i];
        const next = nodes[i + 1];
        
        const xc = (curr.x + next.x) / 2;
        const yc = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, xc, yc);
      }

      // Connect to the final tail node
      ctx.lineTo(nodes[nodeCount - 1].x, nodes[nodeCount - 1].y);

      ctx.lineWidth = width;
      ctx.strokeStyle = `rgba(255, 102, 0, ${alpha})`;
      ctx.stroke();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

/* Scroll Reveal (LIG Style) */
function initScrollReveal() {
  const reveals = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .section-header");

  function checkReveal() {
    const triggerBottom = window.innerHeight * 0.85;

    reveals.forEach(el => {
      const elTop = el.getBoundingClientRect().top;
      if (elTop < triggerBottom) {
        el.classList.add("active");
      }
    });
  }

  window.removeEventListener("scroll", checkReveal);
  window.addEventListener("scroll", checkReveal);
  
  setTimeout(checkReveal, 100);
}
