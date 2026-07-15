# some2 Backend API

## 공통 사항

### Base URL
```
http://<host>:<port>/api
```

### 인증

인증이 필요한 API는 요청 헤더에 로그인 시 발급받은 JWT 토큰을 포함해야 합니다.

```
Authorization: Bearer <token>
```

토큰이 없거나 유효하지 않으면 `401` 응답을 반환합니다.

### 응답 형식

모든 응답은 `application/json` 형식입니다.

**오류 응답**
```json
{
  "message": "오류 메시지"
}
```

| 상태 코드 | 설명 |
|---|---|
| `200` | 요청 성공 |
| `401` | 인증 실패 (토큰 없음, 만료, 유효하지 않음) |
| `500` | 서버 내부 오류 |

---

## Auth API

### 로그인

SNS 로그인 정보로 회원을 인증합니다. 가입되지 않은 회원이면 자동으로 회원가입 처리 후 토큰을 발급합니다.

```
POST /api/auth/login
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `sns_provider_code` | string | O | SNS 제공사 코드 (예: `kakao`, `google`, `apple`) |
| `sns_user_key` | string | O | SNS에서 발급한 고유 사용자 키 |
| `nickname` | string | O | 사용자 닉네임 |

```json
{
  "sns_provider_code": "kakao",
  "sns_user_key": "kakao_user_123456",
  "nickname": "홍길동"
}
```

**Response `200`**

| 필드 | 타입 | 설명 |
|---|---|---|
| `token` | string | JWT Access Token (만료: 1시간) |
| `nickname` | string | 사용자 닉네임 |

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "nickname": "홍길동"
}
```

---

### 토큰 유효성 검증

현재 토큰이 유효한지 확인합니다.

```
GET /api/auth/verify
```

**Headers**
```
Authorization: Bearer <token>
```

**Response**

| 상태 코드 | 설명 |
|---|---|
| `200` | 토큰 유효 |
| `401` | 토큰 만료 또는 유효하지 않음 |

```json
{}
```

---

### 로그아웃

```
POST /api/auth/logout
```

**Response `200`**
```json
{}
```

---

## User API

### 내 정보 조회

로그인한 사용자의 정보를 반환합니다.

```
GET /api/users/me
```

**Headers**
```
Authorization: Bearer <token>
```

**Response `200`**

| 필드 | 타입 | 설명 |
|---|---|---|
| `me.userId` | string | 사용자 ID |
| `me.snsProviderCode` | string \| null | SNS 제공사 코드 |
| `me.snsUserKey` | string \| null | SNS 사용자 키 |
| `me.nickname` | string \| null | 닉네임 |
| `me.name` | string \| null | 이름 |
| `me.phoneNumber` | string \| null | 전화번호 |
| `me.status` | string | 계정 상태 (`Y`: 정상, `N`: 비활성) |
| `me.totalAccumCash` | number \| null | 누적 캐시 |
| `me.cashBalance` | number \| null | 현재 캐시 잔액 |
| `me.totalAccumPoint` | number \| null | 누적 포인트 |
| `me.pointBalance` | number \| null | 현재 포인트 잔액 |
| `me.createdAt` | string | 가입일시 (ISO 8601) |
| `me.lastLoginAt` | string \| null | 마지막 로그인 일시 (ISO 8601) |

```json
{
  "me": {
    "userId": "1010101010",
    "snsProviderCode": "kakao",
    "snsUserKey": "kakao_user_123456",
    "nickname": "홍길동",
    "name": null,
    "phoneNumber": null,
    "status": "Y",
    "totalAccumCash": 0,
    "cashBalance": 0,
    "totalAccumPoint": 0,
    "pointBalance": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-07-15T10:00:00.000Z"
  }
}
```

---

## Saju API

### 내 사주 프로필 조회

로그인한 사용자의 사주 프로필을 반환합니다. 저장된 프로필이 없으면 `saju_profile`이 `null`로 반환됩니다.

```
GET /api/saju/my-profile
```

