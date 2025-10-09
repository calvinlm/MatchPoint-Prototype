// seed-player.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding sample player...')

  // create one sample player
  const player = await prisma.player.create({
    data: {
      name: 'John Doe',
      age: 28,
      gender: 'MALE',           // must match your enum
      address: '123 Elm Street, Manila',
      contactNumber: '09171234567',
    },
  })

  console.log('✅ Player created:', player)

  const allPlayers = await prisma.player.findMany()
  console.log('📋 All players:', allPlayers)
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
