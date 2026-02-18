insert into users (id, name, email, password_hash, role_id)
values (
  gen_random_uuid()::text,
  'Toka User',
  'user@toka.local',
  crypt('toka-password', gen_salt('bf')),
  (select id from roles where name = 'admin' limit 1)
)
on conflict (email) do nothing;
