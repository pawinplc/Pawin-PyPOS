-- PyPOS migration 003: master admin role
-- Promotes the existing default admin account to the new master_admin role.
-- Master Admin is the only role allowed to manage Users and view the Audit Log.

UPDATE users
SET role = 'master_admin'
WHERE username = 'admin'
  AND role = 'admin';
