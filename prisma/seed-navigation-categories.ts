import 'dotenv/config';

import { categories } from '../data/categories';
import { prisma } from './seeds/seed-utils';

async function main() {
  for (const [position, category] of categories.entries()) {
    const data = {
      label: category.label,
      iconName: category.icon.displayName ?? category.icon.name ?? null,
      image: category.image,
      coverImages: [...category.coverImages],
      shortDescription: category.shortDescription,
      description: category.description,
      accentColor: category.accentColor,
      active: true,
      position
    };
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: data,
      create: { id: category.id, slug: category.slug, ...data },
      select: { id: true }
    });
    for (const [subPosition, subcategory] of category.subcategories.entries()) {
      await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: record.id, slug: subcategory.slug } },
        update: { label: subcategory.label, active: true, position: subPosition },
        create: {
          categoryId: record.id, slug: subcategory.slug,
          label: subcategory.label, active: true, position: subPosition
        }
      });
    }
  }
  console.log('Eight navigation categories ready.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
