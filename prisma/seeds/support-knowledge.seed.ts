import type { Prisma } from '../../lib/generated/prisma/client';

import { prisma } from './seed-utils';

import { AJ_LOGIK_SUPPORT_KNOWLEDGE_SEED } from '../../features/support/server/supportKnowledgeSeedCatalog';
import { normalizeSupportKnowledgeText } from '../../features/support/server/supportKnowledgeText';

const AUTO_SUPPORT_BUCKET_SLUG = 'auto-support';

async function seedWorkspace(workspaceId: string): Promise<number> {
  const bucket = await prisma.supportKnowledgeBucket.upsert({
    where: {
      workspaceId_slug: {
        workspaceId,
        slug: AUTO_SUPPORT_BUCKET_SLUG
      }
    },
    create: {
      workspaceId,
      slug: AUTO_SUPPORT_BUCKET_SLUG,
      name: 'AJ Support Intelligence',
      description:
        'Approved customer-facing Q&A knowledge used by AJ Support Intelligence.',
      priority: 100,
      active: true
    },
    update: {
      name: 'AJ Support Intelligence',
      description:
        'Approved customer-facing Q&A knowledge used by AJ Support Intelligence.',
      priority: 100,
      active: true
    },
    select: {
      id: true
    }
  });

  let count = 0;

  for (const item of AJ_LOGIK_SUPPORT_KNOWLEDGE_SEED) {
    const status = item.status ?? 'ACTIVE';

    const entry = await prisma.supportKnowledgeEntry.upsert({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug: item.slug
        }
      },
      create: {
        workspaceId,
        supportKnowledgeBucketId: bucket.id,
        slug: item.slug,
        title: item.title,
        category: item.category,
        intent: item.intent,
        primaryQuestion: item.primaryQuestion,
        answerTemplate: item.answerTemplate,
        clarificationAnswer: item.clarificationAnswer ?? null,
        escalationAnswer: item.escalationAnswer ?? null,
        keywords: item.keywords,
        synonyms: item.synonyms ?? [],
        requiredContext: item.requiredContext ?? [],
        conditions: (item.conditions ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        actions: (item.actions ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        status,
        priority: item.priority ?? 0,
        confidenceThreshold: item.confidenceThreshold ?? 0.65,
        version: item.version ?? 1,
        publishedAt: status === 'ACTIVE' ? new Date() : null,
        archivedAt: status === 'ARCHIVED' ? new Date() : null
      },
      update: {
        supportKnowledgeBucketId: bucket.id,
        title: item.title,
        category: item.category,
        intent: item.intent,
        primaryQuestion: item.primaryQuestion,
        answerTemplate: item.answerTemplate,
        clarificationAnswer: item.clarificationAnswer ?? null,
        escalationAnswer: item.escalationAnswer ?? null,
        keywords: item.keywords,
        synonyms: item.synonyms ?? [],
        requiredContext: item.requiredContext ?? [],
        conditions: (item.conditions ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        actions: (item.actions ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        status,
        priority: item.priority ?? 0,
        confidenceThreshold: item.confidenceThreshold ?? 0.65,
        version: item.version ?? 1,
        publishedAt: status === 'ACTIVE' ? new Date() : null,
        archivedAt: status === 'ARCHIVED' ? new Date() : null
      },
      select: {
        id: true
      }
    });

    await prisma.supportKnowledgeQuestionExample.deleteMany({
      where: {
        entryId: entry.id
      }
    });

    if (item.examples.length) {
      await prisma.supportKnowledgeQuestionExample.createMany({
        data: item.examples.map(example => ({
          entryId: entry.id,
          text: example.text.trim(),
          normalizedText: normalizeSupportKnowledgeText(example.text),
          locale: example.locale ?? 'en-NG',
          weight: example.weight ?? 1,
          active: true
        }))
      });
    }

    count += 1;
  }

  return count;
}

async function main(): Promise<void> {
  const workspaces = await prisma.workspace.findMany({
    where: {
      active: true
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!workspaces.length) {
    throw new Error(
      'No active Shelsea Commerce workspace was found for Support Knowledge seeding.'
    );
  }

  for (const workspace of workspaces) {
    const count = await seedWorkspace(workspace.id);

    console.log(
      `Seeded ${count} Support Knowledge entries for ${workspace.name} (${workspace.id}).`
    );
  }
}

main()
  .catch(cause => {
    console.error(cause);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
