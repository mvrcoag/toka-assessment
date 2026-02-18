insert into users (id, name, email, password_hash, role)
values (
  gen_random_uuid()::text,
  'Toka User',
  'user@toka.local',
  crypt('toka-password', gen_salt('bf')),
  'user'
)
on conflict (email) do nothing;
