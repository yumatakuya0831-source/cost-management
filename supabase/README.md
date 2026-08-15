# Supabaseセットアップ

マイグレーションは番号順に適用します。実際のユーザー、仕入価格、レシピはPublic GitHubへ追加しません。

既に0001〜0006を適用済みの環境では、原価再計算関数の列名衝突を修正するため`0007_fix_recalculation_variable_conflict.sql`も実行してください。

## 適用順序

1. `0001_extensions_enums.sql`
2. `0002_core_tables.sql`
3. `0003_cost_tables.sql`
4. `0004_functions.sql`
5. `0005_rls.sql`
6. `0006_seed_master.sql`

Supabase CLI導入後は`supabase db push`を使用できます。導入前はDashboardのSQL Editorで順番に適用してください。

## 初期管理者

マイグレーション適用後、SQL Editorで管理者のGoogleメールを登録します。実メールをSQLファイルへ保存しないでください。

```sql
insert into public.app_users (email, display_name, role)
values ('your-google-account@example.com', '管理者', 'admin');
```

Google初回ログイン時に`claim_app_user()`が検証済みメールと`auth.users.id`を紐付けます。
