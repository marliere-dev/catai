-- Provision a separate database for the e2e test suite so it never collides
-- with local development data.
CREATE DATABASE catai_test;
GRANT ALL PRIVILEGES ON DATABASE catai_test TO catai;
