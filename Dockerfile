# 빌드 스테이지
FROM node:lts-alpine AS builder

WORKDIR /app

# 의존성 설치를 위해 package 파일들만 먼저 복사
COPY package.json package-lock.json ./
RUN npm ci

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# --- 런타임 이미지 ---
FROM node:lts-alpine
WORKDIR /app

# 프로덕션 의존성만 설치
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 빌드된 결과물 복사
COPY --from=builder /app/dist ./dist

# .env는 컨테이너 실행 시 주입하는 방식 권장
EXPOSE 3000

CMD ["node", "dist/main.js"]