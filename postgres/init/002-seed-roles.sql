insert into roles (id, name, can_view, can_create, can_update, can_delete)
values
  (gen_random_uuid(), 'admin', true, true, true, true),
  (gen_random_uuid(), 'user', true, false, false, false)
on conflict (name) do nothing;
