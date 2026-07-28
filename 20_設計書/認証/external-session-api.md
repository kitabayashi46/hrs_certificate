# 外部連携: 認証済みユーザー情報取得 API

外部 Web サイトから、HIROSE 会員サイトでログイン中のユーザー情報を取得するための API です。
会員サイトが発行する**ハンドオフトークン（Bearer）**を検証し、**会員ID・メールアドレス・氏名・ロール**を返します。

- **対象読者**: 本 API を呼び出す外部サイトの開発者
- **認証方式**: Bearer トークン（会員サイトが発行する短命・単回利用のハンドオフトークン）
- **アクセス制限**: 送信元 IP の許可リスト制限あり（下記参照）

> **注意**: URL(uid)に載るのは生のセッショントークンではなく、会員サイトが発行する**短命・単回利用のハンドオフトークン**です。漏えい時の影響を最小化するため、1 度の取得 API 呼び出しで無効化されます。

---

## エンドポイント

外部サイト開発者が利用するのは以下の**取得 API** です。

| 項目 | 内容 |
| --- | --- |
| メソッド | `GET` |
| パス | `/api/v1/external/session/user` |
| ベースURL | `{API_BASE_URL}`（環境ごとに異なります。担当までご確認ください） |

完全な URL の例:

```text
GET {API_BASE_URL}/api/v1/external/session/user
```

> 会員サイト（storefront）側は、遷移前に発行 API `POST /api/v1/external/session/handoff`（Cookie セッション認証）でハンドオフトークンを取得し、遷移 URL の `uid` に載せます。この発行 API は外部サイト開発者は使用しません。

---

## 認証

`Authorization` ヘッダーに、会員サイトが発行した**ハンドオフトークン**を **Bearer 形式**で指定します。

```http
Authorization: Bearer <handoff_token>
```

- `<handoff_token>` は、会員サイトが発行する**短命・単回利用**の不透明なトークンです（内容の解釈・改変は不要かつ非対応です）。
- トークンが**無効・期限切れ・使用済み**の場合、`401 Unauthorized` を返します。
- 単回利用のため、**取得 API の呼び出しは 1 回のみ**有効です。取得したユーザー情報は外部サイト側のセッションに保持してください。

### トークン（uid）の受け取り方

会員サイトから外部サイトへ遷移する際、遷移先 URL の **`uid` クエリパラメータ**にハンドオフトークンが付与されます。
（会員サイト側は遷移前に発行 API `POST /api/v1/external/session/handoff` でトークンを取得し、URL に載せます。外部サイト開発者はこの発行手順を意識する必要はありません。）

```text
https://your-site.example.com/?uid=<handoff_token>
```

外部サイト側では、この `uid` の値を取り出し、**バックエンドへ引き渡してから**本 API の `Authorization: Bearer` に指定してください。

1. 会員サイトのリンクから `https://your-site.example.com/?uid=xxxxxxxx` で遷移してくる
2. URL のクエリ `uid` を取得し、外部サイトのバックエンドへ送る
3. バックエンドから `Authorization: Bearer ${uid}` を付けて本 API を **1 回だけ** 呼び出す

```javascript
// 遷移先ページ（外部サイト・フロント）での取得例
const uid = new URL(location.href).searchParams.get("uid");
// → この uid を自サイトのバックエンドへ渡し、バックエンドから本 API を呼び出す
```

> **セキュリティ**:
> - ハンドオフトークンは認証情報です。**ログや保存領域に残さない**でください。
> - `uid` は遷移直後に取得し、以降は URL から除去（`history.replaceState` 等）することを推奨します。
> - 本 API の呼び出しは**サーバー間通信（HTTPS）**で行ってください（IP 許可リストの対象は呼び出し元サーバーの IP です）。

---

## IP 制限

このエンドポイントは、**事前に許可された送信元 IP からのアクセスのみ**を受け付けます。

- 呼び出し元サーバーの**送信元（egress）IP アドレス**を、事前に許可リストへ登録する必要があります。
- 許可されていない IP からのアクセスは `403 Forbidden` を返します。

新しい呼び出し元を追加する場合は、**該当サーバーのグローバル IP** を API 運用担当へご連絡ください。

---

## リクエスト

### ヘッダー

