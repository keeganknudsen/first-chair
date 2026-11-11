CREATE TABLE users (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         text NOT NULL,
    display_name  text NOT NULL,
    password_hash text NOT NULL,
    role          text NOT NULL DEFAULT 'author'
                  CHECK (role IN ('author', 'admin')),
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));