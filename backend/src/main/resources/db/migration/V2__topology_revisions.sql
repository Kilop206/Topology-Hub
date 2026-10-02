CREATE TABLE topology_revision (
 id UUID PRIMARY KEY,
 topology_id UUID NOT NULL REFERENCES topology(id) ON DELETE CASCADE,
 revision BIGINT NOT NULL,
 title VARCHAR(120) NOT NULL,
 description VARCHAR(4000) NOT NULL,
 visibility VARCHAR(10) NOT NULL,
 graph TEXT NOT NULL,
 actor_id UUID NOT NULL REFERENCES hub_user(id),
 created_at TIMESTAMP WITH TIME ZONE NOT NULL,
 CONSTRAINT topology_revision_unique UNIQUE(topology_id, revision),
 CONSTRAINT topology_revision_visibility_valid CHECK(visibility IN ('PUBLIC','PRIVATE'))
);
CREATE INDEX topology_revision_lookup_idx ON topology_revision(topology_id, revision DESC);
