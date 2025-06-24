---
title: '나만의 블로그로 꾸미는 방법'
date: '2024-05-27'
excerpt: 'config.md 파일을 수정하여 배너, 배경, 색상, 폰트 등 블로그의 모든 디자인을 쉽게 변경할 수 있습니다.'
image: 'https://images.unsplash.com/photo-1509343256512-d77a5cb3791b?q=80&w=1470'
---

이 블로그는 코드를 직접 수정하지 않고도 `config.md` 파일 하나로 대부분의 디자인을 변경할 수 있도록 설계되었습니다.

### 1. `config.md` 파일 찾기

깃허브 글 저장소(`my-blog-posts`)의 최상위 위치에 있는 `config.md` 파일을 찾아서 수정하면 됩니다.

### 2. 주요 설정 항목

`config.md` 파일은 다음과 같은 항목들을 포함하고 있습니다.

#### 배너 설정
홈페이지 상단에 표시되는 배너입니다. 이미지 또는 텍스트를 사용할 수 있으며, 비워두면 표시되지 않습니다.
```yaml
banner_image: '배너 이미지 URL'
banner_text: '배너에 표시될 큰 글자'
banner_subtext: '큰 글자 아래에 표시될 작은 글자'
```

#### 배경 설정
블로그 전체의 배경을 설정합니다. 이미지 또는 그라데이션 중 하나를 선택하여 사용하세요.
```yaml
# 이미지 배경 (그라데이션을 사용하려면 이 줄을 #으로 주석 처리)
background_image: '패턴 이미지 URL'

# 그라데이션 배경 (이미지를 사용하려면 이 두 줄을 #으로 주석 처리)
# background_gradient_start: '#1e3c72'
# background_gradient_end: '#2a5298'
```

#### 색상 및 폰트 설정
블로그의 포인트 색상과 전체 폰트를 변경할 수 있습니다.
```yaml
accent_color: '#58a6ff' # 링크, 강조 등에 사용될 주요 색상
font_family: "'Inter', sans-serif" # Google Fonts에 있는 폰트 이름을 입력
```

#### 게시글 기본값 설정
게시글의 `image`나 `excerpt`가 없을 때 대신 표시될 기본값을 설정합니다.
```yaml
default_post_image: '기본 이미지 URL'
default_post_excerpt: '이 글의 요약이 없습니다.'
```

### 3. 변경사항 적용하기
`config.md` 파일을 수정한 뒤 `git push`를 하면, 잠시 후 GitHub Actions가 자동으로 `metadata.json` 파일을 업데이트하고 블로그에 변경사항이 반영됩니다.
```

---
