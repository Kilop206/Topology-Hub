ALTER TABLE hub_user
  ADD COLUMN plan VARCHAR(16) NOT NULL DEFAULT 'FREE';

ALTER TABLE hub_user
  ADD CONSTRAINT hub_user_plan_check
  CHECK (plan IN ('FREE', 'PRO', 'INTERNAL'));
