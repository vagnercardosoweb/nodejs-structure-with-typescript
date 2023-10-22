CREATE TABLE IF NOT EXISTS users (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name VARCHAR(70) NOT NULL,
  email VARCHAR(254) NOT NULL,
  birth_date DATE NOT NULL,
  code_to_invite VARCHAR(30) NOT NULL,
  password_hash VARCHAR(73) NOT NULL,
  confirmed_email_at TIMESTAMPTZ NULL DEFAULT NULL,
  login_blocked_until TIMESTAMPTZ NULL DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL DEFAULT NULL
);

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_id_pk,
  ADD CONSTRAINT users_id_pk PRIMARY KEY (id);

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_email_ukey,
  ADD CONSTRAINT users_email_ukey UNIQUE (email);

CREATE INDEX IF NOT EXISTS users_id_idx ON users USING btree (id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users USING btree (email);
CREATE INDEX IF NOT EXISTS users_birth_date_idx ON users USING btree (birth_date);
CREATE INDEX IF NOT EXISTS users_code_to_invite_idx ON users USING btree (code_to_invite);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users USING btree (created_at);
