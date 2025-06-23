---
date: '2024-05-25'
title: 마크 다운 작성 가이드
excerpt: '이 블로그에서 사용할 수 있는 모든 마크다운 스타일을 확인해보세요.'
image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1470'
---

# A first-level heading (H1)
이것은 가장 큰 제목입니다. 글의 메인 타이틀과는 별개로 본문 안에서도 사용할 수 있습니다.

## A second-level heading (H2)
중간 크기의 제목입니다. 섹션을 나눌 때 유용하며, 아래에 선이 그어집니다.

### A third-level heading (H3)
더 작은 소제목입니다.

#### A fourth-level heading (H4)
가장 작은 크기의 제목입니다.

---

이것은 일반 텍스트 문단입니다. `line-height` 속성 덕분에 줄 간격이 적절히 유지됩니다.

> 이것은 인용구(blockquote)입니다. 다른 사람의 말을 인용하거나, 중요한 내용을 강조할 때 사용하세요. 왼쪽에 세로선이 생깁니다.

Use `git status` to list all new or modified files. 이렇게 문장 중간에 코드를 넣을 때는 `백틱`으로 감싸면 됩니다.

Some basic Git commands are:
- `git status`
- `git add`
- `git commit`

1. 첫 번째 할 일
2. 두 번째 할 일
3. 세 번째 할 일

```javascript
// This is a JavaScript code block.
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet('World');
