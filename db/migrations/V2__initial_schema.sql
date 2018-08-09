create table player (
  ID serial PRIMARY KEY,
  NAME text,
  ATTRIBUTES jsonb
);

grant select, insert, update, delete on table player to ${connect_user};
