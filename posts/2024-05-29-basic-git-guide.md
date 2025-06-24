---
title: '블로그 관리를 위한 최소한의 Git 가이드'
date: '2024-05-29'
excerpt: '터미널에서 Git을 사용하여 더 효율적으로 블로그 글을 관리하는 방법을 알아봅니다.'
image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=1470'
---

물론 깃허브 웹사이트에서 직접 파일을 수정하고 업로드할 수도 있지만, 로컬 컴퓨터에서 작업하고 Git 명령어를 사용하면 훨씬 더 빠르고 효율적입니다.

### 1. 저장소 복제 (최초 한 번만)

먼저, 깃허브에 있는 글 저장소를 내 컴퓨터로 가져옵니다.

```bash
git clone https://github.com/Tanat05/my-blog-posts.git
```

### 2. 새 글 작성 후 업로드 과정

로컬 컴퓨터에서 새 글(`new-post.md`)을 작성했다고 가정해봅시다.

**1. 변경된 파일 확인**
```bash
git status
```
> `new-post.md`가 빨간색으로 표시됩니다.

**2. 변경된 파일 추가 (스테이징)**
```bash
git add .
```
> 모든 변경사항을 올릴 준비를 합니다.

**3. 변경 내용 기록 (커밋)**
```bash
git commit -m "feat: Add new post about Git"
```
> "Git에 대한 새 글 추가"라는 메시지와 함께 변경 내용을 저장합니다.

**4. 깃허브에 업로드 (푸시)**
```bash
git push origin main
```
> 로컬 컴퓨터의 변경 내용을 깃허브 서버에 업로드합니다.

### 요약
새 글을 쓸 때마다 `git status` -> `git add .` -> `git commit -m "메시지"` -> `git push` 이 4단계만 기억하면 됩니다. 이 과정을 통해 훨씬 전문적으로 블로그 콘텐츠를 관리할 수 있습니다.
```
