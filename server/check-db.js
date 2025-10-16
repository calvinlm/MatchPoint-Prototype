// server/scripts/check-db.js
// Lists public tables, checks for "Category", and prints Team/TeamMember columns + enums.
// Uses DATABASE_URL from server/.env

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const url = process.env.DATABASE_URL

if (!url) {
  console.error('Missing DATABASE_URL (check server/.env)')
  process.exit(1)
}

const pool = new Pool({ connectionString: url })

async function query(q, params = []) {
  const { rows } = await pool.query(q, params)
  return rows
}

function printSection(title) {
  console.log('\n' + '─'.repeat(4) + ' ' + title + ' ' + '─'.repeat(4))
}

(async () => {
  try {
    printSection('Public tables')
    const tables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type   = 'BASE TABLE'
      ORDER BY table_name;
    `)
    console.table(tables)

    // Expect new Division table, legacy Category should be gone
    const hasCategory = tables.some((t) => t.table_name === 'Category')
    const hasDivision = tables.some((t) => t.table_name === 'Division')
    console.log(`\nCategory table present?`, hasCategory ? 'YES ❌ (remove via migration)' : 'NO ✅')
    console.log(`Division table present?`, hasDivision ? 'YES ✅' : 'NO ❌')

    // Columns for Team
    printSection('Team columns')
    const teamCols = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='Team'
      ORDER BY ordinal_position;
    `)
    console.table(teamCols)

    // Columns for TeamMember
    printSection('TeamMember columns')
    const teamMemberCols = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='TeamMember'
      ORDER BY ordinal_position;
    `)
    console.table(teamMemberCols)

    // Indexes for Team + TeamMember
    printSection('Indexes')
    const idx = await query(`
      SELECT schemaname, tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname='public' AND tablename IN ('Team','TeamMember')
      ORDER BY tablename, indexname;
    `)
    console.table(idx.map(r => ({
      table: r.tablename,
      index: r.indexname,
      def: r.indexdef
    })))

    // Enums (AgeGroup, DivisionType, Level, Gender)
    printSection('Enum values')
    const enums = await query(`
      SELECT t.typname AS enum_type, e.enumlabel AS value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname IN ('AgeGroup','DivisionType','Level','Gender')
      ORDER BY t.typname, e.enumsortorder;
    `)
    console.table(enums)

    // Quick expectations
    printSection('Expected model checks')
    const expectedTeamCols = ['id','code','tournamentId','age','division','level','createdAt','updatedAt']
    const teamColNames = new Set(teamCols.map(c => c.column_name))
    const missing = expectedTeamCols.filter(c => !teamColNames.has(c))
    const extra   = [...teamColNames].filter(c => !expectedTeamCols.includes(c))
    console.log('Team missing columns:', missing.length ? missing : 'none ✅')
    console.log('Team extra columns:  ', extra.length ? extra : 'none ✅')

  } catch (e) {
    console.error(e)
  } finally {
    await pool.end()
  }
})()
