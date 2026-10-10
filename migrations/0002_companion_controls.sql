-- No prompts, responses, histories or raw private conversations are stored.
CREATE TABLE guardian_companion_consent (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL, policy_version TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE guardian_companion_usage (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL, requests INTEGER NOT NULL,
  PRIMARY KEY(user_id, bucket)
);
CREATE TABLE guardian_companion_request (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, request_id)
);
