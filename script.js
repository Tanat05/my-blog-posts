const GITHUB_USER = 'Tanat05';
const GITHUB_REPO = 'my-blog-posts';
const POSTS_DIR = 'posts';

const GISCUS_REPO = 'Tanat05/my-blog-posts';
const GISCUS_REPO_ID = 'R_kgDOPAg55g';
const GISCUS_CATEGORY_ID = 'DIC_kwDOPAg55s4Cr42K';


marked.setOptions({
  gfm: true,
  breaks: true,
  pedantic: false,
  smartLists: true,
  smartypants: false,
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
});

const contentContainer = document.getElementById('content-container');
const bannerContainer = document.getElementById('banner-container');
const mobileProfileContainer = document.getElementById('mobile-profile-container');

let currentPage = 1;
const postsPerPage = 9;
const RECENT_POSTS_LIMIT = 5;

function parseFrontmatter(text) {
    const frontmatter = {};
    const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
    const match = frontmatterRegex.exec(text);
    if (!match) return { frontmatter: {}, content: text };
    const yaml = match[1];
    const content = text.slice(match[0].length);
    let currentListKey = null;
    let lastListItem = null;
    yaml.split('\n').forEach(line => {
        if (line.trim() === '') return;
        const indent = line.match(/^\s*/)[0].length;
        if (indent === 0) {
            currentListKey = null;
            const parts = line.split(':');
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            if (value) {
                frontmatter[key] = value.replace(/^['"]|['"]$/g, '');
            } else {
                frontmatter[key] = [];
                currentListKey = key;
            }
        } else if (currentListKey && /^\s*-/.test(line)) {
            const itemMatch = line.match(/^\s*-\s*(\w+):\s*(.*)/);
            if (itemMatch) {
                const [, key, value] = itemMatch;
                lastListItem = { [key]: value.replace(/^['"]|['"]$/g, '') };
                frontmatter[currentListKey].push(lastListItem);
            }
        } else if (lastListItem && /^\s+/.test(line)) {
            const subItemMatch = line.match(/^\s+(\w+):\s*(.*)/);
            if(subItemMatch) {
                const [, key, value] = subItemMatch;
                lastListItem[key] = value.replace(/^['"]|['"]$/g, '');
            }
        }
    });
    return { frontmatter, content };
}

function formatTitleFromId(id) {
    const nameOnly = id.replace(/\.md$/, '');
    const titlePart = nameOnly.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    return titlePart.replace(/-+/g, ' ');
}

function applyConfig(config) {
    if (!config) return;
    const root = document.documentElement;
    if (config.background_image) {
        root.style.setProperty('--bg-image', `url(${config.background_image})`);
        root.style.setProperty('--bg-gradient', 'none');
    } else if (config.background_gradient_start && config.background_gradient_end) {
        root.style.setProperty('--bg-gradient', `linear-gradient(45deg, ${config.background_gradient_start}, ${config.background_gradient_end})`);
        root.style.setProperty('--bg-image', 'none');
    }
    root.style.setProperty('--accent-color', config.accent_color || '#ffffff');
    root.style.setProperty('--primary-text-color', config.primary_text_color || '#e0e0e0');
    root.style.setProperty('--secondary-text-color', config.secondary_text_color || '#a0a0a0');
    if (config.font_family) {
        const fontName = config.font_family.split(',')[0].replace(/['"]/g, '').replace(/\s/g, '+');
        const fontLink = document.getElementById('main-font');
        if (fontLink && !fontLink.href.includes(fontName)) {
           fontLink.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;700;900&display=swap`;
        }
        root.style.setProperty('--font-family', config.font_family);
    }
}

function renderBanner(config) {
    if (!config || (!config.banner_image && !config.banner_text)) {
        bannerContainer.style.display = 'none';
        return;
    }
    bannerContainer.style.display = 'block';
    if (config.banner_image) {
        bannerContainer.style.backgroundImage = `url(${config.banner_image})`;
    } else {
        bannerContainer.style.backgroundColor = 'var(--surface-color)';
    }
    let bannerContent = '<div class="banner-content">';
    if (config.banner_text) {
        bannerContent += `<h1 class="banner-title">${config.banner_text}</h1>`;
    }
    if (config.banner_subtext) {
        bannerContent += `<p class="banner-subtitle">${config.banner_subtext}</p>`;
    }
    bannerContent += '</div>';
    bannerContainer.innerHTML = bannerContent;
}

async function loadConfigData() {
    try {
        const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/config.md`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('config.md not found');
        const text = await response.text();
        const { frontmatter } = parseFrontmatter(text);
        return frontmatter;
    } catch (error) {
        console.error("Failed to load config data:", error);
        return null;
    }
}

async function fetchAllPosts() {
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${POSTS_DIR}`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    const files = await response.json();
    if (!Array.isArray(files)) throw new Error("Folder not found or is empty.");
    
    const postPromises = files.filter(file => file.name.endsWith('.md')).map(async file => {
        const id = file.name.replace(/\.md$/, '');
        const fileResponse = await fetch(file.download_url);
        const text = await fileResponse.text();
        const { frontmatter } = parseFrontmatter(text);
        const title = formatTitleFromId(file.name);
        return { id, title, pinned: frontmatter.pinned === 'true', ...frontmatter };
    });
    
    const allPosts = await Promise.all(postPromises);
    const sortByDate = (a, b) => new Date(b.date) - new Date(a.date);
    const pinnedPosts = allPosts.filter(p => p.pinned).sort(sortByDate);
    const regularPosts = allPosts.filter(p => !p.pinned).sort(sortByDate);
    
    return [...pinnedPosts, ...regularPosts];
}

async function fetchSinglePost(postId) {
    const fileUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/${POSTS_DIR}/${postId}.md`;
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`File load error: ${response.statusText}`);
    const text = await response.text();
    const { frontmatter, content } = parseFrontmatter(text);
    const title = formatTitleFromId(postId);
    const contentHtml = marked.parse(content);
    return { title, contentHtml, frontmatter };
}

async function loadProfileData() {
    try {
        const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/profile.md`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('profile.md not found');
        const text = await response.text();
        const { frontmatter } = parseFrontmatter(text);
        return frontmatter;
    } catch (error) {
        console.error("Failed to load profile data:", error);
        return null;
    }
}

function getRecentPosts() {
    const posts = sessionStorage.getItem('recentPosts');
    return posts ? JSON.parse(posts) : [];
}

function addRecentPost(post) {
    let recentPosts = getRecentPosts();
    recentPosts = recentPosts.filter(p => p.id !== post.id);
    recentPosts.unshift(post);
    if (recentPosts.length > RECENT_POSTS_LIMIT) {
        recentPosts.pop();
    }
    sessionStorage.setItem('recentPosts', JSON.stringify(recentPosts));
    renderRecentPosts();
}

function renderRecentPosts() {
    const recentPosts = getRecentPosts();
    const lists = [
        document.getElementById('recent-posts-list-desktop'),
        document.getElementById('recent-posts-list-mobile')
    ];
    lists.forEach(list => {
        if (!list) return;
        const widget = list.parentElement;
        if (recentPosts.length === 0) {
            widget.style.display = 'none';
        } else {
            widget.style.display = 'block';
            list.innerHTML = recentPosts.map(p => `<li><a href="#${p.id}">${p.title}</a></li>`).join('');
        }
    });
}

function renderPostList(posts, page = 1) {
    mobileProfileContainer.style.display = 'none';
    const loadMoreBtn = document.getElementById('load-more-btn');
    const loadMoreContainer = document.getElementById('load-more-container');
    const start = (page - 1) * postsPerPage;
    const end = start + postsPerPage;
    const postsToRender = posts.slice(start, end);
    let gridHtml = '';
    if (page === 1) {
        gridHtml = '<div class="post-grid">';
    }
    postsToRender.forEach(post => {
        const pinIconHtml = post.pinned ? '<div class="pin-icon">📌</div>' : '';
        gridHtml += `
            <div class="grid-item">
                <a href="#${post.id}">
                    ${pinIconHtml}
                    <img src="${post.image || `https://source.unsplash.com/random/600x800?sig=${post.id}`}" alt="${post.title}">
                    <div class="grid-item-overlay">
                        <h3 class="grid-item-title">${post.title}</h3>
                    </div>
                </a>
            </div>
        `;
    });
    if (page === 1) {
        gridHtml += '</div>';
        contentContainer.innerHTML = gridHtml;
    } else {
        contentContainer.querySelector('.post-grid').insertAdjacentHTML('beforeend', gridHtml);
    }
    const isSearchActive = document.getElementById('search-input').value.length > 0;
    if (end >= posts.length || isSearchActive) {
        loadMoreContainer.style.display = 'none';
    } else {
        loadMoreContainer.style.display = 'block';
    }
}

async function renderPost(postId) {
    try {
        const { title, contentHtml, frontmatter } = await fetchSinglePost(postId);
        addRecentPost({ id: postId, title: title });
        const postHtml = `
            <div class="post-detail-wrapper">
                <div class="post-visual">
                    <img src="${frontmatter.image || `https://source.unsplash.com/random/800x500?sig=${postId}`}" alt="${title}">
                </div>
                <div class="post-info">
                    <h1 class="post-title-main">${title}</h1>
                    <p>${frontmatter.excerpt || ''}</p>
                    <hr style="border-color: var(--border-color); margin: 30px 0;">
                    <div class="post-body">${contentHtml}</div>
                </div>
            </div>
            <section id="comments-section"></section>
        `;
        contentContainer.innerHTML = postHtml;
        const commentsSection = document.getElementById('comments-section');
        if (commentsSection) {
            contentContainer.insertBefore(mobileProfileContainer, commentsSection);
        } else {
            contentContainer.appendChild(mobileProfileContainer);
        }
        loadGiscus(postId);
    } catch (error) {
        console.error('Failed to load post:', error);
        contentContainer.innerHTML = `<h3>Failed to load post: ${error.message}</h3>`;
    }
}

function renderProfile(data) {
    const profiles = ['desktop', 'mobile'];
    profiles.forEach(type => {
        const imgEl = document.getElementById(`profile-image-${type}`);
        const nameEl = document.getElementById(`profile-name-${type}`);
        const bioEl = document.getElementById(`profile-bio-${type}`);
        const linksEl = document.getElementById(`profile-links-${type}`);
        const additionalInfoEl = document.getElementById(`profile-additional-info-${type}`);
        if (data && imgEl) {
            imgEl.src = data.image || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            nameEl.textContent = data.name || 'Your Name';
            bioEl.textContent = data.bio || 'Welcome to my blog.';
            if (data.links && Array.isArray(data.links)) {
                linksEl.innerHTML = data.links.map(link => 
                    `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.text}</a>`
                ).join('');
            } else {
                linksEl.innerHTML = '';
            }
            additionalInfoEl.textContent = data.additional_info || '';
        } else if (nameEl) {
            nameEl.textContent = 'Profile Error';
            bioEl.textContent = 'Could not load profile.';
        }
    });
}

function loadGiscus(term) {
    const commentsContainer = document.getElementById('comments-section');
    if (!commentsContainer) return;
    while (commentsContainer.firstChild) {
        commentsContainer.removeChild(commentsContainer.firstChild);
    }
    const giscusScript = document.createElement('script');
    giscusScript.src = 'https://giscus.app/client.js';
    giscusScript.setAttribute('data-repo', GISCUS_REPO);
    giscusScript.setAttribute('data-repo-id', GISCUS_REPO_ID);
    giscusScript.setAttribute('data-category', 'Announcements');
    giscusScript.setAttribute('data-category-id', GISCUS_CATEGORY_ID);
    giscusScript.setAttribute('data-mapping', 'specific');
    giscusScript.setAttribute('data-term', term);
    giscusScript.setAttribute('data-theme', 'dark');
    giscusScript.setAttribute('data-lang', 'ko');
    giscusScript.setAttribute('data-strict', '0');
    giscusScript.setAttribute('data-reactions-enabled', '1');
    giscusScript.setAttribute('data-emit-metadata', '0');
    giscusScript.setAttribute('data-input-position', 'bottom');
    giscusScript.crossOrigin = 'anonymous';
    giscusScript.async = true;
    commentsContainer.appendChild(giscusScript);
}

async function router() {
    contentContainer.innerHTML = '<div class="loading">Loading...</div>';
    const hash = location.hash.substring(1);
    const decodedHash = decodeURIComponent(hash);
    const loadMoreContainer = document.getElementById('load-more-container');
    if (!window.allPosts) {
        try {
            window.allPosts = await fetchAllPosts();
        } catch (error) {
            console.error('Failed to pre-fetch posts:', error);
            contentContainer.innerHTML = `<h3>Failed to load blog data: ${error.message}</h3>`;
            return;
        }
    }
    if (window.allPosts.some(p => p.id === decodedHash)) {
        bannerContainer.style.display = 'none';
        loadMoreContainer.style.display = 'none';
        renderPost(decodedHash);
    } else {
        renderBanner(window.configData);
        currentPage = 1;
        document.getElementById('search-input').value = '';
        renderPostList(window.allPosts, currentPage);
    }
}

document.getElementById('load-more-btn').addEventListener('click', () => {
    currentPage++;
    renderPostList(window.allPosts, currentPage);
});

document.getElementById('search-input').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (!query) {
        router();
        return;
    }
    const filteredPosts = window.allPosts.filter(post => 
        post.title.toLowerCase().includes(query) || 
        (post.excerpt && post.excerpt.toLowerCase().includes(query))
    );
    renderPostList(filteredPosts, 1);
});

window.addEventListener('DOMContentLoaded', async () => {
    const [configData, profileData] = await Promise.all([
        loadConfigData(),
        loadProfileData()
    ]);
    window.configData = configData;
    applyConfig(configData);
    renderProfile(profileData);
    renderRecentPosts();
    router();
});

window.addEventListener('hashchange', router);
