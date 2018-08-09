-- Set ${main_schema} as the default schema. (No need to explicitly reference it.)
-- Schemas listed in the flyway schemas property will be created automatically.
ALTER ROLE ${admin_user} SET search_path TO ${main_schema},public;

-- Create other users. Grant access to schemas.
CREATE ROLE ${connect_user} WITH PASSWORD '${connect_user_pass}' LOGIN;
ALTER ROLE ${connect_user} SET search_path TO ${main_schema},public;
GRANT USAGE ON SCHEMA ${main_schema} to ${connect_user};
