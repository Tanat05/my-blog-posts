import * as Hangul from "https://unpkg.com/es-hangul/dist/index.mjs";

const GITHUB_USER = 'Tanat05';
const GITHUB_REPO = 'my-blog-posts';
const DEFAULT_BRANCH = 'main';

const GISCUS_REPO = 'Tanat05/my-blog-posts';
const GISCUS_REPO_ID = 'R_kgDOPAg55g';
const GISCUS_CATEGORY_ID = 'DIC_kwDOPAg55s4Cr42K';

marked.setOptions({
  gfm: true,
  breaks: true,
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
});

const contentContainer = document.getElementById('content-container');
const bannerContainer = document.getElementById('banner-container');
const mobileProfileContainer = document.getElementById('mobile-profile-container');
const searchInput = document.getElementById('search-input');
const loadMoreBtn = document.getElementById('load-more-btn');

let currentPage = 1;
const postsPerPage = 9;
const RECENT_POSTS_LIMIT = 5;
let fuse;
let currentDisplayedPosts = [];

async function loadMetadata() {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${DEFAULT_BRANCH}/public/metadata.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('metadata.json not found. Check repository, branch name, and Actions build status.');
        return await response.json();
    } catch (error) {
        console.error("Failed to load metadata:", error);
        contentContainer.innerHTML = `<h3>블로그 데이터를 불러오는데 실패했습니다. <br> 레포지토리의 기본 브랜치 이름과 Actions 빌드 성공 여부를 확인해주세요.</h3>`;
        return null;
    }
}

async function fetchSinglePost(postId) {
    const fileUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${DEFAULT_BRANCH}/${postId}.md`;
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`File load error: ${response.statusText}`);
    const text = await response.text();
    const { content } = parseFrontmatter(text);
    const contentHtml = marked.parse(content);
    return { contentHtml };
}

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
        bannerContainer.style.display = 'none'; return;
    }
    bannerContainer.style.display = 'block';
    bannerContainer.style.backgroundImage = config.banner_image ? `url(${config.banner_image})` : 'none';
    bannerContainer.style.backgroundColor = !config.banner_image ? 'var(--surface-color)' : '';
    bannerContainer.innerHTML = `<div class="banner-content">
        ${config.banner_text ? `<h1 class="banner-title">${config.banner_text}</h1>` : ''}
        ${config.banner_subtext ? `<p class="banner-subtitle">${config.banner_subtext}</p>` : ''}
    </div>`;
}

function getRecentPosts() { return JSON.parse(sessionStorage.getItem('recentPosts') || '[]'); }
function addRecentPost(post) {
    let recentPosts = getRecentPosts().filter(p => p.id !== post.id);
    recentPosts.unshift(post);
    if (recentPosts.length > RECENT_POSTS_LIMIT) recentPosts.pop();
    sessionStorage.setItem('recentPosts', JSON.stringify(recentPosts));
    renderRecentPosts();
}
function renderRecentPosts() {
    const recentPosts = getRecentPosts();
    ['desktop', 'mobile'].forEach(type => {
        const list = document.getElementById(`recent-posts-list-${type}`);
        if (!list) return;
        const widget = list.parentElement;
        widget.style.display = recentPosts.length > 0 ? 'block' : 'none';
        list.innerHTML = recentPosts.map(p => `<li><a href="#${p.id}">${p.title}</a></li>`).join('');
    });
}

function renderPostList(posts, page = 1) {
    mobileProfileContainer.style.display = 'none';
    const loadMoreContainer = document.getElementById('load-more-container');
    const start = (page - 1) * postsPerPage;
    const end = start + postsPerPage;
    const postsToRender = posts.slice(start, end);
    if (page === 1) contentContainer.innerHTML = '<div class="post-grid"></div>';
    const grid = contentContainer.querySelector('.post-grid');
    if (!grid) return;
    const postsHtml = postsToRender.map(post => {
        const pinIconHtml = post.pinned ? '<div class="pin-icon">📌</div>' : '';
        const defaultImage = window.configData.default_post_image || `https://source.unsplash.com/random/600x800?sig=${post.id}`;
        return `<div class="grid-item"><a href="#${post.id}">${pinIconHtml}<img src="${post.image || defaultImage}" alt="${post.title}"><div class="grid-item-overlay"><h3 class="grid-item-title">${post.title}</h3></div></a></div>`;
    }).join('');
    if (page === 1) grid.innerHTML = postsHtml;
    else grid.insertAdjacentHTML('beforeend', postsHtml);
    const isSearchActive = searchInput.value.length > 0;
    loadMoreContainer.style.display = (end >= posts.length || isSearchActive) ? 'none' : 'block';
}

