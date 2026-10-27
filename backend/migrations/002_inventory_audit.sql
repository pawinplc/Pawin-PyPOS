-- PyPOS migration 002: inventory CRUD audit log
-- Stores item/category/service create, update and delete actions together with
-- the actor's role at the time of the operation.

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NULL,
  username VARCHAR(50) NULL,
  role VARCHAR(20) NULL,
  action VARCHAR(30) NOT NULL,
  entity_type VARCHAR(30) NOT NULL,
  entity_id INT NULL,
  description VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_audit_logs_user_id (user_id),
  KEY ix_audit_logs_entity_type (entity_type),
  KEY ix_audit_logs_created_at (created_at),
  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
