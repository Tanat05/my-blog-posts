const fs = require('fs');
const path = require('path');
const grayMatter = require('gray-matter');

const postsDir = path.join(process.cwd(), 'posts');
const pinnedDir = path.join(process.cwd(), 'pinned');
const profilePath = path.join(process.cwd(), 'profile.md');
const configPath = path.join(process.cwd(), 'config.md');
const publicDir = path.join(process.cwd(), 'public');

function getChoseong(str) {
    if (!str) return '';
    const cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
    let result = "";
    for(let i=0; i<str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (charCode >= 44032 && charCode <= 55203) {
            const hangul = charCode - 44032;
            result += cho[Math.floor(hangul / 588)];
        } else {
            result += str.charAt(i);
        }
    }
    return result;
}

function formatTitleFromId(id) {
    const nameOnly = id.replace(/\.md$/, '');
    const titlePart = nameOnly.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    return titlePart.replace(/-+/g, ' ');
}

// 재귀 함수 대신, 해당 폴더의 파일 목록만 읽는 단순한 함수
function getFilesInDir(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`Directory not found: ${dir}`);
        return [];
    }
    try {
        const list = fs.readdirSync(dir);
        return list
            .filter(file => file.endsWith('.md') && fs.statSync(path.join(dir, file)).isFile())
            .map(file => path.join(dir, file));
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
        return [];
    }
}

function processFiles(filePaths, isPinned = false) {
    return filePaths.map(filePath => {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data } = grayMatter(fileContent);
            
            // 파일 경로를 기반으로 id 생성 (운영체제와 무관하게 슬래시(/) 사용)
            const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
            const id = relativePath.replace(/\.md$/, '');
            
            const title = data.title || formatTitleFromId(path.basename(filePath));
            
            // pinned 속성은 오직 isPinned 인자에 의해서만 결정됨
            const postData = {
                id,
                title,
                pinned: isPinned,
                choseongTitle: getChoseong(title),
                ...data
            };
            // frontmatter에 있는 pinned 속성은 무시하므로, 최종 객체에서 삭제
            delete postData.pinned; 
            postData.pinned = isPinned;

            return postData;
        } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
            return null;
        }
    }).filter(post => post !== null); // 에러가 발생한 파일은 제외
}

function main() {
    console.log("Building metadata...");
    
    const pinnedFiles = getFilesInDir(pinnedDir);
    const regularFiles = getFilesInDir(postsDir);
    
    const pinnedPosts = processFiles(pinnedFiles, true);
    const regularPosts = processFiles(regularFiles, false);
    
    const sortByDate = (a, b) => new Date(b.date) - new Date(a.date);
    const allPosts = [...pinnedPosts.sort(sortByDate), ...regularPosts.sort(sortByDate)];

    const profileData = fs.existsSync(profilePath) ? grayMatter(fs.readFileSync(profilePath, 'utf8')).data : {};
    const configData = fs.existsSync(configPath) ? grayMatter(fs.readFileSync(configPath, 'utf8')).data : {};

    const metadata = {
        posts: allPosts,
        profile: profileData,
        config: configData
    };
    
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }
    
    fs.writeFileSync(path.join(publicDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
    
    console.log("Metadata built successfully!");
    console.log(`- Total posts: ${allPosts.length}`);
    console.log(`- Pinned posts: ${pinnedPosts.length}`);
}

main();
