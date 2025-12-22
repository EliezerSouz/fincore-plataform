-- List all triggers on the auth.users table to identify the culprit
SELECT 
    trigger_schema, 
    trigger_name, 
    event_manipulation, 
    action_statement, 
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- Check for any other triggers in public that might be related
SELECT 
    trigger_schema, 
    trigger_name, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
