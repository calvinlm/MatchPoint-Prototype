// test-db.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const players = await prisma.player.findMany()
    console.log('✅ Players:', players)
  } catch (err) {
    console.error('❌ Error querying players:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