| ヘッダー | 必須 | 説明 |
| --- | --- | --- |
| `Authorization` | ✔ | `Bearer <session_token>` |

ボディ・クエリパラメータはありません。

---

## レスポンス

### 200 OK

認証済みユーザーの情報を返します。

```json
{
  "userId": "1024",
  "email": "taro.yamada@example.com",
  "name": "山田 太郎",
  "role": "GENERAL"
}
```

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `userId` | `string` | 会員ID（連番）。会員を一意に識別するIDです |
| `email` | `string` | メールアドレス |
| `name` | `string` | ユーザー氏名（`姓 名`）。氏名未設定の場合は `ユーザー` を返します |
| `role` | `string \| null` | ロール（下表）。未設定の場合は `null` |

#### `role` の値

| 値 | 意味 |
| --- | --- |
| `GENERAL` | 一般 |
| `EMPLOYEE` | 社員 |
| `AGENCY` | 代理店 |
| `SALES_COMPANY` | 販社 |
| `null` | ロール未設定 |

---

## エラーレスポンス

エラーは以下の統一フォーマットで返却されます。

```json
{
  "success": false,
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "Invalid or expired session"
}
```

| HTTP | `code` | 発生条件 |
| --- | --- | --- |
| `401` | `UNAUTHORIZED` | `Authorization` ヘッダーが無い / Bearer トークンが空 |
| `401` | `UNAUTHORIZED` | ハンドオフトークンが無効・期限切れ・使用済み、または紐づくセッションが期限切れ |
| `403` | `FORBIDDEN` | 許可されていない IP からのアクセス |
| `404` | `NOT_FOUND` | セッションは有効だが、対象ユーザーが存在しない（退会済み等） |

> トークンが無効・使用済み・期限切れの場合は必ず `401` を返します。呼び出し側では `401` を「未ログイン／要再ログイン」として扱ってください。

---

## 利用例

### cURL

```bash
curl -X GET "{API_BASE_URL}/api/v1/external/session/user" \
  -H "Authorization: Bearer <handoff_token>"
```

### JavaScript（Node.js / サーバー間通信）

この API は送信元 IP 許可リストで制限されます。ブラウザから直接呼び出すと許可判定の対象が各利用者の IP になり通常 `403` となるため、**外部サイトのバックエンドから**呼び出してください。

```javascript
// 外部サイトのバックエンド（サーバー）で実行する
const res = await fetch(`${API_BASE_URL}/api/v1/external/session/user`, {
  method: "GET",
  headers: {
    // ブラウザ経由で受け取り、サーバーへ引き渡したハンドオフトークン
    Authorization: `Bearer ${handoffToken}`,
  },
});

if (res.status === 401) {
  // 未ログイン / セッション切れ → 再ログインへ誘導
} else if (res.ok) {
  const user = await res.json();
  // user.userId, user.email, user.name, user.role
}
```

### PHP

```php
$ch = curl_init("{$apiBaseUrl}/api/v1/external/session/user");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ["Authorization: Bearer {$handoffToken}"],
]);
$body   = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($status === 200) {
    $user = json_decode($body, true);
    // $user['userId'], $user['email'], $user['name'], $user['role']
} elseif ($status === 401) {
    // 未ログイン / セッション切れ
}
```

---

## FAQ / 注意事項

- **Q. `userId` は何のIDですか？**
  A. 会員の業務用ID（連番）です。会員を一意に識別できます。

- **Q. `role` が `null` で返ることはありますか？**
  A. あります。ロール未設定のユーザーでは `null` になります。呼び出し側で null 許容の実装にしてください。

- **Q. 403 が返ります。**
  A. 送信元サーバーの IP が許可リストに登録されていません。グローバル IP を API 運用担当へご連絡ください。

- **Q. トークンはあるのに 401 になります。**
  A. ハンドオフトークンが期限切れ・使用済み（単回利用のため 2 回目以降は無効）か、紐づくセッションが失効しています。会員サイトからの再遷移（トークン再発行）が必要です。

- **Q. なぜ取得 API は 1 回しか呼べないのですか？**
  A. URL に載るトークンの漏えい被害を最小化するため、ハンドオフトークンは単回利用です。取得したユーザー情報は外部サイト側のセッションに保持してください。
