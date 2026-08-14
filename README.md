# COST TABLE — 原価管理システム

タコス、カレー、コーヒー、アルコール、ソフトドリンクの仕込み原価を月単位で管理するNext.jsアプリです。

## 起動

```bash
copy .env.example .env.local
pnpm install
pnpm dev
```

`http://localhost:3000` を開いてください。Supabase接続前でも、サンプルデータのダッシュボードUIを確認できます。

DBの作成手順は`supabase/README.md`を参照してください。マイグレーション適用後、Supabase AuthでGoogle Providerと`http://localhost:3000/auth/callback`を設定します。

## 技術構成

- Next.js 16 / React 19 / TypeScript / Tailwind CSS
- Supabase（Postgres、Google OAuth、RLSを予定）
- Recharts / Lucide React

## 開発資料

- `docs/requirements.md`: 現時点の要件サマリー
- `docs/progress.md`: 開発進捗と次の作業
- `docs/ai_dev_skills_v2.yml`: 添付された開発体制の参照原本
- `.agents/skills/`: 要件、設計、実装、テスト、進捗管理のproject skills

## 検証

```bash
pnpm lint
pnpm build
```

環境変数の実値と社内秘レシピをGitへコミットしないでください。
