-- PyPOS migration 004: dedicated master admin email
-- Frees pawinplc2022@gmail.com so the master admin can use it when creating a
-- normal admin account.

UPDATE users
SET email = 'master@pawinplc.com'
WHERE username = 'admin'
  AND role = 'master_admin';