**Headers**
```
Authorization: Bearer <token>
```

**Response `200`**

| 필드 | 타입 | 설명 |
|---|---|---|
| `saju_profile` | object \| null | 사주 프로필 (없으면 `null`) |
| `saju_profile.saju_profile_id` | number | 프로필 ID |
| `saju_profile.user_id` | string | 사용자 ID |
| `saju_profile.is_self` | string | 본인 여부 (`Y`: 본인, `N`: 타인) |
| `saju_profile.name` | string | 이름 |
| `saju_profile.gender` | string | 성별 (`M`: 남성, `F`: 여성) |
| `saju_profile.birth_date` | string | 생년월일 (`YYYY-MM-DD`) |
| `saju_profile.calendar_type` | string | 달력 유형 (`solar`: 양력, `lunar`: 음력, `lunar_leap`: 윤달) |
| `saju_profile.birth_time` | string \| null | 출생 시간 (`HH:MM` 또는 `HH:MM:SS`, 모르면 `null`) |
| `saju_profile.relationship_type` | string \| null | 관계 유형 |
| `saju_profile.relation_duration` | string \| null | 관계 기간 |
| `saju_profile.relationship_status` | string \| null | 관계 상태 |
| `saju_profile.created_at` | string | 생성일시 (ISO 8601) |
| `saju_profile.updated_at` | string | 수정일시 (ISO 8601) |

```json
{
  "saju_profile": {
    "saju_profile_id": 1,
    "user_id": "1010101010",
    "is_self": "Y",
    "name": "홍길동",
    "gender": "M",
    "birth_date": "1990-05-15",
    "calendar_type": "solar",
    "birth_time": "14:30",
    "relationship_type": null,
    "relation_duration": null,
    "relationship_status": null,
    "created_at": "2024-07-15T10:00:00.000Z",
    "updated_at": "2024-07-15T10:00:00.000Z"
  }
}
```

프로필 없는 경우:
```json
{
  "saju_profile": null
}
```

---

### 사주 프로필 저장

사주 프로필을 저장하거나 업데이트합니다. 기존 프로필이 있으면 덮어씁니다.

```
POST /api/saju/profile
```

**Headers**
```
Authorization: Bearer <token>
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `name` | string | O | 이름 (1자 이상) |
| `gender` | string | O | 성별 (`M`: 남성, `F`: 여성) |
| `birth_date` | string | O | 생년월일 (`YYYY-MM-DD` 형식) |
| `calendar_type` | string | O | 달력 유형 (`solar`: 양력, `lunar`: 음력, `lunar_leap`: 윤달) |
| `birth_time` | string \| null | X | 출생 시간 (`HH:MM` 또는 `HH:MM:SS` 형식, 모르면 `null`) |
| `is_self` | string | O | 본인 여부 (`Y`: 본인, `N`: 타인) |
| `relationship_type` | string \| null | X | 관계 유형 |
| `relation_duration` | string \| null | X | 관계 기간 |
| `relationship_status` | string \| null | X | 관계 상태 |

```json
{
  "name": "홍길동",
  "gender": "M",
  "birth_date": "1990-05-15",
  "calendar_type": "solar",
  "birth_time": "14:30",
  "is_self": "Y",
  "relationship_type": null,
  "relation_duration": null,
  "relationship_status": null
}
```

**Response `200`**

저장된 사주 프로필을 반환합니다. 응답 구조는 [내 사주 프로필 조회](#내-사주-프로필-조회)의 `saju_profile` 필드와 동일합니다.

```json
{
  "saju_profile": {
    "saju_profile_id": 1,
    "user_id": "1010101010",
    "is_self": "Y",
    "name": "홍길동",
    "gender": "M",
    "birth_date": "1990-05-15",
    "calendar_type": "solar",
    "birth_time": "14:30",
    "relationship_type": null,
    "relation_duration": null,
    "relationship_status": null,
    "created_at": "2024-07-15T10:00:00.000Z",
    "updated_at": "2024-07-15T10:00:00.000Z"
  }
}
```
