import { PrismaClient, Branch, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yaarmohammadtola.com' },
    update: {},
    create: {
      email: 'admin@yaarmohammadtola.com',
      name: 'System Admin',
      role: 'ADMIN',
      branch: 'UNASSIGNED',
      isApproved: true,
      passwordHash: adminHash,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // ===== FAMILY TREE - Root Ancestor =====
  const root = await prisma.familyMember.upsert({
    where: { id: 'member-root-001' },
    update: {},
    create: {
      id: 'member-root-001',
      name: 'Mohammad Nogordi Sheikh',
      nameUrdu: 'محمد نگودی شیخ',
      branch: 'UNASSIGNED',
      generation: 1,
      gender: 'MALE',
      isAlive: false,
    },
  });

  // Generation 2
  const ataruddin = await prisma.familyMember.upsert({
    where: { id: 'member-gen2-001' },
    update: {},
    create: {
      id: 'member-gen2-001',
      name: 'Ataruddin Sheikh',
      nameUrdu: 'عطار الدین شیخ',
      fatherId: root.id,
      branch: 'UNASSIGNED',
      generation: 2,
      gender: 'MALE',
      isAlive: false,
    },
  });

  // Generation 3 - Three main branches
  const abuSheikh = await prisma.familyMember.upsert({
    where: { id: 'member-abu-001' },
    update: {},
    create: {
      id: 'member-abu-001',
      name: 'Abu Sheikh',
      nameUrdu: 'ابو شیخ',
      fatherId: ataruddin.id,
      branch: 'ABU_SHEIKH',
      generation: 3,
      gender: 'MALE',
      isAlive: false,
    },
  });

  const gumaniSheikh = await prisma.familyMember.upsert({
    where: { id: 'member-gumani-001' },
    update: {},
    create: {
      id: 'member-gumani-001',
      name: 'Gumani Sheikh',
      nameUrdu: 'گمانی شیخ',
      fatherId: ataruddin.id,
      branch: 'GUMANI_SHEIKH',
      generation: 3,
      gender: 'MALE',
      isAlive: false,
    },
  });

  const kalimuddin = await prisma.familyMember.upsert({
    where: { id: 'member-kalim-001' },
    update: {},
    create: {
      id: 'member-kalim-001',
      name: 'Kalimuddin Haji',
      nameUrdu: 'کلیم الدین حاجی',
      fatherId: ataruddin.id,
      branch: 'KALIMUDDIN_HAJI',
      generation: 3,
      gender: 'MALE',
      notes: 'Also known as Munna Haji Bonso',
      isAlive: false,
    },
  });

  // Generation 4 - Kalimuddin's children
  const hajratAli = await prisma.familyMember.upsert({
    where: { id: 'member-hajrat-001' },
    update: {},
    create: {
      id: 'member-hajrat-001',
      name: 'Hajrat Ali',
      nameUrdu: 'حضرت علی',
      fatherId: kalimuddin.id,
      branch: 'HAJRAT_ALI',
      generation: 4,
      gender: 'MALE',
      isAlive: false,
    },
  });

  const afsarSheikh = await prisma.familyMember.upsert({
    where: { id: 'member-afsar-001' },
    update: {},
    create: {
      id: 'member-afsar-001',
      name: 'Afsar Sheikh',
      nameUrdu: 'افسر شیخ',
      fatherId: kalimuddin.id,
      branch: 'AFSAR_SHEIKH',
      generation: 4,
      gender: 'MALE',
      isAlive: false,
    },
  });

  const johordiSheikh = await prisma.familyMember.upsert({
    where: { id: 'member-johordi-001' },
    update: {},
    create: {
      id: 'member-johordi-001',
      name: 'Johordi Sheikh',
      nameUrdu: 'جوہردی شیخ',
      fatherId: kalimuddin.id,
      branch: 'JOHORDI_SHEIKH',
      generation: 4,
      gender: 'MALE',
      isAlive: false,
    },
  });

  const zhuruSamad = await prisma.familyMember.upsert({
    where: { id: 'member-zhuru-001' },
    update: {},
    create: {
      id: 'member-zhuru-001',
      name: 'Zhuru Samad',
      nameUrdu: 'زہرو سمد',
      fatherId: kalimuddin.id,
      branch: 'ZHURU_SAMAD',
      generation: 4,
      gender: 'MALE',
      isAlive: false,
    },
  });

  console.log('✅ Family tree seeded with', 8, 'members');

  // ===== MOSQUE =====
  const mosque = await prisma.mosque.upsert({
    where: { id: 'mosque-main-001' },
    update: {},
    create: {
      id: 'mosque-main-001',
      name: 'Jama Masjid Yaar Mohammad Tola',
      nameUrdu: 'جامع مسجد یار محمد ٹولہ',
      address: 'Yaar Mohammad Tola, Bihar',
      latitude: 25.5941,
      longitude: 85.1376,
      imamName: 'Maulana Abdul Karim',
      mozzimName: 'Mohammad Taslim',
      established: 1965,
    },
  });

  // Namaz timing
  await prisma.namazTiming.create({
    data: {
      mosqueId: mosque.id,
      fajr: '04:45',
      zuhr: '12:30',
      asr: '16:00',
      maghrib: '18:45',
      isha: '20:00',
      jummah: '13:00',
    },
  });

  // ===== GRAVEYARD =====
  await prisma.graveyard.upsert({
    where: { id: 'graveyard-001' },
    update: {},
    create: {
      id: 'graveyard-001',
      name: 'Qabristan Yaar Mohammad Tola',
      address: 'East side, Yaar Mohammad Tola Village',
      latitude: 25.5948,
      longitude: 85.1380,
      totalPlots: 200,
    },
  });

  // ===== SCHOOLS =====
  await prisma.school.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Government Middle School Yaar Mohammad Tola',
        type: 'GOVERNMENT',
        address: 'Main Road, Yaar Mohammad Tola',
        phone: '0612-XXXXXX',
        classRange: '1-8',
        admissionInfo: 'Admission open April-May each year',
      },
      {
        name: 'Al-Huda Madrasa',
        type: 'MADRASA',
        address: 'Near Jama Masjid, Yaar Mohammad Tola',
        phone: '9876543210',
        classRange: '1-10',
        admissionInfo: 'Admission open throughout the year',
      },
    ],
  });

  // ===== MARKET PRICES =====
  await prisma.marketPrice.createMany({
    skipDuplicates: true,
    data: [
      { item: 'Rice (Sona Masuri)', category: 'GRAIN', price: 55, unit: 'kg' },
      { item: 'Wheat', category: 'GRAIN', price: 28, unit: 'kg' },
      { item: 'Arhar Dal', category: 'PULSE', price: 120, unit: 'kg' },
      { item: 'Moong Dal', category: 'PULSE', price: 110, unit: 'kg' },
      { item: 'Potato', category: 'VEGETABLE', price: 25, unit: 'kg' },
      { item: 'Onion', category: 'VEGETABLE', price: 35, unit: 'kg' },
      { item: 'Tomato', category: 'VEGETABLE', price: 40, unit: 'kg' },
      { item: 'Brinjal', category: 'VEGETABLE', price: 30, unit: 'kg' },
      { item: 'Mango', category: 'FRUIT', price: 80, unit: 'kg' },
      { item: 'Banana', category: 'FRUIT', price: 40, unit: 'dozen' },
      { item: 'Rohu Fish', category: 'FISH', price: 200, unit: 'kg' },
      { item: 'Catla Fish', category: 'FISH', price: 250, unit: 'kg' },
      { item: 'Chicken', category: 'MEAT', price: 220, unit: 'kg' },
      { item: 'Mutton', category: 'MEAT', price: 650, unit: 'kg' },
      { item: 'Petrol', category: 'FUEL', price: 106.31, unit: 'litre' },
      { item: 'Diesel', category: 'FUEL', price: 92.76, unit: 'litre' },
    ],
  });

  // ===== GOVERNANCE =====
  await prisma.governanceOfficial.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Mohammad Ismail Sheikh', designation: 'MUKHIYA', ward: 'Village Head', phone: '9876500001' },
      { name: 'Salim Sheikh', designation: 'WARD_MEMBER', ward: 'Ward 1', phone: '9876500002' },
      { name: 'Rani Devi', designation: 'WARD_MEMBER', ward: 'Ward 2', phone: '9876500003' },
      { name: 'Abdul Hamid', designation: 'PANCHAYAT_SAMITI', ward: 'Block Level', phone: '9876500004' },
    ],
  });

  // ===== SAMPLE NEWS =====
  await prisma.news.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'news-001',
        title: 'Village Development Fund Approved',
        content: 'Panchayat has approved ₹5 lakh for road repair work. Work will begin next month.',
        category: 'PANCHAYAT_NEWS',
        authorId: admin.id,
        isPinned: true,
      },
      {
        id: 'news-002',
        title: 'Eid ul-Adha Celebration Schedule',
        content: 'Eid prayers will be held at Jama Masjid at 8:00 AM. All residents are invited.',
        category: 'VILLAGE_NEWS',
        authorId: admin.id,
      },
    ],
  });

  // ===== MAP LOCATIONS =====
  await prisma.mapLocation.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Jama Masjid', type: 'MOSQUE', latitude: 25.5941, longitude: 85.1376 },
      { name: 'Village School', type: 'SCHOOL', latitude: 25.5944, longitude: 85.1372 },
      { name: 'Village Qabristan', type: 'GRAVEYARD', latitude: 25.5948, longitude: 85.1380 },
      { name: 'Village Market', type: 'MARKET', latitude: 25.5938, longitude: 85.1370 },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('📧 Admin login: admin@yaarmohammadtola.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
