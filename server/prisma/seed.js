import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_BOOK_CATEGORIES = [
  'القرآن وعلومه',
  'الحديث الشريف',
  'الفقه الإسلامي',
  'السيرة النبوية',
  'العقيدة',
  'التزكية والرقائق',
  'التاريخ الإسلامي',
  'أخرى',
];

const DEFAULT_VIDEO_CATEGORIES = ['عام', 'محاضرات', 'دروس', 'خطب'];

async function main() {
  const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';

  const existingAdmin = await prisma.admin.findUnique({ where: { username } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.admin.create({ data: { username, passwordHash, fullName: 'المدير' } });
    console.log(`✔ تم إنشاء حساب المدير الافتراضي (${username}) — غيّر كلمة المرور من لوحة الإعدادات بعد أول دخول.`);
  } else {
    console.log('ℹ حساب المدير موجود مسبقاً — تم تخطي الإنشاء.');
  }

  for (let i = 0; i < DEFAULT_BOOK_CATEGORIES.length; i++) {
    await prisma.category.upsert({
      where: { name_type: { name: DEFAULT_BOOK_CATEGORIES[i], type: 'book' } },
      update: {},
      create: { name: DEFAULT_BOOK_CATEGORIES[i], type: 'book', sortOrder: i },
    });
  }

  for (let i = 0; i < DEFAULT_VIDEO_CATEGORIES.length; i++) {
    await prisma.category.upsert({
      where: { name_type: { name: DEFAULT_VIDEO_CATEGORIES[i], type: 'video' } },
      update: {},
      create: { name: DEFAULT_VIDEO_CATEGORIES[i], type: 'video', sortOrder: i },
    });
  }

  console.log('✔ تم تجهيز التصنيفات الافتراضية.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
