# 家計簿アプリ PoC（Cloudflare Pages + KV）

Cloudflare Pages / Pages Functions と KV を使った、  
**シンプルな家計簿アプリの PoC（検証用実装）**です。

フロントエンド・バックエンドともに最小構成で実装しており、  
**Public リポジトリでの公開を前提**としています。

---

## 特徴

- 家計簿の入力 / 月次集計 / 編集 / 削除
- 分類（カテゴリ）の管理
- Cookie + KV による簡易ログイン
- Cloudflare Pages Functions で完結
- 個人情報・秘密情報はリポジトリに含めない設計

---

## 技術スタック

- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare KV
- Vanilla JavaScript（フレームワーク不使用）
- HTML / CSS

---

## ディレクトリ構成（概要）
```
/
├─ index.html          # 入力画面
├─ monthly_sum.html    # 月次集計画面
├─ admin.html          # 管理画面
├─ login.html          # ログイン画面
├─ *.js                # フロントエンド JS
├─ style.css
├─ functions/          # Pages Functions（API）
│  ├─ login.js
│  ├─ logout.js
│  ├─ me.js
│  ├─ expenses.js
│  ├─ monthly.js
│  ├─ categories.js
│  ├─ admin/
│  │  ├─ purge-all.js
│  │  └─ purge-month.js
│  └─ _lib/
│     ├─ auth.js
│     ├─ kv.js
│     ├─ cookies.js
│     ├─ cors.js
│     └─ resp.js
└─ README.md
```
---

## セットアップ方法

### 1. Cloudflare Pages にデプロイ

- このリポジトリを Cloudflare Pages に接続してください
- Pages Functions と KV が使えるプロジェクトとして作成してください


---

### 2. KV の作成・バインド

Cloudflare ダッシュボードで KV(namespace:KAKIBO_KV) を作成し、  
**バインディング名を以下に設定**してください。

KAKEIBO_KV

---

### 3. 環境変数（ログイン情報）の設定（重要）

このアプリは PoC のため、**固定ログイン方式**を採用しています。  
ログイン ID / パスワードは **コードには書かず、環境変数で設定**します。

Cloudflare Pages の  
**Variables and Secrets** に、次の 2 つを追加してください。

Variable name      | 内容
-------------------|----------------
FIXED_LOGIN_ID     | 任意のログインID
FIXED_LOGIN_PASS   | 任意のパスワード

※ 値は GitHub リポジトリには含まれません。  
設定後は **再デプロイ**してください。

---

## ログインについて

- /login.html からログイン
- 環境変数で設定した ID / Password が一致した場合のみログイン成功
- 認証情報は Cookie + KV に保存されます
- セッション有効期限：7日

---

## 個人情報・セキュリティについて

このリポジトリには：

- 実在個人の氏名
- メールアドレス
- 電話番号
- 固定 ID / パスワード
- API キー / トークン
- 実データ（家計簿の中身）

**いずれも含まれていません。**

---

## 注意事項（PoC である点）

- 認証は簡易実装です（本番用途非推奨）
- 権限管理はありません（単一ユーザー想定）
- 大量データや高負荷は想定していません
- セキュリティ・可用性は最小限です

---

## ライセンス

PoC / 学習用途を想定しています。  
LICENSE ファイルを参照ください。

---

## 補足

- debug 用エンドポイントは **公開前に削除済み**
- 秘密情報はすべて環境変数で管理します
