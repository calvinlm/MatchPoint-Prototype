// player-seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const players = [
  { name: "Ethan Reyes", age: 24, gender: "MALE", address: "Manila, Metro Manila", contactNumber: "0917-123-4567" },
  { name: "Maya Santos", age: 21, gender: "FEMALE", address: "Quezon City, Metro Manila", contactNumber: "0922-234-5678" },
  { name: "Carlos dela Cruz", age: 29, gender: "MALE", address: "Cebu City, Cebu", contactNumber: "0905-345-6789" },
  { name: "Ariana Villanueva", age: 27, gender: "FEMALE", address: "Davao City, Davao del Sur", contactNumber: "0935-456-7890" },
  { name: "Noah Mercado", age: 32, gender: "MALE", address: "Iloilo City, Iloilo", contactNumber: "0943-567-8901" },
  { name: "Luna Navarro", age: 19, gender: "FEMALE", address: "Bacolod, Negros Occidental", contactNumber: "0918-678-9012" },
  { name: "Miguel Ramos", age: 26, gender: "MALE", address: "Baguio, Benguet", contactNumber: "0928-789-0123" },
  { name: "Isla Fernandez", age: 23, gender: "FEMALE", address: "Zamboanga City, Zamboanga del Sur", contactNumber: "0956-890-1234" },
  { name: "Diego Castillo", age: 28, gender: "MALE", address: "Cagayan de Oro, Misamis Oriental", contactNumber: "0967-901-2345" },
  { name: "Rhea Alonzo", age: 30, gender: "FEMALE", address: "Legazpi, Albay", contactNumber: "0978-012-3456" }
];

async function main() {
  await prisma.player.createMany({ data: players });
  console.log('✅ Inserted 10 sample players.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
