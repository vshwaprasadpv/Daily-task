const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clear existing data ──────────────────────────────────
  await prisma.activity.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.workLog.deleteMany({});
  await prisma.keyResult.deleteMany({});
  await prisma.okr.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.user.deleteMany({});

  const hash = bcrypt.hashSync('Admin@123', 10);

  // ── Create Users ─────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: 'Vishwa Admin',
      email: 'admin@creative.com',
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      department: 'Management',
      employeeId: 'EMP001',
      status: 'ACTIVE'
    }
  });

  const designer1 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@creative.com',
      passwordHash: hash,
      role: 'GRAPHIC_DESIGNER',
      department: 'Design',
      employeeId: 'EMP002',
      reportingManager: 'Vishwa Admin',
      status: 'ACTIVE'
    }
  });

  const editor1 = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      email: 'rahul@creative.com',
      passwordHash: hash,
      role: 'VIDEO_EDITOR',
      department: 'Video',
      employeeId: 'EMP003',
      reportingManager: 'Vishwa Admin',
      status: 'ACTIVE'
    }
  });

  const designer2 = await prisma.user.create({
    data: {
      name: 'Ananya Singh',
      email: 'ananya@creative.com',
      passwordHash: hash,
      role: 'UI_DESIGNER',
      department: 'Design',
      employeeId: 'EMP004',
      reportingManager: 'Priya Sharma',
      status: 'ACTIVE'
    }
  });

  const writer = await prisma.user.create({
    data: {
      name: 'Meera Nair',
      email: 'meera@creative.com',
      passwordHash: hash,
      role: 'CONTENT_WRITER',
      department: 'Marketing',
      employeeId: 'EMP005',
      reportingManager: 'Vishwa Admin',
      status: 'ACTIVE'
    }
  });

  console.log('✅ Users seeded.');

  // ── Create Clients & Projects ────────────────────────────
  const clientAcme = await prisma.client.create({
    data: {
      name: 'Acme Corp',
      projects: {
        create: [
          { name: 'Branding Campaign' },
          { name: 'Reel Marketing' },
          { name: 'Website Design' }
        ]
      }
    },
    include: { projects: true }
  });

  const clientBeta = await prisma.client.create({
    data: {
      name: 'Beta Global',
      projects: {
        create: [
          { name: 'Summer Promo Video' },
          { name: 'Social Media Banners' }
        ]
      }
    },
    include: { projects: true }
  });

  console.log('✅ Clients & Projects seeded.');

  // Acme project refs
  const acmeBranding = clientAcme.projects.find(p => p.name === 'Branding Campaign');
  const acmeReels = clientAcme.projects.find(p => p.name === 'Reel Marketing');
  const acmeWeb = clientAcme.projects.find(p => p.name === 'Website Design');

  // Beta project refs
  const betaPromo = clientBeta.projects.find(p => p.name === 'Summer Promo Video');
  const betaBanners = clientBeta.projects.find(p => p.name === 'Social Media Banners');

  // ── Seed Work Logs (Self-Submitted completed logs) ───────
  const logs = [
    // Priya (Graphic Designer)
    {
      userId: designer1.id,
      clientId: clientAcme.id,
      projectId: acmeBranding.id,
      taskType: 'Static Post',
      topic: 'Brand Identity Announcement',
      description: 'Completed 3 static post designs detailing the new brand colors and typography rules.',
      timeSpent: 180, // 3 hours
      priority: 'HIGH'
    },
    {
      userId: designer1.id,
      clientId: clientBeta.id,
      projectId: betaBanners.id,
      taskType: 'Banner',
      topic: 'LinkedIn Profile Banner Header',
      description: 'Designed corporate headers for Beta Global executives LinkedIn profiles.',
      timeSpent: 120, // 2 hours
      priority: 'MEDIUM'
    },
    // Rahul (Video Editor)
    {
      userId: editor1.id,
      clientId: clientAcme.id,
      projectId: acmeReels.id,
      taskType: 'Reel',
      topic: 'Product Launch Teaser',
      description: 'Edited and color graded a 30-sec product launch teaser reel with typography animations.',
      timeSpent: 240, // 4 hours
      priority: 'HIGH'
    },
    {
      userId: editor1.id,
      clientId: clientBeta.id,
      projectId: betaPromo.id,
      taskType: 'Long Video',
      topic: 'Corporate Intro Video',
      description: 'Synced audio, cleaned noise, cut raw B-roll, and output corporate introductory video v1.',
      timeSpent: 480, // 8 hours
      priority: 'HIGH'
    },
    // Ananya (UI Designer)
    {
      userId: designer2.id,
      clientId: clientAcme.id,
      projectId: acmeWeb.id,
      taskType: 'Landing Page',
      topic: 'Pre-launch sign-up screen',
      description: 'Completed Figma layout designs for high-converting pre-launch landing page with dark glassmorphism styling.',
      timeSpent: 300, // 5 hours
      priority: 'MEDIUM'
    }
  ];

  for (const log of logs) {
    await prisma.workLog.create({ data: log });
  }
  console.log('✅ Completed Work Logs seeded.');

  // ── Seed OKRs ────────────────────────────────────────────
  // OKR 1 for Priya
  const okrPriya = await prisma.okr.create({
    data: {
      userId: designer1.id,
      objective: 'Increase creative output while maintaining high quality standards',
      targetYear: 2026,
      targetPeriod: 'Q3',
      keyResults: {
        create: [
          { title: 'Complete 100 creative assets this quarter', target: 100, current: 25, unit: 'assets' },
          { title: 'Maintain under 5% revision request rate', target: 5, current: 2, unit: '%' },
          { title: 'Improve on-time submission rate', target: 100, current: 95, unit: '%' }
        ]
      }
    }
  });

  // OKR 2 for Rahul
  const okrRahul = await prisma.okr.create({
    data: {
      userId: editor1.id,
      objective: 'Optimize video post-production flow and output volume',
      targetYear: 2026,
      targetPeriod: 'Q3',
      keyResults: {
        create: [
          { title: 'Complete 60 edited videos this quarter', target: 60, current: 15, unit: 'videos' },
          { title: 'Maintain average turnaround time under 2 days', target: 2, current: 1, unit: 'days' }
        ]
      }
    }
  });

  console.log('✅ OKRs seeded.');

  // ── Seed Activity Logs ───────────────────────────────────
  await prisma.activity.createMany({
    data: [
      { userId: admin.id, userLabel: admin.name, action: 'CREATE_USER', details: 'Added new designer account for Priya Sharma' },
      { userId: admin.id, userLabel: admin.name, action: 'CREATE_USER', details: 'Added new editor account for Rahul Verma' },
      { userId: designer1.id, userLabel: designer1.name, action: 'SUBMIT_WORK_LOG', details: 'Submitted work log for "Brand Identity Announcement"' },
      { userId: editor1.id, userLabel: editor1.name, action: 'SUBMIT_WORK_LOG', details: 'Submitted completed teaser Reel for Acme Corp' }
    ]
  });

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
