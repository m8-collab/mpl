-- =====================================================================
-- FIX: every club showing as "not competing" / empty league table
-- Run ONCE in the Supabase SQL editor.
-- Only Kanamai FC is discontinued; all other clubs are competing.
-- =====================================================================
alter table clubs add column if not exists active boolean not null default true;

update clubs set active = true  where id <> 'kanamai';
update clubs set active = false where id =  'kanamai';

-- Check: should list only kanamai as false
select id, name, active from clubs order by active, name;
