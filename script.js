const GITHUB_USER = 'Tanat05';
const GITHUB_REPO = 'my-blog-posts';
const POSTS_DIR = 'posts';

const GISCUS_REPO = 'Tanat05/my-blog-posts';
const GISCUS_REPO_ID = 'R_kgDOPAg55g';
const GISCUS_CATEGORY_ID = 'DIC_kwDOPAg55s4Cr42K';

const contentContainer = document.getElementById('content-container');

// === [수정됨] 버그가 해결된 새로운 Frontmatter 파서 ===
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

        if (indent === 0) { // 최상위 레벨 (키 또는 리스트 시작)
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
        } else if (currentListKey && /^\s*-/.test(line)) { // 리스트 아이템
            const itemMatch = line.match(/^\s*-\s*(\w+):\s*(.*)/);
            if (itemMatch) {
                const [, key, value] = itemMatch;
                lastListItem = { [key]: value.replace(/^['"]|['"]$/g, '') };
                frontmatter[currentListKey].push(lastListItem);
            }
        } else if (lastListItem && /^\s+/.test(line)) { // 리스트 아이템의 하위 속성
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

function renderPostList(posts) {
    let gridHtml = '<div class="post-grid">';
    posts.forEach(post => {
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
    gridHtml += '</div>';
    contentContainer.innerHTML = gridHtml;
}

async function renderPost(postId) {
    try {
        const { title, contentHtml, frontmatter } = await fetchSinglePost(postId);
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
        loadGiscus(postId);
    } catch (error) {
        console.error('Failed to load post:', error);
        contentContainer.innerHTML = `<h3>Failed to load post: ${error.message}</h3>`;
    }
}

function renderProfile(data) {
    const imgEl = document.getElementById('profile-image');
    const nameEl = document.getElementById('profile-name');
    const bioEl = document.getElementById('profile-bio');
    const linksEl = document.getElementById('profile-links');
    const additionalInfoEl = document.getElementById('profile-additional-info');

    if (data) {
        imgEl.src = data.image || imgEl.src;
        nameEl.textContent = data.name || 'Your Name';
        bioEl.textContent = data.bio || 'Welcome to my blog.';
        if (data.links && Array.isArray(data.links)) {
            linksEl.innerHTML = data.links.map(link => 
                `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.text}</a>`
            ).join('');
        }
        if (data.additional_info) {
            additionalInfoEl.textContent = data.additional_info;
        }
    } else {
        nameEl.textContent = 'Profile Error';
        bioEl.textContent = 'Could not load profile.';
    }
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
        renderPost(decodedHash);
    } else {
        renderPostList(window.allPosts);
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    const profileData = await loadProfileData();
    renderProfile(profileData);
    router();
});

window.addEventListener('hashchange', router);
