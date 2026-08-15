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
| Supabase接続 | 完了 | SSRクライアントからカテゴリ・商品・購入先を取得 |
| Google認証 | 完了 | Googleログイン後に`/`へ遷移し、認証済み画面を確認 |
| DB・RLS | 進行中 | マイグレーション0001〜0006適用済み、管理者SELECT確認済み |
| 機能実装 | 進行中 | 各マスタ・レシピ・商品閲覧・月次販売個数・原価再計算・実データダッシュボード・ユーザー管理を実装 |
| テスト | 進行中 | `docs/test-report.md`、lint・build・管理者マスタ画面確認成功 |

## 作業履歴

| 日付 | 通知元 | フェーズ | 実施内容 |
| --- | --- | --- | --- |
| 2026-08-15 | requirements-definition | requirements | 対象、計算式、MoSCoW、権限、非機能要件、受入条件を確定 |
| 2026-08-15 | development-progress | requirements | 完了条件を確認し、設計フェーズへの移行を承認 |
| 2026-08-15 | system-design | design | システム構成、DB、RLS、Google OAuth、原価計算、画面、実装順序を確定 |
| 2026-08-15 | development-progress | design | 設計完了条件を確認し、実装フェーズへの移行を承認 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | DBマイグレーション、原価計算関数、RLS、SSR Google認証基盤を実装。lint・build成功 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | 商品マスタ・購入先マスタのServer Component、Zod検証付きServer Action、登録・更新フォームを実装 |
| 2026-08-15 | quality-testing | test | lint・build、管理者画面、Supabaseカテゴリ取得、空状態、ブラウザエラー0件を確認 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | 材料マスタと購入先別仕入価格履歴を実装。税込価格、発注ロット、内容量、適用日、単位整合性を管理 |
| 2026-08-15 | quality-testing | test | lint・build、7単位取得、材料・仕入価格の空状態、前提データ不足時の登録無効化、ブラウザエラー0件を確認 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | 管理者レシピ編集、許可ユーザー向け商品一覧・詳細、安全なRPC経由のレシピ取得を実装 |
| 2026-08-15 | quality-testing | test | lint・build、商品画面、直接SELECTが管理者限定で公開画面はRPCのみ使用することを確認。実データ権限試験は保留 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | 月次販売個数の一括upsert、対象月切替、DB原価再計算、確定済み上書き保護UIを実装 |
| 2026-08-15 | quality-testing | test | lint・build、販売画面、月切替、商品0件の無効状態、DB関数呼出しを確認。数値実動作試験は保留 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | ダッシュボードを`get_monthly_dashboard`へ接続し、月次集計、前月比、6か月推移、カテゴリ別売上、商品別原価、権限別ナビを実装 |
| 2026-08-15 | quality-testing | test | lint・build、2026年8月・7月の月切替、データ0件時の案内、管理者導線、ブラウザエラー0件を確認 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | 許可Googleアカウントの登録、権限変更、無効化、連携済みメール変更防止、最後の管理者保護を備えたユーザー管理を実装 |
| 2026-08-15 | quality-testing | test | lint・build、初期管理者表示、連携済みメールの読み取り専用、権限・有効状態編集UI、ダッシュボード導線、ブラウザエラー0件を確認 |
| 2026-08-15 | quality-testing | test | `【検証】`付きの材料5件、購入先1件、仕入価格5件、商品3件、レシピ5明細、2026年8月販売数を登録。全マスタが編集可能で、レシピ明細は削除可能 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | 原価再計算で発見したPL/pgSQL出力変数と列名の衝突を修正するマイグレーション0007を追加 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | 購入先の担当者・連絡先・住所・発注方法・支払条件・納期を追加し、取扱材料の複数紐付けと仕入価格登録時の自動紐付けを実装 |
| 2026-08-15 | quality-testing | test | 購入先拡張後のlint・TypeScript・production build成功。画面実動作は0008適用待ち |
| 2026-08-15 | quality-testing | test | 0008適用後、購入先詳細フォーム、既存価格からの取扱材料5件補完、編集状態、ブラウザエラー0件を確認 |
| 2026-08-15 | quality-testing | test | 0007適用後の原価再計算に成功。カレー74円、タコス133.333333円、コーヒー30円、月間売上192,000円・原価23,753.3333円を照合 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | 管理者・一般ユーザーのアカウント切替試験に必要なログアウト導線をPC・モバイルのダッシュボードへ追加 |
| 2026-08-15 | quality-testing | test | ログアウト導線追加後のlint・build、ボタン表示、Server Action接続、ブラウザエラー0件を確認。実ログアウトは一般ユーザー試験時に実施 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | Google側の既存セッションで管理者が自動選択される問題に対応し、OAuth開始時にアカウント選択画面を必ず表示する設定を追加。lint・production build成功 |
| 2026-08-15 | quality-testing | test | 一般ユーザーのGoogleログイン、管理メニュー非表示、秘密レシピ非表示、管理画面URLからダッシュボードへのリダイレクトを実機確認。未登録アカウント試験はアカウント不足で保留 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | 商品の目標原価率を月次実績と比較し、超過件数アラート、商品行強調、目標値表示をダッシュボードへ追加。lint・production build成功 |
| 2026-08-15 | nextjs-supabase-implementation | implementation | 管理者専用の操作履歴画面を追加。日時・操作者・対象・操作・レコードIDを新しい順に200件表示し、対象・操作で絞り込み可能。ダッシュボード導線、RLS前提、lint・production build成功 |

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
| P-04 | 初期管理者のGoogleメールをSupabaseへ安全に登録する | 解決済み | implementation |
| P-05 | マイグレーション0001〜0006をSupabaseへ適用し、RLS実動作を確認する | 進行中（管理者確認済み） | implementation |

## 次に行うこと

`nextjs-supabase-implementation` skillを使い、設計書の実装順序に沿って着手する。

1. 管理者ログイン時に操作履歴画面の実データ表示と絞り込みをブラウザで確認
2. 目標原価率を検証商品へ設定し、超過・未超過表示をブラウザで確認
3. 未許可Googleアカウントを用意できた時点でログイン拒否を確認

## 実装フェーズ完了基準

- Must要件が全て実装され、TODOが明記されている。
- DBマイグレーション、RLS、認証、主要画面が動作する。
- `pnpm lint`、`pnpm build`、DB・アプリテストが成功する。
- 秘密レシピが一般ユーザーへ返らないことをテストで証明する。

## 【次のAIへの引き継ぎ事項】

`docs/requirements.md`と`docs/design.md`文書版1.0を正とする。0007・0008適用済み。一般ユーザーのログイン・秘密レシピ非表示・管理画面拒否まで確認済み。未登録アカウント試験のみアカウント不足で保留。目標原価率の超過表示と管理者向け操作履歴画面を実装済みで、次は管理者ブラウザで両画面を実動作確認する。Public Gitには実ユーザー一覧や実レシピを含めない。