async function renderPost(postId) {
    try {
        const postData = window.allPosts.find(p => p.id === postId);
        if (!postData) throw new Error("Post not found.");
        const { contentHtml } = await fetchSinglePost(postId);
        addRecentPost({ id: postId, title: postData.title });
        const defaultImage = window.configData.default_post_image || `https://source.unsplash.com/random/800x500?sig=${postId}`;
        const defaultExcerpt = window.configData.default_post_excerpt || '';
        contentContainer.innerHTML = `
            <div class="post-detail-wrapper">
                <div class="post-visual"><img src="${postData.image || defaultImage}" alt="${postData.title}"></div>
                <div class="post-info">
                    <h1 class="post-title-main">${postData.title}</h1>
                    <div class="post-meta">${postData.date || ''}</div>
                    <p class="post-excerpt">${postData.excerpt || defaultExcerpt}</p>
                    <div class="post-body">${contentHtml}</div>
                </div>
            </div>
            <section id="comments-section"></section>
        `;
        mobileProfileContainer.style.display = 'block';
        const commentsSection = document.getElementById('comments-section');
        if (commentsSection) contentContainer.insertBefore(mobileProfileContainer, commentsSection);
        else contentContainer.appendChild(mobileProfileContainer);
        loadGiscus(postId);
    } catch (error) {
        console.error('Failed to load post:', error);
        contentContainer.innerHTML = `<h3>Failed to load post: ${error.message}</h3>`;
    }
}

function renderProfile(data) {
    ['desktop', 'mobile'].forEach(type => {
        const imgEl = document.getElementById(`profile-image-${type}`);
        const nameEl = document.getElementById(`profile-name-${type}`);
        const bioEl = document.getElementById(`profile-bio-${type}`);
        const linksEl = document.getElementById(`profile-links-${type}`);
        const additionalInfoEl = document.getElementById(`profile-additional-info-${type}`);
        if (data && imgEl) {
            imgEl.src = data.image || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            nameEl.textContent = data.name || 'Your Name';
            bioEl.textContent = data.bio || 'Welcome to my blog.';
            linksEl.innerHTML = (data.links && Array.isArray(data.links)) ? data.links.map(link => `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.text}</a>`).join('') : '';
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
    const hash = location.hash.substring(1);
    const decodedHash = decodeURIComponent(hash);
    const loadMoreContainer = document.getElementById('load-more-container');
    if (window.allPosts.some(p => p.id === decodedHash)) {
        bannerContainer.style.display = 'none';
        loadMoreContainer.style.display = 'none';
        renderPost(decodedHash);
    } else {
        renderBanner(window.configData);
        currentPage = 1;
        searchInput.value = '';
        currentDisplayedPosts = window.allPosts;
        renderPostList(currentDisplayedPosts, currentPage);
    }
}

loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    renderPostList(currentDisplayedPosts, currentPage);
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    if (query) {
        const searchPattern = { $or: [{ title: query }, { choseongTitle: getChoseong(query) }] };
        const results = fuse.search(searchPattern);
        currentDisplayedPosts = results.map(result => result.item);
        renderPostList(currentDisplayedPosts, 1);
    } else {
        currentPage = 1;
        currentDisplayedPosts = window.allPosts;
        renderPostList(currentDisplayedPosts, currentPage);
    }
});

window.addEventListener('DOMContentLoaded', async () => {
    contentContainer.innerHTML = '<div class="loading">Loading...</div>';
    const metadata = await loadMetadata();
    if (!metadata) return;
    
    window.allPosts = metadata.posts;
    window.configData = metadata.config;
    currentDisplayedPosts = metadata.posts;

    fuse = new Fuse(window.allPosts, {
        keys: [
            { name: 'title', weight: 0.6 },
            { name: 'choseongTitle', weight: 0.6 },
            { name: 'excerpt', weight: 0.3 },
            { name: 'id', weight: 0.1 }
        ],
        includeScore: true,
        threshold: 0.4,
    });
    
    applyConfig(metadata.config);
    renderProfile(metadata.profile);
    renderRecentPosts();
    router();
});

window.addEventListener('hashchange', router);
