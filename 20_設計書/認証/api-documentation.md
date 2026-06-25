# 認証・ユーザー API ドキュメント

Version: 1.0.0
最終更新日: 2026-06-12

---

## 1. 概要

本ドキュメントは、認証(ログイン / ログアウト)および自身のユーザー情報取得を行う外部公開 API の仕様を定めるものです。

### ベース URL

| 環境 | URL |
|---|---|
| 本番 | `https://api.example.com` |
| ステージング | `https://api-stg.example.com` |

すべての通信は **HTTPS 必須** です。HTTP でのリクエストは受け付けません。

### 共通仕様

- リクエスト / レスポンスのボディはすべて JSON(`Content-Type: application/json`)
- 文字コードは UTF-8
- 日時は ISO 8601 形式(UTC)で返却します(例: `2026-06-12T03:00:00.000Z`)

---

## 2. 認証方式

本 API は 以下の認証方式をサポートします。クライアントの種別に応じて選択してください。

### 2-1. Cookie セッション方式(ブラウザ向け)

ログイン成功時に `Set-Cookie` ヘッダでセッション Cookie が発行されます。以降のリクエストではブラウザが自動的に Cookie を送信するため、追加の実装は不要です。

- Cookie は `HttpOnly` / `Secure` / `SameSite` 属性付きで発行されます
- フロントエンドからの fetch / axios 利用時は `credentials: "include"` を必ず指定してください

### セッション有効期限

| 項目 | 値 |
|---|---|
| 有効期限 | 7 日間 |
| 期限の延長 | 最終利用から 1 日経過後のアクセスで自動延長(スライド方式) |

有効期限が切れた場合、各 API は `401 Unauthorized` を返します。再度ログインしてください。

---

## 3. エンドポイント一覧

| # | 用途 | メソッド | パス | 認証 |
|---|---|---|---|---|
| 3-1 | ログイン | POST | `/api/auth/sign-in/email` | 不要 |
| 3-2 | ログアウト | POST | `/api/auth/sign-out` | 必要 |
| 3-3 | セッション確認 | GET | `/api/auth/get-session` | 必要 |
| 3-4 | 自分のユーザー情報取得 | GET | `/api/v1/users/me` | 必要 |

---

## 3-1. ログイン

メールアドレスとパスワードで認証し、セッションを開始します。

```
POST /api/auth/sign-in/email
```

### リクエストボディ

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `email` | string | ○ | 登録済みメールアドレス |
| `password` | string | ○ | パスワード |
| `rememberMe` | boolean | - | `false` の場合、ブラウザを閉じるとセッションが失効します(デフォルト: `true`) |

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

### レスポンス(200 OK)

```json
{
  "redirect": false,
  "token": "xxxxxxxxxxxxxxxxxxxxxxxx",
  "user": {
    "id": "usr_xxxxxxxxxxxx",
    "email": "user@example.com",
    "name": "山田 太郎",
    "image": null,
    "emailVerified": true,
    "createdAt": "2026-01-15T09:00:00.000Z",
    "updatedAt": "2026-06-01T12:00:00.000Z"
  }
}
```

| ヘッダ | 説明 |
|---|---|
| `Set-Cookie` | セッション Cookie(Cookie 方式の場合に使用) |

### エラーレスポンス

| ステータス | 条件 |
|---|---|
| `400 Bad Request` | リクエストボディの形式不正(必須フィールド欠落など) |
| `401 Unauthorized` | メールアドレスまたはパスワードが不一致 |
| `403 Forbidden` | メールアドレス未認証のアカウント |
| `429 Too Many Requests` | レート制限超過(後述) |

> セキュリティ上の理由から、「メールアドレスが存在しない」のか「パスワードが誤っている」のかはレスポンスで区別されません。

### サンプル(curl)

```bash
curl -X POST https://api.example.com/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "your-password"}'
```

---

## 3-2. ログアウト

現在のセッションを失効させます。

```
POST /api/auth/sign-out
```

### リクエスト

ボディは不要です。Cookie または `Authorization: Bearer <token>` ヘッダでセッションを指定してください。

### レスポンス(200 OK)

```json
{
  "success": true
}
```

Cookie 方式の場合、セッション Cookie は失効処理されます(`Set-Cookie` で削除)。

### エラーレスポンス

| ステータス | 条件 |
|---|---|
| `401 Unauthorized` | セッションが無効、または既に失効している |

### サンプル(curl)

```bash
curl -X POST https://api.example.com/api/auth/sign-out
```

