# some2 Backend API

썸 손절 판별 서비스의 백엔드 API 서버입니다.

- **Runtime**: Node.js + TypeScript (ESM)
- **Framework**: Express 5
- **Database**: PostgreSQL 18 + Prisma 7
- **Auth**: JWT (액세스 토큰 + HttpOnly 쿠키 리프레시 토큰)
- **Payment**: Toss Payments
- **AI**: OpenAI

---

## 환경 변수

`.env` 파일을 프로젝트 루트에 생성합니다.

| 변수명 | 설명 |
|---|---|
| `IS_PRODUCTION` | 운영 환경 여부 (`Y` / 미설정) |
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `JWT_SECRET` | JWT 서명 키 |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `KAKAO_JS_APP_KEY` | 카카오 JS 앱 키 |
| `OPENAI_API_KEY` | OpenAI API 키 |
| `TOSS_SECRET_KEY` | Toss Payments 시크릿 키 |

---

## 서버 실행

```bash
# 개발
npm run dev

# 빌드 후 실행
npm run build
npm start
```

서버는 **포트 3000**에서 실행됩니다.

---

## 공통 규칙

### Base URL

| 환경 | URL |
|---|---|
| 개발 | `http://localhost:3000` |
| 운영 | `https://some2-backend.example.com` |

### 인증

인증이 필요한 API는 요청 헤더에 액세스 토큰을 포함합니다.

```
Authorization: Bearer <access_token>
```

| 토큰 종류 | 만료 시간 | 전달 방식 |
|---|---|---|
| 액세스 토큰 | 10분 | `Authorization` 헤더 |
| 리프레시 토큰 | 7일 | `refreshToken` HttpOnly 쿠키 |

### Rate Limit

15분 내 최대 **100 요청**. 초과 시 `429` 응답.

### 에러 응답

```json
{ "message": "에러 설명" }
```

| HTTP 상태 | 의미 |
|---|---|
| `400` | 잘못된 요청 / 비즈니스 오류 |
| `401` | 인증 필요 |
| `404` | 리소스 없음 |
| `429` | Rate Limit 초과 |
| `500` | 서버 내부 오류 |

---

## API 레퍼런스

---

### Auth API — `/api/auth`

#### POST `/api/auth/login`

SNS 계정으로 로그인합니다. 성공 시 액세스 토큰을 반환하고, 리프레시 토큰을 HttpOnly 쿠키에 저장합니다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `sns_provider_code` | `string` | Y | SNS 구분 코드 (`google`, `kakao`) |
| `credential` | `string` | Y | SNS 인증 코드 또는 ID 토큰 |

```json
{
  "sns_provider_code": "google",
  "credential": "eyJhbGciOi..."
}
```

**Response**

```json
{
  "token": "<access_token>",
  "nickname": "홍길동"
}
```

---

#### POST `/api/auth/refresh`

리프레시 토큰 쿠키를 이용해 액세스 토큰을 갱신합니다. 요청 시 별도의 Body 없이 쿠키만 전송합니다.

> **쿠키 필요**: `refreshToken`

**Response**

```json
{
  "token": "<new_access_token>",
  "nickname": "홍길동"
}
```

**에러 케이스**

| 상황 | 응답 |
|---|---|
| 쿠키 없음 | `400 { "message": "권한이 없습니다." }` |
| 토큰 만료 | `400 { "message": "세션이 만료되었습니다. 다시 로그인해주세요." }` |
| 토큰 변조 | `400 { "message": "유효하지 않은 토큰입니다." }` |

---

#### POST `/api/auth/logout`

로그아웃합니다. 리프레시 토큰 쿠키를 제거합니다.

**Response**

```json
{}
```

---

### User API — `/api/users`

> 모든 엔드포인트에 **인증 필요**

#### GET `/api/users/me`

현재 로그인한 회원의 정보를 반환합니다.

**Response**

