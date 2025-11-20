-- Migration: Add event_type_id to animal_events and migrate data
-- Step 1: Add the new column as nullable
ALTER TABLE animal_events ADD COLUMN IF NOT EXISTS event_type_id INTEGER;

-- Step 2: Add foreign key constraint
ALTER TABLE animal_events
ADD CONSTRAINT fk_event_type
FOREIGN KEY (event_type_id)
REFERENCES catalogs(id)
ON DELETE RESTRICT;

-- Step 3: Create mapping function to get catalog ID by event type key
CREATE OR REPLACE FUNCTION get_event_type_id(event_key TEXT)
RETURNS INTEGER AS $$
DECLARE
  catalog_id INTEGER;
BEGIN
  SELECT id INTO catalog_id
  FROM catalogs
  WHERE category = 'event_types'
  AND description::jsonb->>'key' = event_key
  LIMIT 1;

  RETURN catalog_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Migrate existing data
-- Map 'entrada' -> 'entrada'
UPDATE animal_events
SET event_type_id = get_event_type_id('entrada')
WHERE event_type = 'entrada';

-- Map 'socialização' -> 'socializacao'
UPDATE animal_events
SET event_type_id = get_event_type_id('socializacao')
WHERE event_type = 'socialização';

-- Map 'castração' -> 'castracao'
UPDATE animal_events
SET event_type_id = get_event_type_id('castracao')
WHERE event_type = 'castração';

-- Map 'banho_tosa' -> 'banho_tosa'
UPDATE animal_events
SET event_type_id = get_event_type_id('banho_tosa')
WHERE event_type = 'banho_tosa';

-- Map 'adestramento' -> 'adestramento'
UPDATE animal_events
SET event_type_id = get_event_type_id('adestramento')
WHERE event_type = 'adestramento';

-- Step 5: Verify migration
SELECT
  event_type,
  event_type_id,
  COUNT(*) as count
FROM animal_events
GROUP BY event_type, event_type_id
ORDER BY event_type;

-- Step 6: Once verified, we can make event_type_id NOT NULL and drop event_type column
-- (These will be done in a separate step after verification)
-- ALTER TABLE animal_events ALTER COLUMN event_type_id SET NOT NULL;
-- ALTER TABLE animal_events DROP COLUMN event_type;

-- Cleanup function
DROP FUNCTION IF EXISTS get_event_type_id(TEXT);
