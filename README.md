# CheatGuard - 종합 온라인 시험 감독 시스템

CheatGuard는 온라인 시험 환경에서 부정행위를 종합적으로 감지하고 방지하는 웹 기반 시스템입니다. 이 시스템은 강사가 시험을 생성 및 관리하고, 학생들이 안전한 환경에서 시험을 응시하도록 지원하며, AI 기반의 실시간 감지 및 분석 기능을 제공합니다.

---
## 배포 경로

* **데모**: [CheatGuard 데모](https://cheat-guard-front-2nb7l10a3-chois-projects-115f9e6c.vercel.app/)
(테스트 계정: id: `test1234` / password: `test1234!`)
* **API 문서**: [Swagger](https://backend.cheatguard.site/api/docs)
* **백엔드**: [백엔드 Git](https://github.com/CSchoice/cheat_guard)
* **프론트엔드**: [프론트엔드 Git](https://github.com/CSchoice/cheat_guard_front)

---

## 🛠 전체 기술 스택

* **프론트엔드**: React 18, React Router 6, Chakra UI, Axios, Socket.IO Client
* **백엔드**: NestJS 9.x, MariaDB(TypeORM), JWT, Passport, AWS S3, WebSocket
* **AI 서비스**: FastAPI, YOLOv10, MediaPipe, PyTorch, OpenCV, NumPy

---

## 🌟 주요 기능

### 1. 사용자 관리 및 인증

* JWT 기반 인증
* 역할 기반 접근 제어 (RBAC)
* 사용자 프로필 및 계정 관리

### 2. 시험 관리

* 시험 생성 및 일정 관리
* 실시간 시험 모니터링 및 분석
* 부정행위 기록 및 관리

### 3. 실시간 감독

* 웹캠을 통한 실시간 화상 스트리밍
* WebSocket 기반 실시간 통신
* 네트워크 자동 재연결

### 4. AI 기반 부정행위 감지

* YOLOv10을 활용한 실시간 객체 감지
* MediaPipe를 활용한 시선 추적
* 의심스러운 행동 실시간 분석 및 알림

## 📌 전체 시스템 아키텍처

### 백엔드

```
src/
├── common/                 # 공통 모듈 (가드, 파이프, 필터 등)
├── config/                 # 환경 설정
├── modules/                # 기능별 모듈
│   ├── analyzer/           # 부정행위 분석
│   ├── auth/               # 인증/인가
│   ├── exam/               # 시험 관리
│   ├── health/             # 헬스 체크
│   ├── streaming/          # 실시간 스트리밍
│   └── users/              # 사용자 관리
└── shared/                 # 공유 유틸리티
```

### AI 서버

```
cheat_guard_ai/
├── ai/                     # AI 모델 및 관련 코드
│   └── main.py             # 메인 애플리케이션 진입점
├── requirements.txt        # 프로젝트 의존성
├── yolo_server.py          # FastAPI 서버
├── yolov10l.pt             # YOLOv10 L 모델 (대형)
└── yolov10n.pt             # YOLOv10 N 모델 (소형)
```

### 프론트엔드

```
src/
├── api/                    # API 요청
├── assets/                 # 정적 자원
├── components/             # 재사용 가능한 컴포넌트
├── contexts/               # 전역 상태 관리
├── hooks/                  # 커스텀 훅
├── pages/                  # 페이지 컴포넌트
├── services/               # 비즈니스 로직
├── styles/                 # 전역 스타일
└── utils/                  # 유틸리티 함수
```

---

## 🚀 설치 및 실행

### 백엔드

```bash
git clone [backend-repo-url]
cd cheat_guard
npm install

# 환경 변수 설정 (.env 파일 생성)
npm run typeorm migration:run

# 실행
npm run start:dev
```

### AI 서버

```bash
git clone https://github.com/CSchoice/cheat_guard_ai.git
cd cheat_guard_ai
python -m venv venv
source venv/bin/activate  # Linux/macOS
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt

uvicorn yolo_server:app --host 0.0.0.0 --port 8000 --reload
```

### 프론트엔드

```bash
git clone [frontend-repo-url]
cd cheat-guard-front
npm install

# 환경 변수 설정 (.env 파일 생성)
npm start
```