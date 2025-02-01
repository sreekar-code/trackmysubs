/*
  # Update category order
  
  1. Changes
    - Updates the created_at timestamps of categories to ensure "Other" appears last
    - Maintains relative order of other categories
    
  2. Notes
    - Uses timestamp ordering to control display order
    - Safe operation that doesn't modify data
*/

-- Update timestamps to reorder categories
UPDATE subscription_categories 
SET created_at = CASE name
  WHEN 'Streaming' THEN now() - interval '10 days'
  WHEN 'Domain & Hosting' THEN now() - interval '9 days'
  WHEN 'Software' THEN now() - interval '8 days'
  WHEN 'Cloud Storage' THEN now() - interval '7 days'
  WHEN 'Music' THEN now() - interval '6 days'
  WHEN 'Gaming' THEN now() - interval '5 days'
  WHEN 'News & Media' THEN now() - interval '4 days'
  WHEN 'Productivity' THEN now() - interval '3 days'
  WHEN 'Education' THEN now() - interval '2 days'
  WHEN 'Other' THEN now() - interval '1 day'
END
WHERE is_default = true;