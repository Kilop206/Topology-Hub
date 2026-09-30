CREATE TABLE hub_user (
 id UUID PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE, display_name VARCHAR(80) NOT NULL,
 password_hash VARCHAR(100), role VARCHAR(10) NOT NULL, active BOOLEAN NOT NULL,
 provider VARCHAR(20), provider_subject VARCHAR(255), created_at TIMESTAMP WITH TIME ZONE NOT NULL,
 CONSTRAINT user_provider_unique UNIQUE(provider, provider_subject),
 CONSTRAINT user_role_valid CHECK (role IN ('USER','ADMIN'))
);
CREATE TABLE hub_session (
 token_hash VARCHAR(64) PRIMARY KEY, user_id UUID NOT NULL REFERENCES hub_user(id) ON DELETE CASCADE,
 expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX session_expiry_idx ON hub_session(expires_at);
CREATE TABLE oauth_state (
 state_hash VARCHAR(64) PRIMARY KEY, browser_hash VARCHAR(64) NOT NULL,
 provider VARCHAR(20) NOT NULL, verifier VARCHAR(100) NOT NULL, expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE TABLE topology (
 id UUID PRIMARY KEY, owner_id UUID NOT NULL REFERENCES hub_user(id),
 title VARCHAR(120) NOT NULL, description VARCHAR(4000) NOT NULL, visibility VARCHAR(10) NOT NULL,
 graph TEXT NOT NULL, node_count INTEGER NOT NULL, link_count INTEGER NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL, updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
 version BIGINT NOT NULL, CONSTRAINT topology_visibility_valid CHECK(visibility IN ('PUBLIC','PRIVATE'))
);
CREATE INDEX topology_owner_idx ON topology(owner_id,updated_at);
CREATE INDEX topology_public_idx ON topology(visibility,updated_at);
CREATE TABLE audit_event (
 id UUID PRIMARY KEY, actor_id UUID NOT NULL REFERENCES hub_user(id),
 action VARCHAR(80) NOT NULL, target_id UUID NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

