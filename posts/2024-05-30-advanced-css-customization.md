---
title: 'CSS로 블로그 디자인 직접 수정하기 (고급)'
date: '2024-05-30'
excerpt: 'config.md를 넘어, CSS를 직접 수정하여 블로그의 세부 디자인을 자유롭게 변경하는 방법을 알아봅니다.'
image: 'https://images.unsplash.com/photo-1524749292158-7540c2494485?q=80&w=1287'
---

`config.md` 파일은 블로그의 전반적인 디자인을 쉽게 변경할 수 있는 좋은 방법입니다. 하지만 더 세밀하고 독창적인 디자인을 원한다면, CSS 파일을 직접 수정해야 합니다. 이 가이드는 이 블로그의 CSS 구조를 이해하고 안전하게 수정하는 방법을 안내합니다.

> **주의:** 이 가이드는 CSS에 대한 기본 지식이 있는 사용자를 대상으로 합니다. 시작하기 전에 반드시 원본 `style.css` 파일을 백업해두세요.

## 핵심 구조: CSS 변수 (Variables)

이 블로그의 디자인 시스템은 **CSS 변수**를 기반으로 작동합니다. `style.css` 파일의 최상단을 보면 `:root` 블록 안에 주요 디자인 요소들이 변수로 정의되어 있습니다.

```css
:root {
    --bg-image: none;
    --bg-gradient: linear-gradient(45deg, #121212, #181818);
    --accent-color: #58a6ff;
    --primary-text-color: #e0e0e0;
    --secondary-text-color: #a0a0a0;
    --font-family: 'Inter', sans-serif;
    --surface-color: #1e1e1e;
    --border-color: rgba(255, 255, 255, 0.1);
}
```

`config.md` 파일의 설정은 결국 이 변수들의 값을 JavaScript로 덮어쓰는 방식으로 작동합니다. 즉, 이 변수들의 의미만 알면 블로그의 거의 모든 디자인을 제어할 수 있습니다.

*   `--accent-color`: 링크, 강조 제목 등 포인트 색상
*   `--surface-color`: 프로필 카드, 게시글 배경 등 콘텐츠 영역의 배경색
*   `--border-color`: 각종 경계선의 색상

예를 들어, 블로그의 포인트 색상을 보라색 계열로 바꾸고 싶다면, `:root`의 `--accent-color` 값을 아래와 같이 수정하면 됩니다.
```css
:root {
    /* ... */
    --accent-color: #9d72ff;
}
```

## 예제 1: 프로필 카드에 그라데이션 테두리 추가하기

단순한 회색 테두리 대신, 시선을 끄는 그라데이션 테두리를 추가해 봅시다. `style.css`에서 `.profile-card` 부분을 찾아 아래와 같이 수정합니다.

**기존 코드:**
```css
.profile-card img {
    /* ... */
    border: 2px solid var(--border-color);
}
```

**수정 코드:**
```css
.profile-card img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 20px;
    /* 그라데이션 테두리를 위한 수정 */
    border: 3px solid transparent;
    background-image: linear-gradient(var(--surface-color), var(--surface-color)), 
                      linear-gradient(45deg, var(--accent-color), #ff79c6);
    background-origin: border-box;
    background-clip: content-box, border-box;
}
```
> 이 코드는 두 개의 배경 이미지를 겹치는 트릭을 사용합니다. 안쪽 배경은 기존 배경색으로 채우고, 바깥쪽 배경(테두리 영역)은 그라데이션으로 채워서 테두리처럼 보이게 만듭니다.

## 예제 2: "더 보기" 버튼 스타일 변경하기

"더 보기" 버튼을 좀 더 입체적이고 눈에 띄게 바꿔봅시다. `.load-more-btn` 스타일을 아래와 같이 수정합니다.

```css
.load-more-btn {
    background-color: var(--accent-color);
    color: #111; /* 어두운 글자색으로 변경 */
    border: none; /* 테두리 제거 */
    border-radius: 99px; /* 알약 모양으로 변경 */
    padding: 12px 30px;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 700; /* 굵게 */
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.load-more-btn:hover {
    transform: translateY(-2px); /* 살짝 떠오르는 효과 */
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}
```

## 예제 3: 마크다운 인용구 스타일 변경하기

깃허브 스타일의 인용구를 좀 더 개성 있게 바꿔봅시다. `.post-body blockquote` 스타일을 수정합니다.

```css
.post-body blockquote {
    border-left: 3px solid var(--accent-color); /* 테두리 색상을 포인트 색상으로 */
    padding: 1em 1.5em; /* 안쪽 여백 추가 */
    margin: 1.5em 0;
    color: var(--primary-text-color); /* 글자색을 더 밝게 */
    background-color: rgba(0,0,0,0.1); /* 은은한 배경색 추가 */
    border-radius: 0 8px 8px 0; /* 오른쪽 모서리를 둥글게 */
}
```

### 주의사항

*   **백업**: 수정 전에는 항상 원본 `style.css` 파일을 다른 곳에 복사해두세요.
*   **캐시 문제**: CSS를 수정한 뒤에는 `index.html`의 버전 번호(`style.css?v=1.1.0` -> `style.css?v=1.1.1`)를 올려야 변경사항이 즉시 반영됩니다.
*   **구조 이해**: 특정 요소의 스타일을 바꾸고 싶다면, 브라우저의 개발자 도구(F12)를 열어 해당 요소에 어떤 클래스 이름이 적용되었는지 확인하면 큰 도움이 됩니다.

이처럼 CSS 변수와 기본 구조를 이해하면, 이 블로그는 당신의 상상력에 따라 무한히 변신할 수 있는 캔버스가 될 것입니다.
