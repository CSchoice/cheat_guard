# 1) 베이스 이미지
FROM node:lts-alpine AS builder

# 2) 작업 디렉토리 설정
WORKDIR /app

# 3) 의존성 설치를 위해 package 파일만 먼저 복사
COPY package.json yarn.lock ./

# 4) 의존성 설치
RUN yarn install --frozen-lockfile

# 5) 소스 코드 복사
COPY . .

# 6) Nest 빌드
RUN yarn build

# --------- 실제 경량 이미지 단계 ----------
FROM node:lts-alpine

WORKDIR /app

# 1) production 의존성만 설치
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# 2) 빌드된 결과물 복사
COPY --from=builder /app/dist ./dist

# 3) 환경변수 파일도 복사
COPY .env ./

# 4) 컨테이너 내부 포트 노출(Nest 기본 3000)
EXPOSE 3000

# 5) 애플리케이션 실행
CMD ["node", "dist/main.js"]
