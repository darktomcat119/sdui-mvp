-- Create the application user (separate from owner for RLS enforcement)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sdui_app') THEN
        CREATE ROLE sdui_app WITH LOGIN PASSWORD 'sdui_app_password';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE sdui TO sdui_app;
GRANT USAGE ON SCHEMA public TO sdui_app;

-- Default privileges so sdui_app can access tables created by sdui_owner
ALTER DEFAULT PRIVILEGES FOR ROLE sdui_owner IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sdui_app;

ALTER DEFAULT PRIVILEGES FOR ROLE sdui_owner IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO sdui_app;
