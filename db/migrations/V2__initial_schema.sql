create table local_user (
  id serial primary key,
  sc_id numeric,
  username text,
  created_dt timestamp with time zone default now()
);

create table season (
  id serial primary key,
  year character varying(4),
  created_dt timestamp with time zone default now()
);

create table local_user_role (
  id serial primary key,
  role_name text,
  created_dt timestamp with time zone default now()
);

create table local_user_role_rel (
  id serial primary key,
  user_id integer references local_user(id),
  role_id integer references local_user_role(id),
  created_dt timestamp with time zone default now()
);
create unique index user_role_rel_idx on local_user_role_rel(user_id, role_id);

create table league (
  id serial primary key,
  sc_id numeric,
  season_id integer references season(id),
  created_dt timestamp with time zone default now()
);
create unique index league_sc_id_idx on league(sc_id);

create table user_league_rel (
  id serial primary key,
  user_id integer references local_user(id),
  league_id integer references league(id)
);

create table player (
  ID serial PRIMARY KEY,
  sc_id numeric,
  NAME text,
  ATTRIBUTES jsonb,
  season_id integer references season(id)
);

create table team (
  ID serial PRIMARY KEY,
  sc_id numeric,
  NAME text,
  ATTRIBUTES jsonb,
  season_id integer references season(id)
);

create table player_team_rel (
  ID serial primary key,
  player_id integer references player(id),
  team_id integer references team(id),
  created_dt timestamp with time zone default now(),
  end_dt timestamp with time zone
);

create table local_user_team_rel (
  id serial primary key,
  user_id integer references local_user(id),
  team_id integer references team(id),
  created_dt timestamp with time zone default now()
);

create table league_team_rel(
  id serial primary key,
  league_id integer references local_user(id),
  team_id integer references team(id),
  created_dt timestamp with time zone default now()
);

grant select, insert, update, delete on table player to ${connect_user};
grant select, insert, update, delete on table team to ${connect_user};
grant select, insert, update, delete on table player_team_rel to ${connect_user};
grant select, insert, update, delete on table local_user to ${connect_user};
grant select, insert, update, delete on table league to ${connect_user};
grant select, insert, update, delete on table user_league_rel to ${connect_user};
grant select, insert, update, delete on table local_user_role to ${connect_user};
grant select, insert, update, delete on table local_user_role_rel to ${connect_user};
grant select, insert, update, delete on table local_user_team_rel to ${connect_user};
grant select, insert, update, delete on table league_team_rel to ${connect_user};
grant select, insert, update, delete on table season to ${connect_user};

grant usage, select on all sequences in schema ${main_schema} to ${connect_user};

insert into local_user_role(role_name) values('app_admin');
insert into local_user(username) values('${init_app_admin}');
insert into local_user_role_rel(user_id, role_id)
select u.id, r.id
from local_user u,
local_user_role r
where u.username = '${init_app_admin}'
and r.role_name = 'app_admin';
