import { getChoseong } from "https://unpkg.com/es-hangul/dist/index.mjs";

const GITHUB_USER = 'Tanat05';
const GITHUB_REPO = 'my-blog-posts';
const POSTS_DIR = 'posts';
const PINNED_DIR = 'pinned';

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
const searchInput = document.getElementById('search-input');
const loadMoreBtn = document.getElementById('load-more-btn');

let currentPage = 1;
const postsPerPage = 9;
const RECENT_POSTS_LIMIT = 5;
let fuse;
let currentDisplayedPosts = [];

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

async function recursivelyFetchFiles(path) {
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`API Error fetching ${path}: ${response.statusText}`);
    }
    const files = await response.json();
    if (!Array.isArray(files)) return [];
    
    let markdownFiles = [];
    for (const file of files) {
        if (file.type === 'dir') {
            const subFiles = await recursivelyFetchFiles(file.path);
            markdownFiles.push(...subFiles);
        } else if (file.name.endsWith('.md')) {
            markdownFiles.push(file);
        }
    }
    return markdownFiles;
}

const processFiles = (files, isPinned = false) => {
    return files.map(async file => {
        const id = file.path.replace(/\.md$/, '');
        const fileResponse = await fetch(file.download_url);
        const text = await fileResponse.text();
        const { frontmatter } = parseFrontmatter(text);
        const title = frontmatter.title || formatTitleFromId(file.name);
        return { id, title, pinned: isPinned, choseongTitle: getChoseong(title), ...frontmatter };
    });
};

async function fetchAllPosts() {
    const topLevelUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${POSTS_DIR}`;
    const topLevelResponse = await fetch(topLevelUrl);
    if (topLevelResponse.ok) {
        const items = await topLevelResponse.json();
        const hasFiles = items.some(item => item.type === 'file' && item.name.endsWith('.md'));
        const hasDirs = items.some(item => item.type === 'dir');
        if (hasFiles && hasDirs) {
            throw new Error(`[폴더 구조 오류] 'posts' 폴더 안에 파일과 하위 폴더를 함께 사용할 수 없습니다. 한 가지 방식만 선택해주세요.`);
        }
    } else if (topLevelResponse.status !== 404) {
        throw new Error(`API Error fetching ${POSTS_DIR}: ${topLevelResponse.statusText}`);
    }

    const [pinnedFiles, regularFiles] = await Promise.all([
        recursivelyFetchFiles(PINNED_DIR),
        recursivelyFetchFiles(POSTS_DIR)
    ]);
    
    const pinnedPostPromises = processFiles(pinnedFiles, true);
    const regularPostPromises = processFiles(regularFiles, false);
    
    const [pinnedPostsData, regularPostsData] = await Promise.all([
        Promise.all(pinnedPostPromises),
        Promise.all(regularPostPromises)
    ]);
    
    const sortByDate = (a, b) => new Date(b.date) - new Date(a.date);
    const sortedPinned = pinnedPostsData.sort(sortByDate);
    const sortedRegular = regularPostsData.sort(sortByDate);
    
    return [...sortedPinned, ...sortedRegular];
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

async function fetchSinglePost(postId) {
    const fileUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/${postId}.md`;
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`File load error: ${response.statusText}`);
    const text = await response.text();
    const { frontmatter, content } = parseFrontmatter(text);
    const contentHtml = marked.parse(content);
    return { contentHtml, frontmatter };
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
    const loadMoreContainer = document.getElementById('load-more-container');
    const start = (page - 1) * postsPerPage;
    const end = start + postsPerPage;
    const postsToRender = posts.slice(start, end);
    if (page === 1) {
        contentContainer.innerHTML = '<div class="post-grid"></div>';
    }
    const grid = contentContainer.querySelector('.post-grid');
    if (!grid) return;
    const postsHtml = postsToRender.map(post => {
        const pinIconHtml = post.pinned ? '<div class="pin-icon">📌</div>' : '';
        return `
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
    }).join('');
    if (page === 1) {
        grid.innerHTML = postsHtml;
    } else {
        grid.insertAdjacentHTML('beforeend', postsHtml);
    }
    const isSearchActive = searchInput.value.length > 0;
    if (end >= posts.length || isSearchActive) {
        loadMoreContainer.style.display = 'none';
    } else {
        loadMoreContainer.style.display = 'block';
    }
}

async function renderPost(postId) {
    try {
        const postDataFromList = window.allPosts.find(p => p.id === postId);
        if (!postDataFromList) throw new Error("Post not found in list.");
        const { contentHtml, frontmatter } = await fetchSinglePost(postId);
        const title = postDataFromList.title;
        addRecentPost({ id: postId, title: title });
        const postHtml = `
            <div class="post-detail-wrapper">
                <div class="post-visual">
                    <img src="${frontmatter.image || `https://source.unsplash.com/random/800x500?sig=${postId}`}" alt="${title}">
                </div>
                <div class="post-info">
                    <h1 class="post-title-main">${title}</h1>
                    <div class="post-meta">${frontmatter.date || ''}</div>
                    <p class="post-excerpt">${frontmatter.excerpt || ''}</p>
                    <div class="post-body">${contentHtml}</div>
                </div>
            </div>
            <section id="comments-section"></section>
        `;
        contentContainer.innerHTML = postHtml;
        mobileProfileContainer.style.display = 'block';
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
            currentDisplayedPosts = window.allPosts;
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
        } catch (error) {
            console.error('Failed to pre-fetch posts:', error);
            contentContainer.innerHTML = `<h3>${error.message}</h3>`;
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
        const searchPattern = {
          $or: [
            { title: query },
            { choseongTitle: getChoseong(query) }
          ]
        };
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
