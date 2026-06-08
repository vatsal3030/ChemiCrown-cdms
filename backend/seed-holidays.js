require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INDIA_HOLIDAYS_2025 = [
  // National Holidays (read-only)
  { name: 'Republic Day', date: new Date('2025-01-26'), type: 'NATIONAL', isReadOnly: true, description: 'National Holiday', year: 2025 },
  { name: 'Independence Day', date: new Date('2025-08-15'), type: 'NATIONAL', isReadOnly: true, description: 'National Holiday', year: 2025 },
  { name: 'Gandhi Jayanti', date: new Date('2025-10-02'), type: 'NATIONAL', isReadOnly: true, description: 'National Holiday', year: 2025 },
  // Major Festivals
  { name: 'Makar Sankranti', date: new Date('2025-01-14'), type: 'FESTIVAL', isReadOnly: false, description: 'Festival', year: 2025 },
  { name: 'Maha Shivaratri', date: new Date('2025-02-26'), type: 'FESTIVAL', isReadOnly: false, description: 'Festival', year: 2025 },
  { name: 'Holi', date: new Date('2025-03-14'), type: 'FESTIVAL', isReadOnly: false, description: 'Festival', year: 2025 },
  { name: 'Eid ul-Fitr', date: new Date('2025-03-31'), type: 'FESTIVAL', isReadOnly: false, description: 'Islamic Festival', year: 2025 },
  { name: 'Ram Navami', date: new Date('2025-04-06'), type: 'FESTIVAL', isReadOnly: false, description: 'Hindu Festival', year: 2025 },
  { name: 'Mahavir Jayanti', date: new Date('2025-04-10'), type: 'FESTIVAL', isReadOnly: false, description: 'Jain Festival', year: 2025 },
  { name: 'Good Friday', date: new Date('2025-04-18'), type: 'FESTIVAL', isReadOnly: false, description: 'Christian Festival', year: 2025 },
  { name: 'Buddha Purnima', date: new Date('2025-05-12'), type: 'FESTIVAL', isReadOnly: false, description: 'Buddhist Festival', year: 2025 },
  { name: 'Eid ul-Adha', date: new Date('2025-06-07'), type: 'FESTIVAL', isReadOnly: false, description: 'Islamic Festival', year: 2025 },
  { name: 'Muharram', date: new Date('2025-07-06'), type: 'FESTIVAL', isReadOnly: false, description: 'Islamic Festival', year: 2025 },
  { name: 'Janmashtami', date: new Date('2025-08-16'), type: 'FESTIVAL', isReadOnly: false, description: 'Hindu Festival', year: 2025 },
  { name: 'Ganesh Chaturthi', date: new Date('2025-08-27'), type: 'FESTIVAL', isReadOnly: false, description: 'Hindu Festival', year: 2025 },
  { name: 'Milad-un-Nabi', date: new Date('2025-09-05'), type: 'FESTIVAL', isReadOnly: false, description: 'Islamic Festival', year: 2025 },
  { name: 'Dussehra', date: new Date('2025-10-02'), type: 'FESTIVAL', isReadOnly: false, description: 'Hindu Festival', year: 2025 },
  { name: 'Diwali', date: new Date('2025-10-20'), type: 'FESTIVAL', isReadOnly: false, description: 'Hindu Festival', year: 2025 },
  { name: 'Diwali (Lakshmi Puja)', date: new Date('2025-10-21'), type: 'FESTIVAL', isReadOnly: false, description: 'Hindu Festival', year: 2025 },
  { name: 'Govardhan Puja', date: new Date('2025-10-22'), type: 'FESTIVAL', isReadOnly: false, description: 'Hindu Festival', year: 2025 },
  { name: 'Bhai Dooj', date: new Date('2025-10-23'), type: 'FESTIVAL', isReadOnly: false, description: 'Hindu Festival', year: 2025 },
  { name: 'Guru Nanak Jayanti', date: new Date('2025-11-05'), type: 'FESTIVAL', isReadOnly: false, description: 'Sikh Festival', year: 2025 },
  { name: 'Christmas', date: new Date('2025-12-25'), type: 'FESTIVAL', isReadOnly: false, description: 'Christian Festival', year: 2025 },
];

async function main() {
  console.log('Seeding 2025 holidays...');
  const existing = await prisma.holidayCalendar.count({ where: { year: 2025 } });
  if (existing > 0) {
    console.log(`Already seeded: ${existing} holidays for 2025`);
    return;
  }
  await prisma.holidayCalendar.createMany({ data: INDIA_HOLIDAYS_2025, skipDuplicates: true });
  console.log(`✅ Seeded ${INDIA_HOLIDAYS_2025.length} holidays for 2025`);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
