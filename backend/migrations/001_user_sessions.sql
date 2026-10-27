-- PyPOS migration 001: saved login devices and sessions
-- Run once on an existing database before deploying the matching auth code.
-- New installations can let SQLAlchemy create the table automatically.

CREATE TABLE IF NOT EXISTS user_sessions (
  id INT NOT NULL AUTO_INCREMENT,
  session_id VARCHAR(64) NOT NULL,
  user_id INT NOT NULL,
  device VARCHAR(120) NULL,
  browser VARCHAR(60) NULL,
  os VARCHAR(60) NULL,
  device_type VARCHAR(20) NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  login_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  logout_at DATETIME NULL,
  expires_at DATETIME NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_sessions_session_id (session_id),
  KEY ix_user_sessions_user_id (user_id),
  CONSTRAINT fk_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