---

## 3-3. セッション確認

現在のセッションが有効かどうかを確認し、セッション情報と基本的なユーザー情報を取得します。アプリ起動時のログイン状態チェックなどに使用してください。

```
GET /api/auth/get-session
```

### リクエスト

Cookie でセッションを指定してください。

### レスポンス(200 OK)

セッションが有効な場合:

```json
{
  "session": {
    "id": "ses_xxxxxxxxxxxx",
    "userId": "usr_xxxxxxxxxxxx",
    "expiresAt": "2026-06-19T03:00:00.000Z",
    "createdAt": "2026-06-12T03:00:00.000Z",
    "updatedAt": "2026-06-12T03:00:00.000Z"
  },
  "user": {
    "id": "usr_xxxxxxxxxxxx",
    "email": "user@example.com",
    "name": "山田 太郎",
    "image": null,
    "emailVerified": true,
    "createdAt": "2026-01-15T09:00:00.000Z",
    "updatedAt": "2026-06-01T12:00:00.000Z"
  }
}
```

セッションが無効な場合は `null` が返却されます(ステータスは 200)。

### サンプル(curl)

```bash
curl https://api.example.com/api/auth/get-session
```

---

## 3-4. 自分のユーザー情報取得

ログイン中のユーザー自身の情報を取得します。プロフィール表示など、アプリケーションでのユーザー情報参照にはこのエンドポイントを使用してください。

```
GET /api/v1/users/me
```

### リクエスト

Cookie でセッションを指定してください。

### レスポンス(200 OK)

```json
{
  "id": "usr_xxxxxxxxxxxx",
  "email": "user@example.com",
  "name": "山田 太郎",
  "image": "https://cdn.example.com/avatars/usr_xxxxxxxxxxxx.png",
  "emailVerified": true,
  "createdAt": "2026-01-15T09:00:00.000Z"
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | string | ユーザー ID |
| `email` | string | メールアドレス |
| `name` | string | 表示名 |
| `image` | string \| null | プロフィール画像 URL |
| `emailVerified` | boolean | メールアドレス認証済みかどうか |
| `createdAt` | string | アカウント作成日時(ISO 8601) |

### エラーレスポンス

| ステータス | 条件 |
|---|---|
| `401 Unauthorized` | 未ログイン、またはセッション期限切れ |

### サンプル(curl)

```bash
curl https://api.example.com/api/v1/users/me
```

---

## 4. エラーレスポンス共通形式

エラー時は以下の形式で返却されます。

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### ステータスコード一覧

| ステータス | 意味 | 対処 |
|---|---|---|
| `400` | リクエスト形式不正 | リクエストボディ・パラメータを確認してください |
| `401` | 未認証 / セッション失効 | 再度ログインしてください |
| `403` | アクセス権限なし | アカウント状態(メール認証など)を確認してください |
| `429` | レート制限超過 | `Retry-After` ヘッダ(秒)を参照し、時間をおいて再試行してください |
| `500` | サーバー内部エラー | 時間をおいて再試行し、解消しない場合はお問い合わせください |

---

## 5. レート制限

不正アクセス防止のため、以下のレート制限を設けています。

| 対象 | 制限 |
|---|---|
| ログイン(`/api/auth/sign-in/email`) | 同一 IP あたり 3 回 / 10 秒 |
| その他の認証エンドポイント | 同一 IP あたり 100 回 / 60 秒 |

制限を超過した場合は `429 Too Many Requests` を返却します。`Retry-After` ヘッダに再試行可能までの秒数が含まれます。

---

## 6. クライアント実装ガイドライン

### ブラウザ(SPA)からの利用

```javascript
// ログイン
const res = await fetch("https://api.example.com/api/auth/sign-in/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // Cookie の送受信に必須
  body: JSON.stringify({ email, password }),
});

// ユーザー情報取得
const me = await fetch("https://api.example.com/api/v1/users/me", {
  credentials: "include",
}).then((r) => r.json());
```

> CORS の制約上、利用するフロントエンドのオリジンは事前に当社へ申請・登録が必要です。


### 実装上の注意

1. **401 のハンドリング**: いずれの API でも `401` を受け取った場合はセッション切れと判断し、ログイン画面へ誘導してください。

---

## 7. 変更履歴

| 日付 | バージョン | 内容 |
|---|---|---|
| 2026-06-12 | 1.0.0 | 初版作成(ログイン / ログアウト / セッション確認 / ユーザー情報取得) |
