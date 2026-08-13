# 사주 · saju-me

생년월일과 시간을 입력하면, 당신만의 사주를 풀어 드리는 웹 서비스입니다.

👉 **[uunmei.netlify.app](https://uunmei.netlify.app/)**

Google 계정으로 로그인한 뒤 출생 정보를 넣으면, Gemini가 사주 명식(命式)부터 성격·연애·재물·대운까지 풀어 주고, 결과는 계정에 저장됩니다.

## 기능

- **Google 로그인** — Supabase Auth로 계정을 만들고, 사주 기록은 사용자별로 분리됩니다.
- **사주 해석** — 이름, 생년월일, 성별, 양력/음력을 입력합니다. 태어난 시간은 선택입니다.
- **오늘의 운세** — 저장된 사주를 열 때 그날의 총운·주의할 점·하면 좋은 일을 따로 생성합니다.
- **기록 보관** — 사이드바에서 이전 사주를 다시 보고, 개인정보만 수정할 수 있습니다.
- **같은 입력 재사용** — 이미 본 조합이면 AI를 다시 호출하지 않고 저장된 결과를 엽니다.
- **공유 링크** — 친구에게 사주 해석을 보낼 수 있습니다. 로그인하지 않아도 공유 페이지는 볼 수 있습니다.
- **누적 생성 수** — 로그인 화면에 이때까지 만들어진 사주 개수를 보여 줍니다.

해석은 아래 열두 항목을 순서대로 담습니다.

1. 사주 명식
2. 전반적인 성격, 기질, 재능
3. 사주에서 특이한 점
4. 약점 및 해결법
5. 무의식 속 트라우마 및 극복법
6. 강점 및 활용법
7. 연애운
8. 재력운
9. 어울리는 학문/직업
10. 인간관계
11. 앞으로의 대운 흐름
12. 10년 단위 인생 그래프

## 기술 스택

| 구분 | 사용 |
| --- | --- |
| 프론트엔드 | React 19, Vite 8 |
| AI | Gemini (`gemini-3.6-flash`) |
| 백엔드 / 인증 / DB | Supabase (Auth, Postgres, RLS) |
| 배포 | Netlify |
| 분석 | Google Analytics 4 |

## 로컬에서 실행하기

Node.js가 필요합니다.

```bash
npm install
cp .env.example .env
```

`.env`에 키를 채운 뒤 개발 서버를 켭니다. OAuth 복귀를 위해 **3000번 포트**를 사용합니다.

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속합니다.

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (포트 3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | Oxlint |

## 환경 변수

`.env.example`을 복사해 `.env`를 만들고 아래 값을 넣습니다. 배포 환경(Netlify)에도 같은 이름으로 등록해야 합니다.

| 변수 | 설명 |
| --- | --- |
| `VITE_GEMINI_API_KEY` | Google AI Studio에서 발급한 Gemini API 키 |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon(공개) 키 |

API 키와 anon 키는 저장소에 커밋하지 마세요.

## Google 로그인 설정

1. **Google Cloud**
   - Authorized redirect URI: `https://<프로젝트>.supabase.co/auth/v1/callback`
   - Authorized JavaScript origins: `http://localhost:3000`, `https://uunmei.netlify.app`
2. **Supabase Authentication > URL Configuration**
   - Site URL: 로컬은 `http://localhost:3000`, 배포는 `https://uunmei.netlify.app`
   - Redirect URLs: `http://localhost:3000/**`, `https://uunmei.netlify.app/**`

## 프로젝트 구조

```
src/
  App.jsx                 # 화면 조합
  api/                    # profiles, readings, share
  components/
    auth/                 # 로그인
    layout/               # 셸, 히어로, 기록 사이드바
    reading/              # 입력 폼, 결과, 보관함
    share/                # 공유 보기
  hooks/                  # useAuth, useSajuApp
  lib/                    # Supabase, Gemini, 포맷, 분석
  prompts/                # 사주·오늘의 운세 프롬프트
public/
  share.html              # 공유 링크 진입 (OG 미리보기용)
```

공유 URL은 `/share.html?t=<token>` 형태입니다. 크롤러는 여기서 미리보기 이미지를 읽고, 사용자는 `/?share=<token>` 으로 넘어가 해석을 봅니다.

## 배포

Netlify에 연결되어 있으며, `main` 푸시 시 `npm run build` 후 `dist`를 배포합니다. SPA 라우팅을 위해 모든 경로는 `index.html`로 넘어갑니다. (`netlify.toml`)

필요한 Netlify 환경 변수:

- `VITE_GEMINI_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
