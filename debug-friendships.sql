-- 🤝 Debug Friendship System SQL Queries
-- Use these queries in your Supabase SQL Editor to debug friendship issues

-- 1. View all friendships with user details
SELECT 
  f.id,
  f.status,
  r.username as requester_username,
  r.display_name as requester_name,
  a.username as addressee_username, 
  a.display_name as addressee_name,
  f.created_at,
  f.updated_at
FROM friendships f
JOIN users r ON f.requester_id = r.id
JOIN users a ON f.addressee_id = a.id
ORDER BY f.updated_at DESC;

-- 2. View friendships for a specific user (replace 'USERNAME' with actual username)
SELECT 
  f.id,
  f.status,
  CASE 
    WHEN f.requester_id = u.id THEN 'sent'
    ELSE 'received'
  END as direction,
  other_user.username as other_username,
  other_user.display_name as other_name,
  f.created_at,
  f.updated_at
FROM friendships f
JOIN users u ON (u.username = 'USERNAME') -- Replace USERNAME here
JOIN users other_user ON (
  CASE 
    WHEN f.requester_id = u.id THEN f.addressee_id = other_user.id
    ELSE f.requester_id = other_user.id
  END
)
WHERE (f.requester_id = u.id OR f.addressee_id = u.id)
ORDER BY f.updated_at DESC;

-- 3. Find any duplicate or conflicting friendships
SELECT 
  r.username as user1,
  a.username as user2,
  COUNT(*) as friendship_count,
  ARRAY_AGG(f.status) as statuses,
  ARRAY_AGG(f.id) as friendship_ids
FROM friendships f
JOIN users r ON f.requester_id = r.id
JOIN users a ON f.addressee_id = a.id
GROUP BY r.username, a.username, 
  LEAST(f.requester_id::text, f.addressee_id::text),
  GREATEST(f.requester_id::text, f.addressee_id::text)
HAVING COUNT(*) > 1;

-- 4. Check recent friendship updates (last 24 hours)
SELECT 
  f.id,
  f.status,
  r.username as requester,
  a.username as addressee,
  f.created_at,
  f.updated_at,
  EXTRACT(EPOCH FROM (NOW() - f.updated_at))/60 as minutes_ago
FROM friendships f
JOIN users r ON f.requester_id = r.id
JOIN users a ON f.addressee_id = a.id
WHERE f.updated_at > NOW() - INTERVAL '24 hours'
ORDER BY f.updated_at DESC;

-- 5. Find pending requests that should be accepted
SELECT 
  f.id,
  f.status,
  r.username as requester,
  a.username as addressee,
  f.created_at,
  f.updated_at
FROM friendships f
JOIN users r ON f.requester_id = r.id
JOIN users a ON f.addressee_id = a.id
WHERE f.status = 'pending'
ORDER BY f.created_at DESC;

-- 6. Quick fix: Update a specific friendship to accepted (use carefully!)
-- UPDATE friendships 
-- SET status = 'accepted', updated_at = NOW()
-- WHERE id = 'FRIENDSHIP_ID_HERE';

-- 7. Test query to verify bidirectional friendship lookup (replace USER_IDs)
SELECT 
  f.*,
  'found via bidirectional query' as note
FROM friendships f
WHERE (
  (f.requester_id = 'USER_A_ID' AND f.addressee_id = 'USER_B_ID')
  OR 
  (f.requester_id = 'USER_B_ID' AND f.addressee_id = 'USER_A_ID')
);

-- 8. Clean up any orphaned friendships (run with caution)
-- DELETE FROM friendships 
-- WHERE requester_id NOT IN (SELECT id FROM users)
--    OR addressee_id NOT IN (SELECT id FROM users);

-- 9. Manually accept a specific friend request (for testing)
-- Replace 'FRIENDSHIP_ID' with actual friendship ID
-- UPDATE friendships 
-- SET status = 'accepted', updated_at = NOW()
-- WHERE id = 'FRIENDSHIP_ID' AND status = 'pending';

-- 10. Check RLS policies (for debugging permission issues)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'friendships'; 