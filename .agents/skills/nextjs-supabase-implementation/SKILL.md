---
name: nextjs-supabase-implementation
description: 承認済み設計に沿ってNext.js 16、TypeScript、Supabaseを安全に実装または変更するときに使う。
---

# Next.js・Supabase実装

## ワークフロー

1. `AGENTS.md` と `node_modules/next/dist/docs/` の該当するNext.js 16文書を先に確認する。
2. `docs/design.md` に沿い、レビュー可能な小さい単位で実装する。
3. 環境変数は `.env.example` のみ共有し、実値をコミットしない。
4. Supabase RLSを前提とし、管理操作と一般閲覧を分離する。
5. UIの非表示だけを認可手段にせず、秘密レシピは取得段階から除外する。
6. `pnpm lint`、`pnpm build`、関連テストを実行し、結果を引継ぎに記録する。

## コーディング基準

- TypeScriptの型安全性を保ち、不必要な`any`を使わない。
- 金額の単位と丸め規則を明示する。
- アクセシビリティ、レスポンシブ表示、空・読込・エラー状態を実装する。
- 既存仕様外の機能を勝手に追加しない。
