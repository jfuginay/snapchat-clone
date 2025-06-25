-- Sample Activities Setup for TribeFind
-- Run this script to populate your activities table with sample data

-- First, clear existing sample data (if any)
DELETE FROM user_activities WHERE activity_id IN (
  SELECT id FROM activities WHERE created_at > NOW() - INTERVAL '1 hour'
);

-- Insert sample activities
INSERT INTO activities (name, description, category, icon, color, popularity_score, is_active) 
VALUES 
  -- Sports & Fitness
  ('Running', 'Distance running and jogging', 'Sports', '🏃‍♂️', '#45B7D1', 95, true),
  ('Basketball', 'Team basketball sport', 'Sports', '🏀', '#FECA57', 85, true),
  ('Yoga', 'Various styles of yoga practice', 'Sports', '🧘‍♀️', '#4ECDC4', 90, true),
  ('Rock Climbing', 'Indoor and outdoor rock climbing', 'Sports', '🧗‍♂️', '#FF6B6B', 70, true),
  ('Swimming', 'Pool and open water swimming', 'Sports', '🏊‍♂️', '#3498DB', 80, true),
  ('Tennis', 'Singles and doubles tennis', 'Sports', '🎾', '#2ECC71', 75, true),
  ('Soccer', 'Football/soccer team sport', 'Sports', '⚽', '#27AE60', 85, true),
  ('Cycling', 'Road and mountain biking', 'Sports', '🚴‍♂️', '#F39C12', 80, true),

  -- Creative Arts
  ('Photography', 'Digital and film photography', 'Creative', '📸', '#6C5CE7', 95, true),
  ('Painting', 'Watercolor, oil, and acrylic painting', 'Creative', '🎨', '#A29BFE', 65, true),
  ('Music Production', 'Creating and producing music', 'Creative', '🎵', '#FF7675', 85, true),
  ('Dancing', 'Various dance styles', 'Creative', '💃', '#FD79A8', 75, true),
  ('Writing', 'Creative writing and blogging', 'Creative', '✍️', '#FDCB6E', 70, true),
  ('Drawing', 'Sketching and digital illustration', 'Creative', '✏️', '#6C5CE7', 70, true),
  ('Sculpture', 'Clay, stone, and mixed media sculpture', 'Creative', '🗿', '#A0522D', 45, true),

  -- Technology
  ('Web Development', 'Frontend and backend development', 'Technology', '💻', '#00B894', 85, true),
  ('Mobile Development', 'iOS and Android app development', 'Technology', '📱', '#0984E3', 80, true),
  ('Data Science', 'Data analysis and machine learning', 'Technology', '📊', '#6C5CE7', 75, true),
  ('UI/UX Design', 'User interface and experience design', 'Technology', '🎨', '#A29BFE', 80, true),
  ('Game Development', 'Video game programming and design', 'Technology', '🎮', '#55A3FF', 65, true),
  ('DevOps', 'System administration and automation', 'Technology', '⚙️', '#636E72', 60, true),
  ('Cybersecurity', 'Information security and ethical hacking', 'Technology', '🔒', '#E74C3C', 70, true),

  -- Outdoor & Adventure
  ('Hiking', 'Trail hiking and backpacking', 'Outdoor', '🥾', '#26DE81', 90, true),
  ('Camping', 'Outdoor camping and survival', 'Outdoor', '⛺', '#2ECC71', 75, true),
  ('Mountain Biking', 'Off-road cycling adventures', 'Outdoor', '🚵‍♂️', '#F39C12', 60, true),
  ('Surfing', 'Ocean wave surfing', 'Outdoor', '🏄‍♂️', '#3498DB', 55, true),
  ('Kayaking', 'River and lake kayaking', 'Outdoor', '🛶', '#16A085', 60, true),
  ('Fishing', 'Sport fishing and angling', 'Outdoor', '🎣', '#3498DB', 65, true),
  ('Skiing', 'Alpine and Nordic skiing', 'Outdoor', '⛷️', '#E8F8F5', 50, true),
  ('Skateboarding', 'Street and park skateboarding', 'Outdoor', '🛹', '#E74C3C', 55, true),

  -- Lifestyle & Food
  ('Cooking', 'Culinary arts and recipe creation', 'Lifestyle', '👨‍🍳', '#E17055', 85, true),
  ('Baking', 'Bread, pastries, and dessert making', 'Lifestyle', '🧁', '#FDCB6E', 70, true),
  ('Wine Tasting', 'Wine appreciation and tasting', 'Lifestyle', '🍷', '#8E44AD', 55, true),
  ('Coffee', 'Coffee brewing and appreciation', 'Lifestyle', '☕', '#8B4513', 75, true),
  ('Gardening', 'Plant cultivation and landscaping', 'Lifestyle', '🌱', '#27AE60', 65, true),
  ('Fashion', 'Style, design, and personal expression', 'Lifestyle', '👗', '#E91E63', 60, true),

  -- Education & Learning
  ('Reading', 'Books, literature, and learning', 'Education', '📚', '#3498DB', 80, true),
  ('Language Learning', 'Foreign language acquisition', 'Education', '🗣️', '#E74C3C', 75, true),
  ('Board Games', 'Strategy and social board games', 'Education', '🎲', '#9B59B6', 65, true),
  ('Chess', 'Strategic chess playing', 'Education', '♟️', '#2C3E50', 60, true),
  ('Podcasting', 'Audio content creation', 'Education', '🎙️', '#E67E22', 55, true),
  ('Public Speaking', 'Presentation and communication skills', 'Education', '🎤', '#3498DB', 50, true),

  -- Music & Entertainment
  ('Guitar', 'Acoustic and electric guitar playing', 'Music', '🎸', '#E74C3C', 80, true),
  ('Piano', 'Classical and modern piano', 'Music', '🎹', '#2C3E50', 75, true),
  ('Singing', 'Vocal performance and training', 'Music', '🎤', '#E91E63', 70, true),
  ('DJing', 'Electronic music mixing and performance', 'Music', '🎧', '#9B59B6', 65, true),
  ('Karaoke', 'Social singing and entertainment', 'Music', '🎵', '#F39C12', 60, true),

  -- Social & Community
  ('Volunteering', 'Community service and giving back', 'Social', '🤝', '#27AE60', 85, true),
  ('Networking', 'Professional and social networking', 'Social', '👥', '#3498DB', 70, true),
  ('Trivia', 'Quiz games and knowledge competitions', 'Social', '🧠', '#E67E22', 65, true),
  ('Book Clubs', 'Group reading and discussion', 'Social', '📖', '#8E44AD', 55, true),
  ('Meetups', 'Social gatherings and events', 'Social', '🍕', '#E74C3C', 75, true)

ON CONFLICT (name) DO NOTHING;

-- Verify the data was inserted
SELECT 
  category,
  COUNT(*) as activity_count
FROM activities 
WHERE is_active = true
GROUP BY category
ORDER BY activity_count DESC;

-- Show sample activities
SELECT 
  name,
  category,
  icon,
  popularity_score
FROM activities 
WHERE is_active = true
ORDER BY popularity_score DESC
LIMIT 20; 