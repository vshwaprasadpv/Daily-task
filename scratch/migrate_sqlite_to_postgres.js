const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('🔄 Preparing automated SQLite to PostgreSQL database migration...');

  const projectRoot = path.join(__dirname, '..');
  const schemaPath = path.join(projectRoot, 'prisma/schema.prisma');
  const tempSchemaPath = path.join(projectRoot, 'prisma/schema.sqlite.prisma');

  // 1. Create a temporary schema for SQLite
  console.log('📝 Creating temporary SQLite schema client...');
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  // replace provider to sqlite
  schemaContent = schemaContent.replace('provider = "postgresql"', 'provider = "sqlite"');
  // inject custom output client directory
  schemaContent = schemaContent.replace(
    'provider = "prisma-client-js"',
    'provider = "prisma-client-js"\n  output   = "./sqlite-client"'
  );
  fs.writeFileSync(tempSchemaPath, schemaContent);

  // 2. Generate Prisma Client for SQLite
  console.log('⚙️ Generating SQLite client bindings...');
  execSync('npx prisma generate --schema=prisma/schema.sqlite.prisma', { cwd: projectRoot, stdio: 'inherit' });

  // 3. Load Clients
  const { PrismaClient: SQLiteClient } = require(path.join(projectRoot, 'prisma/sqlite-client'));
  const { PrismaClient: PostgresClient } = require('@prisma/client');

  const sqlite = new SQLiteClient({
    datasources: {
      db: {
        url: 'file:../prisma/dev.db'
      }
    }
  });

  const postgres = new PostgresClient();

  try {
    console.log('🔌 Connecting to databases...');
    await sqlite.$connect();
    await postgres.$connect();

    // Read local data
    console.log('📖 Fetching local SQLite data...');
    const users = await sqlite.user.findMany();
    const clients = await sqlite.client.findMany();
    const projects = await sqlite.project.findMany();
    const workLogs = await sqlite.workLog.findMany();
    const okrs = await sqlite.okr.findMany();
    const keyResults = await sqlite.keyResult.findMany();
    const okrUpdates = await sqlite.okrUpdate.findMany();
    const activities = await sqlite.activity.findMany();
    const notifications = await sqlite.notification.findMany();
    const passwords = await sqlite.passwordRecord.findMany();
    const passwordRoleAccess = await sqlite.passwordRoleAccess.findMany();
    const passwordUserAccess = await sqlite.passwordUserAccess.findMany();
    const passwordLogs = await sqlite.passwordLog.findMany();
    const assets = await sqlite.asset.findMany();
    const checkouts = await sqlite.assetCheckout.findMany();
    const maintenances = await sqlite.assetMaintenance.findMany();

    console.log(`📊 Found records:
      - Users: ${users.length}
      - Clients: ${clients.length}
      - Projects: ${projects.length}
      - Work Logs: ${workLogs.length}
      - OKRs: ${okrs.length}
      - Key Results: ${keyResults.length}
      - OKR Updates: ${okrUpdates.length}
      - Passwords: ${passwords.length}
      - Assets: ${assets.length}
      - Checkouts: ${checkouts.length}
      - Maintenances: ${maintenances.length}
    `);

    // Write to postgres sequentially in proper dependency order (users first, etc.)
    console.log('🚀 Migrating to PostgreSQL on Neon...');

    // 1. Users
    if (users.length > 0) {
      console.log('👥 Migrating Users...');
      for (const u of users) {
        await postgres.user.upsert({
          where: { id: u.id },
          update: u,
          create: u
        });
      }
    }

    // 2. Clients
    if (clients.length > 0) {
      console.log('💼 Migrating Clients...');
      for (const c of clients) {
        await postgres.client.upsert({
          where: { id: c.id },
          update: c,
          create: c
        });
      }
    }

    // 3. Projects
    if (projects.length > 0) {
      console.log('📂 Migrating Projects...');
      for (const p of projects) {
        await postgres.project.upsert({
          where: { id: p.id },
          update: p,
          create: p
        });
      }
    }

    // 4. Work Logs
    if (workLogs.length > 0) {
      console.log('📝 Migrating Work Logs...');
      for (const wl of workLogs) {
        await postgres.workLog.upsert({
          where: { id: wl.id },
          update: wl,
          create: wl
        });
      }
    }

    // 5. OKRs
    if (okrs.length > 0) {
      console.log('🎯 Migrating OKRs...');
      for (const o of okrs) {
        await postgres.okr.upsert({
          where: { id: o.id },
          update: o,
          create: o
        });
      }
    }

    // 6. Key Results
    if (keyResults.length > 0) {
      console.log('📊 Migrating Key Results...');
      for (const kr of keyResults) {
        await postgres.keyResult.upsert({
          where: { id: kr.id },
          update: kr,
          create: kr
        });
      }
    }

    // 7. OKR Updates
    if (okrUpdates.length > 0) {
      console.log('💬 Migrating OKR Updates...');
      for (const up of okrUpdates) {
        await postgres.okrUpdate.upsert({
          where: { id: up.id },
          update: up,
          create: up
        });
      }
    }

    // 8. Passwords
    if (passwords.length > 0) {
      console.log('🔑 Migrating Passwords...');
      for (const pw of passwords) {
        await postgres.passwordRecord.upsert({
          where: { id: pw.id },
          update: pw,
          create: pw
        });
      }
    }

    // 9. Password Role Access
    if (passwordRoleAccess.length > 0) {
      console.log('🔑 Migrating Password Role Access...');
      for (const ra of passwordRoleAccess) {
        await postgres.passwordRoleAccess.upsert({
          where: { id: ra.id },
          update: ra,
          create: ra
        });
      }
    }

    // 10. Password User Access
    if (passwordUserAccess.length > 0) {
      console.log('🔑 Migrating Password User Access...');
      for (const ua of passwordUserAccess) {
        await postgres.passwordUserAccess.upsert({
          where: { id: ua.id },
          update: ua,
          create: ua
        });
      }
    }

    // 11. Password Logs
    if (passwordLogs.length > 0) {
      console.log('🔑 Migrating Password Logs...');
      for (const pl of passwordLogs) {
        await postgres.passwordLog.upsert({
          where: { id: pl.id },
          update: pl,
          create: pl
        });
      }
    }

    // 12. Assets
    if (assets.length > 0) {
      console.log('📦 Migrating Assets...');
      for (const a of assets) {
        await postgres.asset.upsert({
          where: { id: a.id },
          update: a,
          create: a
        });
      }
    }

    // 13. Asset Checkouts
    if (checkouts.length > 0) {
      console.log('📋 Migrating Checkouts...');
      for (const co of checkouts) {
        await postgres.assetCheckout.upsert({
          where: { id: co.id },
          update: co,
          create: co
        });
      }
    }

    // 14. Asset Maintenances
    if (maintenances.length > 0) {
      console.log('🔧 Migrating Maintenances...');
      for (const m of maintenances) {
        await postgres.assetMaintenance.upsert({
          where: { id: m.id },
          update: m,
          create: m
        });
      }
    }

    // 15. Activities
    if (activities.length > 0) {
      console.log('📈 Migrating Activities...');
      for (const act of activities) {
        await postgres.activity.upsert({
          where: { id: act.id },
          update: act,
          create: act
        });
      }
    }

    // 16. Notifications
    if (notifications.length > 0) {
      console.log('🔔 Migrating Notifications...');
      for (const n of notifications) {
        await postgres.notification.upsert({
          where: { id: n.id },
          update: n,
          create: n
        });
      }
    }

    console.log('✨ Data migration completed successfully! 🎉');
  } catch (err) {
    console.error('❌ Data migration failed:', err);
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();

    // Clean up temporary schema and generated client
    console.log('🧹 Cleaning up temporary SQLite generator assets...');
    try {
      if (fs.existsSync(tempSchemaPath)) {
        fs.unlinkSync(tempSchemaPath);
      }
      const sqliteClientFolder = path.join(projectRoot, 'prisma/sqlite-client');
      if (fs.existsSync(sqliteClientFolder)) {
        fs.rmSync(sqliteClientFolder, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn('Could not complete cleanup:', e);
    }
  }
}

main();
