CREATE TABLE public.jobs (
    id             SERIAL NOT NULL,
    user_id        INTEGER NOT NULL,
    company        VARCHAR(255) NOT NULL,
    role           VARCHAR(255) NOT NULL,
    description    TEXT,
    salary         VARCHAR(255),
    link           TEXT,
    status         VARCHAR(50) NOT NULL,
    date_submitted DATE,
    created_at     TIMESTAMPTZ,
    updated_at     TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT jobs_pkey PRIMARY KEY (id),
    CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;
