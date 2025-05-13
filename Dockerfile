FROM node:20-alpine

WORKDIR /app

# 의존성 패키지 설치
COPY package.json package-lock.json* ./
RUN npm ci

# 소스 코드는 볼륨으로 마운트할 예정이므로 복사하지 않음
# (docker-compose.yml에서 볼륨 설정)

# 개발 서버 포트 노출
EXPOSE 3000

# 개발 모드 실행 - Turbopack 사용
CMD ["npm", "run", "dev"] 