import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Helper to log activities
async function logActivity(userId, userLabel, action, details) {
  try {
    await prisma.activity.create({
      data: { userId, userLabel, action, details }
    });
  } catch (err) {
    console.error('Activity logging failed:', err);
  }
}

// Helper to notify admins on submissions
async function notifyAdmins(message) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, status: 'ACTIVE' }
    });
    for (const admin of admins) {
      await prisma.notification.create({
        data: { userId: admin.id, message }
      });
    }
  } catch (err) {
    console.error('Notification failed:', err);
  }
}

export async function GET(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const projectId = searchParams.get('projectId');
    const roleFilter = searchParams.get('role');
    const userIdFilter = searchParams.get('userId');

    // Admin & Lead can read everything; general users can only read their own logs
    const isPowerUser = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD'].includes(userSession.role);
    
    let whereClause = {};
    if (!isPowerUser) {
      whereClause.userId = userSession.id;
    } else {
      if (userIdFilter) {
        whereClause.userId = userIdFilter;
      }
      if (roleFilter) {
        whereClause.user = { role: roleFilter };
      }
    }

    if (clientId) whereClause.clientId = clientId;
    if (projectId) whereClause.projectId = projectId;

    const logs = await prisma.workLog.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, role: true, department: true } },
        client: { select: { name: true } },
        project: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(logs);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const userSession = await getAuthenticatedUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      date,
      clientId,
      projectId,
      taskType,
      topic,
      description,
      timeSpent,
      priority,
      attachmentUrl,
      notes
    } = await req.json();

    if (!clientId || !taskType || !topic) {
      return NextResponse.json({ error: 'Missing required work log parameters' }, { status: 400 });
    }

    // Create the work log
    const workLog = await prisma.workLog.create({
      data: {
        userId: userSession.id,
        date: date ? new Date(date) : new Date(),
        clientId,
        projectId: projectId || null,
        taskType,
        topic,
        description: description || null,
        timeSpent: timeSpent ? parseInt(timeSpent, 10) : 0,
        priority: priority || 'MEDIUM',
        attachmentUrl: attachmentUrl || null,
        notes: notes || null
      },
      include: {
        client: true,
        project: true
      }
    });

    // Logging Activity
    await logActivity(
      userSession.id,
      userSession.name,
      'SUBMIT_WORK_LOG',
      `Logged completed ${taskType} for client "${workLog.client.name}" - ${topic} (${timeSpent || 0} mins)`
    );

    // Notify admins
    await notifyAdmins(
      `🎉 ${userSession.name} (${userSession.role.replace('_', ' ')}) logged: "${topic}" for client ${workLog.client.name}`
    );

    // Automatic OKR Progress Update Check
    // E.g. Find matching OKRs for this user and increment Key Result progress
    try {
      const activeOkrs = await prisma.okr.findMany({
        where: { userId: userSession.id },
        include: { keyResults: true }
      });

      for (const okr of activeOkrs) {
        for (const kr of okr.keyResults) {
          let matches = false;
          const titleLower = kr.title.toLowerCase();
          const taskLower = taskType.toLowerCase();
          const topicLower = topic.toLowerCase();

          // Dynamic matching heuristic
          // 1. Explicit keyword matches
          if (titleLower.includes('video') && taskLower.includes('video')) matches = true;
          if (titleLower.includes('reel') && taskLower.includes('reel')) matches = true;
          if (titleLower.includes('design') && (taskLower.includes('design') || taskLower.includes('post') || taskLower.includes('page') || taskLower.includes('carousel'))) matches = true;
          
          // 2. Direct string inclusion (if task type is mentioned in the Key Result title)
          if (taskLower.length > 3 && titleLower.includes(taskLower)) matches = true;
          
          // 3. General catch-all for creative output
          if (titleLower.includes('asset') || titleLower.includes('creative') || titleLower.includes('task')) matches = true;

          // 4. Topic matching (if a specific project or topic keyword is in the KR)
          if (topicLower && topicLower.length > 4 && titleLower.includes(topicLower)) matches = true;

          if (matches) {
            await prisma.keyResult.update({
              where: { id: kr.id },
              data: { current: { increment: 1 } }
            });
          }
        }
      }
    } catch (okrErr) {
      console.error('Error auto-updating OKR key result progress:', okrErr);
    }

    return NextResponse.json(workLog, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
