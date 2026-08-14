---
name: system-design
description: 承認済みの要件をNext.jsとSupabaseの画面設計、DB設計、認証認可設計へ変換するときに使う。
---

# システム設計

## ワークフロー

1. `docs/requirements.md` と未解決事項を確認する。
2. App Routerの画面構成、コンポーネント境界、Server/Client Componentを設計する。
3. Supabaseのテーブル、主外部キー、制約、監査列、RLSポリシーを設計する。
4. Google OAuth、許可ユーザー、管理者・一般ユーザーのRBACを設計する。
5. レシピ非表示フラグは画面だけでなくRLS/サーバー側でも保護する。
6. 原価計算の入力、計算、丸め、月次集計を定義し、`docs/design.md` を更新する。

## 完了条件

- 画面、データ、権限、計算式の対応を追跡できる。
- 秘密情報やservice role keyがブラウザーへ露出しない。
- 実装順序とマイグレーション方針が記載されている。
