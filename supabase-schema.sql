-- 家庭记账本 Supabase 数据库 Schema
-- 在 Supabase SQL Editor 中运行本文件即可完成初始化

-- 1. 用户扩展信息表
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nickname   TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 新用户自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nickname', NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. 家庭组
CREATE TABLE families (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 家庭成员
CREATE TABLE family_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT DEFAULT 'member', -- 'admin' | 'member'
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- 4. 账单类别
CREATE TABLE categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      TEXT NOT NULL,
  icon      TEXT,
  type      TEXT NOT NULL, -- 'income' | 'expense'
  is_system BOOLEAN DEFAULT false
);

-- 预设类别
INSERT INTO categories (name, icon, type, is_system) VALUES
  ('餐饮', '🍽️', 'expense', true),
  ('交通', '🚗', 'expense', true),
  ('购物', '🛍️', 'expense', true),
  ('居住', '🏠', 'expense', true),
  ('娱乐', '🎮', 'expense', true),
  ('医疗', '💊', 'expense', true),
  ('教育', '📚', 'expense', true),
  ('通讯', '📱', 'expense', true),
  ('服饰', '👔', 'expense', true),
  ('日用', '🧴', 'expense', true),
  ('其他支出', '💸', 'expense', true),
  ('工资', '💰', 'income', true),
  ('奖金', '🎁', 'income', true),
  ('投资', '📈', 'income', true),
  ('兼职', '💼', 'income', true),
  ('退款', '↩️', 'income', true),
  ('其他收入', '💵', 'income', true);

-- 5. 账单
CREATE TABLE bills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id),
  category_id UUID REFERENCES categories(id),
  type        TEXT NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  date        DATE NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bills_family_date ON bills(family_id, date DESC);
CREATE INDEX idx_bills_family_user ON bills(family_id, user_id);

-- ============ RLS 权限策略 ============

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- profiles: 所有人可读
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
-- profiles: 只能修改自己的
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- families: 家庭成员可读
CREATE POLICY "families_read" ON families FOR SELECT
  USING (id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));
-- families: 任何人都可以创建（首次创建家庭组）
CREATE POLICY "families_insert" ON families FOR INSERT WITH CHECK (true);

-- family_members: 同组成员可读
CREATE POLICY "family_members_read" ON family_members FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));
-- family_members: 任何人都可以插入（加入家庭组）
CREATE POLICY "family_members_insert" ON family_members FOR INSERT WITH CHECK (true);
-- family_members: 管理员可以删除
CREATE POLICY "family_members_delete" ON family_members FOR DELETE
  USING (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- categories: 所有人可读（预设+自定义）
CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);

-- bills: 家庭成员可读
CREATE POLICY "bills_read" ON bills FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));
-- bills: 成员可新增
CREATE POLICY "bills_insert" ON bills FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );
-- bills: 仅创建者可修改
CREATE POLICY "bills_update" ON bills FOR UPDATE USING (user_id = auth.uid());
-- bills: 仅创建者可删除
CREATE POLICY "bills_delete" ON bills FOR DELETE USING (user_id = auth.uid());
