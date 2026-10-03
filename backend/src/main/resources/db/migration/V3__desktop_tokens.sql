CREATE TABLE desktop_token (
 id UUID PRIMARY KEY,
 token_hash VARCHAR(64) NOT NULL UNIQUE,
 user_id UUID NOT NULL REFERENCES hub_user(id) ON DELETE CASCADE,
 name VARCHAR(80) NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL,
 revoked_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX desktop_token_user_idx ON desktop_token(user_id, created_at DESC);
