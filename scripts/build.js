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

function getFilesRecursively(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(file));
        } else if (file.endsWith('.md')) {
            results.push(file);
        }
    });
    return results;
}

function processFiles(filePaths, isPinned = false) {
    return filePaths.map(filePath => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data } = grayMatter(fileContent);
        const relativePath = path.relative(process.cwd(), filePath);
        const id = relativePath.replace(/\\/g, '/').replace(/\.md$/, '');
        const title = data.title || formatTitleFromId(path.basename(filePath));
        
        return {
            id,
            title,
            pinned: isPinned,
            choseongTitle: getChoseong(title),
            ...data
        };
    });
}

function main() {
    console.log("Building metadata...");
    
    const pinnedFiles = fs.existsSync(pinnedDir) ? getFilesRecursively(pinnedDir) : [];
    const regularFiles = fs.existsSync(postsDir) ? getFilesRecursively(postsDir) : [];
    
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
