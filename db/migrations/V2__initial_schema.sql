create table local_user (
  id serial primary key,
  sc_id numeric,
  username text,
  created_dt timestamp with time zone default now()
);

create table local_user_role (
  id serial primary key,
  role_name,
  created_dt timestamp with time zone default now()
);

create table local_user_role_rel (
  id serial primary key,
  user_id integer references local_user(id),
  role_id integer references local_user_role(id),
  created_dt timestamp with time zone default now()
);

create table league (
  id serial primary key,
  sc_id numeric,
  created_dt timestamp with time zone default now()
);

create table user_league_rel (
  id serial primary key,
  user_id integer references local_user(id),
  league_id integer references league(id)
);

create table player (
  ID serial PRIMARY KEY,
  sc_id numeric,
  NAME text,
  ATTRIBUTES jsonb
);

create table team (
  ID serial PRIMARY KEY,
  sc_id numeric,
  NAME text,
  ATTRIBUTES jsonb
);

create table player_team_rel (
  ID serial primary key,
  player_id integer references player(id),
  team_id integer references team(id),
  created_dt timestamp with time zone default now(),
  end_dt timestamp with time zone
);

grant select, insert, update, delete on table player to ${connect_user};
grant select, insert, update, delete on table team to ${connect_user};
grant select, insert, update, delete on table player_team_rel to ${connect_user};
grant select, insert, update, delete on table local_user to ${connect_user};
grant select, insert, update, delete on table league to ${connect_user};
grant select, insert, update, delete on table user_league_rel to ${connect_user};

grant usage, select on all sequences in schema ${main_schema} to ${connect_user}
