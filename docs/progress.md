# 開発進捗

- 現在フェーズ: `implementation`
- 更新日時: 2026-08-15
- 次フェーズ移行判定: **yes**
- 判定理由: 要件と設計の対応、DB、RLS、認証、計算処理、実装順序が確定し、実装開始条件を満たしたため

## フェーズ状況

| フェーズ | 状態 | 完了証拠・成果物 |
| --- | --- | --- |
| 要件整理 | 完了 | `docs/requirements.md` 文書版1.0、ユーザー承認（2026-08-15） |
| システム設計 | 完了 | `docs/design.md` 文書版1.0、設計検証チェック完了 |
| UI初版 | 完了 | `src/app/page.tsx`、lint・production build成功 |
| Supabase接続 | 進行中 | `src/lib/supabase/client.ts`、Auth API HTTP 200確認 |
| Google認証 | 未着手 | - |
| DB・RLS | 未着手 | - |
| 機能実装 | 進行中 | 次にDBマイグレーション0001〜0006を作成 |
| テスト | 未着手 | - |

## 作業履歴

| 日付 | 通知元 | フェーズ | 実施内容 |
| --- | --- | --- | --- |
| 2026-08-15 | requirements-definition | requirements | 対象、計算式、MoSCoW、権限、非機能要件、受入条件を確定 |
| 2026-08-15 | development-progress | requirements | 完了条件を確認し、設計フェーズへの移行を承認 |
| 2026-08-15 | system-design | design | システム構成、DB、RLS、Google OAuth、原価計算、画面、実装順序を確定 |
| 2026-08-15 | development-progress | design | 設計完了条件を確認し、実装フェーズへの移行を承認 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | DBマイグレーション、原価計算関数、RLS、SSR Google認証基盤を実装。lint・build成功 |

## 決定事項

- 仕込み原価は材料別ロスを含め、出来上がり数量で按分する。
- 20人分は初期基準で、商品ごとに出来上がり数量を変更可能とする。
- 初版は在庫・発注・棚卸を対象外とする。
- 一般ユーザーには計算済み原価を表示し、秘密材料・使用量・調合情報は返さない。
- 開発中のGitHubリポジトリはPublicだが、秘密値と実レシピはコミットしない。

## 課題リスト

| ID | 内容 | 状態 | 担当 |
| --- | --- | --- | --- |
| P-01 | DBスキーマとRLSポリシーを設計する | 解決済み | system-design |
| P-02 | Google OAuthの許可ユーザーフローを設計する | 解決済み | system-design |
| P-03 | 新形式Publishable Key使用時のSupabaseクライアント構成を設計へ反映する | 解決済み | system-design |
| P-04 | 初期管理者のGoogleメールをSupabaseへ安全に登録する | 未解決 | implementation |
| P-05 | マイグレーション0001〜0006をSupabaseへ適用し、RLS実動作を確認する | 未解決 | implementation |

## 次に行うこと

`nextjs-supabase-implementation` skillを使い、設計書の実装順序に沿って着手する。

1. Supabaseマイグレーション0001〜0006を対象プロジェクトへ適用
2. 初期管理者メールをSQL Editorから登録
3. Google ProviderとRedirect URLsを設定
4. 管理者・一般・未許可ユーザーでRLSとログインを確認
5. 管理画面と実データダッシュボードを実装

## 実装フェーズ完了基準

- Must要件が全て実装され、TODOが明記されている。
- DBマイグレーション、RLS、認証、主要画面が動作する。
- `pnpm lint`、`pnpm build`、DB・アプリテストが成功する。
- 秘密レシピが一般ユーザーへ返らないことをテストで証明する。

## 【次のAIへの引き継ぎ事項】

`docs/requirements.md`と`docs/design.md`文書版1.0を正とする。DB・RLSから実装し、秘密レシピ保護と原価スナップショットを最優先で自動テストする。