```json
{
  "me": {
    "userId": "U0000000001",
    "nickname": "홍길동",
    "name": null,
    "status": "Y",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Saju API — `/api/saju`

> 모든 엔드포인트에 **인증 필요**

#### POST `/api/saju/profile`

사주 프로필을 저장합니다.

- `is_self: "Y"` — 본인 프로필. 기존 본인 프로필이 있으면 수정, 없으면 신규 등록.
- `is_self: "N"` — 상대방 프로필. 항상 신규 등록.

사주(년주·월주·일주·시주)는 서버에서 자동 계산됩니다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `name` | `string` | Y | 이름 (최소 1글자) |
| `gender` | `"F"` \| `"M"` | Y | 성별 |
| `birth_date` | `string` | Y | 생년월일 (`YYYY-MM-DD`) |
| `birth_time` | `string` \| `""` | Y | 출생 시간 (`HH:MM` 또는 빈 문자열) |
| `calendar_type` | `"solar"` \| `"lunar"` \| `"lunar_leap"` | Y | 역법 (양력 / 음력 / 음력 윤달) |
| `is_self` | `"Y"` \| `"N"` | Y | 본인 여부 |
| `relationship_type` | `string` | N | 본인과의 관계 |
| `relation_duration` | `string` | N | 관계 기간 |
| `relationship_status` | `string` | N | 현재 상황 및 고민 |

```json
{
  "name": "홍길동",
  "gender": "M",
  "birth_date": "1995-03-15",
  "birth_time": "14:30",
  "calendar_type": "solar",
  "is_self": "Y"
}
```

**Response**

```json
{
  "saju_profile": {
    "saju_profile_id": 1,
    "user_id": "U0000000001",
    "is_self": "Y",
    "name": "홍길동",
    "gender": "M",
    "birth_date": "1995-03-15",
    "calendar_type": "1",
    "birth_time": "14:30",
    "relationship_type": null,
    "relation_duration": null,
    "relationship_status": null,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### GET `/api/saju/my-profile`

본인의 사주 프로필(`is_self: "Y"`)을 조회합니다. 등록된 프로필이 없으면 `null`을 반환합니다.

**Response**

```json
{
  "saju_profile": {
    "saju_profile_id": 1,
    "user_id": "U0000000001",
    "is_self": "Y",
    "name": "홍길동",
    "gender": "M",
    "birth_date": "1995-03-15",
    "calendar_type": "1",
    "birth_time": "14:30",
    "relationship_type": null,
    "relation_duration": null,
    "relationship_status": null,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### GET `/api/saju/profile_list`

상대방 사주 프로필 목록(`is_self: "N"`)을 조회합니다.

**Response**

```json
{
  "saju_profiles": [
    {
      "saju_profile_id": 2,
      "name": "김썸녀",
      "gender": "F",
      "relationship_type": "소개팅",
      "relation_duration": "2개월",
      "relationship_status": "3일째 연락 없음",
      "created_at": "2025-01-01T00:00:00.000Z",
      "report_yn": "N"
    }
  ]
}
```

---

#### POST `/api/saju/report`

사주 프로필의 리포트 생성 여부(`report_yn`)를 `Y`로 업데이트합니다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `saju_profile_id` | `number` | Y | 사주정보 고유 ID |

```json
{
  "saju_profile_id": 2
}
```

**Response**

```json
{
  "saju_profile_id": 2
}
```

---

### Order API — `/api/orders`

> 모든 엔드포인트에 **인증 필요**

결제 플로우: `주문 생성` → `클라이언트 Toss 결제창` → `결제 승인`

고정 상품: **썸 손절 판별 리포트** / 고정 금액: **3,300원**

#### POST `/api/orders/create`

주문서를 생성하고 `order_id`를 발급합니다. 이 `order_id`를 Toss 결제창 호출 시 사용합니다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `saju_profile_id` | `number` | Y | 리포트를 생성할 상대방 사주정보 ID |
| `payment_amount` | `number` | Y | 결제금액 (반드시 `3300`) |

```json
{
  "saju_profile_id": 2,
  "payment_amount": 3300
}
```

**Response**

```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

#### POST `/api/orders/confirm`

Toss 결제 승인을 처리합니다. 성공 시 리포트 레코드(`report_id`)가 생성됩니다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `paymentKey` | `string` | Y | Toss에서 발급한 결제 키 |
| `orderId` | `string` (UUID) | Y | 주문 생성 시 발급받은 `order_id` |
| `amount` | `number` | Y | 결제금액 |

```json
{
  "paymentKey": "5zJ4xY7m0kODnyRpQWEkslYnlb...",
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 3300
}
```

**Response**

```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "report_id": "7f3e9c1a-4b2d-4f8e-9a1c-3d5e7f9b1c3a"
}
```

---

### Report API — `/api/reports`

> 모든 엔드포인트에 **인증 필요**

리포트 플로우: `주문 승인 후 report_id 수령` → `리포트 생성 요청` → `리포트 조회`

리포트는 OpenAI를 통해 8개 섹션으로 생성됩니다.

#### POST `/api/reports/generate`

AI 리포트를 생성합니다. 본인과 상대방의 사주를 분석하여 8개 섹션의 텍스트를 생성하고 DB에 저장합니다. 이미 완료된 리포트(`report_status: "B"`)는 재생성하지 않습니다.

> 본인 사주 프로필(`is_self: "Y"`)이 등록되어 있어야 합니다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `report_id` | `string` (UUID) | Y | 결제 승인 시 발급받은 `report_id` |

```json
{
  "report_id": "7f3e9c1a-4b2d-4f8e-9a1c-3d5e7f9b1c3a"
}
```

**Response**

```json
{
  "report_id": "7f3e9c1a-4b2d-4f8e-9a1c-3d5e7f9b1c3a"
}
```

---

#### GET `/api/reports`

내 리포트 목록을 조회합니다.

**Response**

```json
{
  "reports": [
    {
      "report_id": "7f3e9c1a-4b2d-4f8e-9a1c-3d5e7f9b1c3a",
      "saju_profile_id": 2,
      "report_status": "B",
      "created_at": "2025-01-01T00:00:00.000Z",
      "partner_name": "김썸녀",
      "partner_gender": "F",
      "partner_relationship_type": "소개팅"
    }
  ]
}
```

**`report_status` 값**

| 값 | 의미 |
|---|---|
| `A` | 작성중 (AI 생성 미완료) |
| `B` | 작성완료 |

---

#### GET `/api/reports/:reportId`

특정 리포트의 전체 내용을 조회합니다.

**Path Parameter**

| 파라미터 | 설명 |
|---|---|
| `reportId` | 리포트 UUID |

**Response**

```json
{
  "report": {
    "report_id": "7f3e9c1a-4b2d-4f8e-9a1c-3d5e7f9b1c3a",
    "report_status": "B",
    "report_section1": "## 의뢰인 사주 분석\n...",
    "report_section2": "## 상대방 사주 분석\n...",
    "report_section3": "...",
    "report_section4": "...",
    "report_section5": "...",
    "report_section6": "...",
    "report_section7": "...",
    "report_section8": "## 종합 판정\n...",
    "created_at": "2025-01-01T00:00:00.000Z",
    "client_name": "홍길동",
    "partner_name": "김썸녀",
    "partner_relationship_type": "소개팅"
  }
}
```

---

## 전체 사용 플로우

```
1. [로그인]         POST /api/auth/login
                     → access_token, refreshToken(쿠키)

2. [본인 사주 등록]  POST /api/saju/profile  (is_self: "Y")

3. [상대 사주 등록]  POST /api/saju/profile  (is_self: "N")
                     → saju_profile_id

4. [주문 생성]       POST /api/orders/create
                     → order_id

5. [Toss 결제]       클라이언트에서 Toss 결제창 호출 (order_id 전달)
                     → paymentKey

6. [결제 승인]       POST /api/orders/confirm
                     → report_id

7. [리포트 생성]     POST /api/reports/generate
                     → report_id (생성 완료)

8. [리포트 조회]     GET  /api/reports/:reportId
                     → 8섹션 리포트 내용
```
