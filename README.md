# DP 관리 시스템 - 프론트엔드

Next.js와 React로 구현된 DP 관리 시스템의 프론트엔드입니다.

## 기술 스택

- Next.js
- React
- Tailwind CSS
- TypeScript

## 설치 및 실행

### 로컬 개발 환경

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

### Docker 환경

```bash
# Docker 이미지 빌드 & 실행
docker-compose up --build -d
```

## 주요 기능

- 사용자 인증 (로그인/로그아웃)
- Google OAuth 로그인
- 사용자 관리 대시보드
- 관리자 페이지

## 프로젝트 구조

```
frontend/
├── public/            # 정적 파일
├── src/
│   ├── app/           # Next.js 15 App Router
│   │   ├── admin/     # 관리자 페이지
│   │   └── login/     # 로그인 페이지
│   ├── components/    # 재사용 가능한 컴포넌트
│   ├── utils/         # 유틸리티 함수
│   └── styles/        # 전역 스타일
├── next.config.ts     # Next.js 설정
└── package.json       # 패키지 정보
```

## 환경 변수

`.env` 파일에 다음 환경 변수를 설정하세요:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## API 연동

백엔드 API 서버와의 연동은 `src/utils/api.ts`에서 관리됩니다. Next.js rewrites 기능을 사용하여 `/api` 경로를 백엔드로 프록시합니다.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
