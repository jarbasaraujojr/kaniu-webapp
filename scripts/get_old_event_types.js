const { Client } = require('pg');

async function getOldEventTypes() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'kaniu_old',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to kaniu_old database\n');

    // First, let's find tables related to events
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%event%'
      ORDER BY table_name;
    `);

    console.log('Tables related to events:');
    console.log(tablesResult.rows);
    console.log('\n');

    // Check if there's an event_types or similar table
    const eventTypesTable = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (table_name LIKE '%event_type%' OR table_name LIKE '%tipo%evento%')
      ORDER BY table_name;
    `);

    if (eventTypesTable.rows.length > 0) {
      console.log('Event types tables found:');
      console.log(eventTypesTable.rows);
      console.log('\n');

      // Get data from the first event types table
      const tableName = eventTypesTable.rows[0].table_name;
      const eventTypesData = await client.query(`SELECT * FROM ${tableName} ORDER BY id;`);

      console.log(`Data from ${tableName}:`);
      console.log(JSON.stringify(eventTypesData.rows, null, 2));
    } else {
      // If no event_types table, check the events table structure
      console.log('No event_types table found. Checking events table structure...\n');

      const eventsTableStructure = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name LIKE '%event%'
        AND table_schema = 'public'
        ORDER BY table_name, ordinal_position;
      `);

      console.log('Events table structure:');
      console.log(eventsTableStructure.rows);
      console.log('\n');

      // Get distinct event types from events table
      const allTablesWithEvents = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%event%'
        ORDER BY table_name;
      `);

      for (const table of allTablesWithEvents.rows) {
        const tableName = table.table_name;

        // Check if table has event_type or tipo_evento column
        const hasTypeColumn = await client.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = $1
          AND table_schema = 'public'
          AND (column_name LIKE '%type%' OR column_name LIKE '%tipo%')
        `, [tableName]);

        if (hasTypeColumn.rows.length > 0) {
          const columnName = hasTypeColumn.rows[0].column_name;
          console.log(`\nDistinct event types from ${tableName}.${columnName}:`);

          const distinctTypes = await client.query(`
            SELECT DISTINCT ${columnName} as event_type, COUNT(*) as count
            FROM ${tableName}
            GROUP BY ${columnName}
            ORDER BY count DESC;
          `);

          console.log(JSON.stringify(distinctTypes.rows, null, 2));
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

getOldEventTypes();
