# 🚀 My GitHub Blog: 깃허브로 나만의 블로그 만들기

이 프로젝트는 깃허브 레포지토리를 데이터베이스처럼 사용하여, 설치나 서버 비용 없이 멋진 개인 블로그를 운영할 수 있는 템플릿입니다. 모든 글과 설정은 깃허브에서 직접 관리하며, 웹사이트는 자동으로 최신 내용을 반영합니다.

- **[내 블로그 데모 바로가기](https://tanat05.github.io/my-blog-posts/)**

## ✨ 주요 기능

-   **100% 깃허브 기반**: 별도의 데이터베이스나 서버가 필요 없습니다.
-   **파일 기반 콘텐츠 관리**: 마크다운(`.md`) 파일로 쉽게 글을 작성하고 관리할 수 있습니다.
-   **강력한 커스터마이징**: `config.md` 파일 하나로 배너, 배경, 색상, 폰트 등 블로그의 모든 디자인을 변경할 수 있습니다.
-   **자동화된 빌드**: GitHub Actions가 글을 쓸 때마다 블로그 데이터를 자동으로 최신화합니다.
-   **지능형 검색**: 제목, 내용, 초성 검색 및 약간의 오타 보정을 지원하는 강력한 검색 기능이 내장되어 있습니다.
-   **댓글 기능**: [Giscus](https://giscus.app/ko) (GitHub Discussions 기반)를 이용한 댓글 시스템이 연동되어 있습니다.
-   **추가 기능**: 고정글, 최근 본 글 목록, '더 보기' 페이지네이션 등 편의 기능이 포함되어 있습니다.

---

## 📖 시작 가이드

블로그 구축은 크게 3개의 파트로 나뉩니다.

1.  **[Part 1: 최초 설정](https://github.com/Tanat05/my-blog-posts?tab=readme-ov-file#part-1-최초-설정)**: 깃허브 레포지토리 생성부터 코드 설정까지, 딱 한 번만 하면 되는 과정입니다.
2.  **[Part 2: 콘텐츠 관리](https://github.com/Tanat05/my-blog-posts?tab=readme-ov-file#part-2-콘텐츠-관리-일상적인-작업)**: 새 글을 쓰거나 프로필을 수정하는 등, 블로그를 운영하며 계속하게 될 작업입니다.
3.  **[Part 3: 커스터마이징 가이드](https://github.com/Tanat05/my-blog-posts?tab=readme-ov-file#part-3-커스터마이징-가이드-블로그-꾸미기)**: `config.md` 파일을 통해 블로그의 디자인을 마음대로 바꾸는 방법입니다.

---

# Part 1: 최초 설정

## 0단계: 준비물

먼저, 이 프로젝트의 핵심 코드 3개를 컴퓨터에 준비해주세요.
-   [`index.html`](https://raw.githubusercontent.com/Tanat05/my-blog-posts/main/index.html)
-   [`style.css`](https://raw.githubusercontent.com/Tanat05/my-blog-posts/main/style.css)
-   [`script.js`](https://raw.githubusercontent.com/Tanat05/my-blog-posts/main/script.js)
(링크를 마우스 오른쪽 클릭 > '다른 이름으로 링크 저장'으로 다운로드하세요.)

## 1단계: 깃허브 레포지토리 2개 만들기

우리 블로그는 **두 개의 분리된 깃허브 레포지토리**를 사용합니다. 이것이 가장 중요한 핵심입니다.

-   **(A) 콘텐츠 저장소**: 블로그 글, 이미지, 설정 파일 등 **데이터**를 보관하는 창고
-   **(B) 웹사이트 저장소**: 블로그를 보여주는 **코드**를 담고, 실제 웹 주소로 배포되는 집



### 1. 콘텐츠 저장소 (A) 만들기
-   **역할**: 글(`*.md`), 이미지, 설정 파일(`config.md`, `profile.md`)을 저장하는 '창고'입니다.
-   **만들기**:
    -   새로운 깃허브 레포지토리를 만듭니다.
    -   이름: **`my-blog-posts`** (다른 이름도 가능하지만, 가이드에서는 이 이름을 기준으로 설명합니다.)
    -   **반드시 `Public`으로 설정해야 합니다.**

### 2. 웹사이트 저장소 (B) 만들기
-   **역할**: 실제 웹사이트 코드(`index.html` 등)가 들어가는 '집'입니다. 댓글도 이 곳에 저장됩니다.
-   **만들기**:
    -   새로운 깃허브 레포지토리를 만듭니다.
    -   이름: **`{내 깃허브 아이디}.github.io`** 로 정확히 입력해야 블로그 주소가 됩니다. (예: `Tanat05.github.io`)
    -   **반드시 `Public`으로 설정해야 합니다.**

## 2단계: Giscus 댓글 시스템 설정

1.  **웹사이트 저장소(B)에 Discussions 활성화**:
    -   `{내 깃허브 아이디}.github.io` 레포지토리 `Settings` > `General` 페이지로 이동합니다.
    -   `Features` 섹션에서 **`Discussions`** 항목의 체크박스를 켭니다.

2.  **Giscus 앱 설치**:
    -   [Giscus 앱 페이지](https://github.com/apps/giscus)로 가서 `Install`을 누릅니다.
    -   설치 대상을 **`{내 깃허브 아이디}.github.io` 레포지토리(B)만** 선택하고 권한을 승인합니다.

3.  **Giscus 정보 얻기**:
    -   [Giscus 공식 웹사이트](https://giscus.app/ko)로 이동합니다.
    -   **리포지토리** 입력창에 `[내 깃허브 아이디]/{내 깃허브 아이디}.github.io`를 입력하고 Enter를 누릅니다.
    -   나머지 설정을 마치면, 페이지 하단에 `<script>` 태그가 생성됩니다. 이 태그 안에 있는 `data-repo-id`와 `data-category-id` 값을 메모장 같은 곳에 복사해두세요. **(매우 중요!)**

## 3단계: 코드 업로드 및 설정

### 1. 웹사이트 저장소(B)에 코드 올리기
-   `{내 깃허브 아이디}.github.io` 레포지토리에 준비해둔 `index.html`, `style.css`, `script.js` 세 파일을 업로드합니다.

### 2. `script.js` 파일 설정하기 (가장 중요!)
-   `{내 깃허브 아이디}.github.io` 레포지토리에서 `script.js` 파일을 클릭하여 편집 화면으로 들어갑니다.
-   파일 상단에 있는 **설정 변수들을 본인의 정보로 정확하게 수정**합니다.

```javascript
// 예시: 사용자 아이디가 'Tanat05'이고, 콘텐츠 저장소 이름이 'my-blog-posts'일 경우

const GITHUB_USER = 'Tanat05'; // 본인 깃허브 아이디
const GITHUB_REPO = 'my-blog-posts'; // 1단계에서 만든 "콘텐츠 저장소(A)" 이름
const DEFAULT_BRANCH = 'main'; // 콘텐츠 저장소의 기본 브랜치 이름 (master일 수도 있음)

const GISCUS_REPO = 'Tanat05/Tanat05.github.io'; // "사용자명/웹사이트저장소(B)이름"
const GISCUS_REPO_ID = 'R_ABCD...'; // 2단계에서 복사해둔 repo-id 값
const GISCUS_CATEGORY_ID = 'DIC_ABCD...'; // 2단계에서 복사해둔 category-id 값
```
-   수정이 끝나면 `Commit changes` 버튼을 눌러 저장합니다.

## 4단계: 블로그 배포하기 (GitHub Pages)

1.  `{내 깃허브 아이디}.github.io` 레포지토리 `Settings` > `Pages`로 이동합니다.
2.  `Source`를 `Deploy from a branch`로 선택합니다.
3.  `Branch`를 `main` (또는 `master`) / `(root)`로 설정하고 `Save`를 누릅니다.
4.  잠시 후 페이지가 새로고침되면, 상단에 `Your site is live at https://[내 아이디].github.io/` 와 같이 블로그 주소가 나타납니다.

---

# Part 2: 콘텐츠 관리 (일상적인 작업)

이제부터는 코드 파일을 건드릴 필요 없이, **오직 콘텐츠 저장소(`my-blog-posts`)만** 관리하면 됩니다.

## 글 작성하기

-   `my-blog-posts` 레포지토리의 **`posts` 폴더** 안에 `[파일명].md` 형식으로 새 파일을 만듭니다.
-   아래 템플릿을 복사하여 내용을 채웁니다.

**게시글 템플릿 (`YYYY-MM-DD-my-new-art.md`):**
```yaml
---
title: 'My New Art' # 여기에 글 제목을 쓰세요.
date: '2024-05-26' # 작성 날짜
image: 'https://.../my-new-art.png' # 대표 이미지 URL
excerpt: '이곳에 목록에서 보일 짧은 요약글을 씁니다.' # 요약글
---

## 본문 시작

여기에 마크다운 문법을 사용해서 자유롭게 글을 작성하세요.
```

## 글 고정하기
-   고정하고 싶은 글은 `my-blog-posts` 레포지토리의 **`pinned` 폴더**로 옮기기만 하면 됩니다.
-   Frontmatter에 `pinned: true` 속성을 쓸 필요가 없습니다.

## 이미지 관리하기

1.  `my-blog-posts` 레포지토리에 `images` 폴더를 만듭니다. (없다면)
2.  그 안에 이미지 파일을 업로드합니다.
3.  업로드된 이미지를 클릭한 뒤, `Download` 버튼을 마우스 오른쪽 클릭하여 **'링크 주소 복사'**를 선택합니다.
4.  복사된 `https://raw.githubusercontent.com/...` 주소를 게시글의 `image:` 속성에 붙여넣습니다.

---

# Part 3: 커스터마이징 가이드 (블로그 꾸미기)

블로그의 거의 모든 디자인은 `my-blog-posts` 레포지토리 루트에 있는 **`config.md`**와 **`profile.md`** 두 파일로 제어합니다.

## 1. `profile.md` - 자기소개 꾸미기

이 파일은 사이드바에 표시될 당신의 정체성입니다.

```yaml
---
name: 'Tanat05' # 표시될 이름
image: '...' # 프로필 이미지 URL
bio: '이곳에 자기소개를 작성하세요.' # 이름 아래에 표시될 짧은 소개
links: # 외부 링크 버튼 목록 (필요 없으면 이 줄부터 지워도 됩니다)
  - text: '포트폴리오'
    url: 'https://www.artstation.com/...'
  - text: '트위터'
    url: 'https://twitter.com/...'
additional_info: | # 링크 아래에 표시될 추가 정보. 여러 줄을 쓰려면 이렇게 사용하세요.
  Contact: my-email@example.com
  Location: Seoul, South Korea
---
```

## 2. `config.md` - 블로그 디자인 제어판

이 파일로 블로그의 분위기를 완전히 바꿀 수 있습니다.

**배너 설정**
```yaml
# 텍스트 배너만 사용
banner_text: 'Welcome to My Gallery'
banner_subtext: '이곳은 저의 작업물을 공유하는 공간입니다.'
# banner_image: '' # 이미지 배너는 비워두거나 주석처리(#)

# 이미지 배너만 사용
banner_image: 'https://...'
# banner_text: '' # 텍스트는 비워두거나 주석처리

# 둘 다 비워두면 배너가 아예 표시되지 않습니다.
```

**배경 설정**
```yaml
# 1. 패턴 이미지 배경 (패턴 이미지를 추천)
background_image: 'https://www.toptal.com/designers/subtlepatterns/uploads/double-bubble-outline.png'

# 2. 그라데이션 배경 (이미지 배경을 사용하지 않을 경우)
# background_image: '' # 이미지 배경은 비워두세요.
background_gradient_start: '#232526'
background_gradient_end: '#414345'
```

**색상 및 폰트 설정**
```yaml
# 링크, 강조 텍스트 등에 사용될 포인트 색상
accent_color: '#FAD961' # 예시: 노란색

# 구글 폰트 이름 (따옴표 안에 정확히 입력)
font_family: "'Noto Sans KR', sans-serif"
```
이제 이 가이드를 따라 블로그를 설정하고, `config.md`와 `profile.md` 파일을 수정하며 자신만의 멋진 공간을 만들어보세요.
