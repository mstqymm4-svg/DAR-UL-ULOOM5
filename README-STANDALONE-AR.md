# دار العلوم — نسخة الخادم المستقل

هذه النسخة تعمل كتطبيق واحد مستقل: React + Express + SQLite + تخزين ملفات محلي.
لا تحتاج PostgreSQL أو Supabase أو Firebase أو أي قاعدة بيانات خارجية.

## أين تُحفظ البيانات؟
- الكتب والفيديوهات والتصنيفات والإعدادات وحساب المدير: `data/darul.sqlite`
- ملفات PDF: `server/uploads/books/`
- الأغلفة: `server/uploads/covers/`
- الفيديوهات: `server/uploads/videos/`
- الصور المصغرة: `server/uploads/thumbnails/`

عند إضافة كتاب أو فيديو من لوحة الإدارة، يرفع الملف إلى الخادم نفسه وتُحفظ بياناته في SQLite على الخادم نفسه.

## تشغيل مباشر
1. ثبّت Node.js 20+.
2. انسخ `.env.example` إلى `.env` وعدّل `JWT_SECRET` وكلمة مرور المدير.
3. نفّذ:

```bash
npm install
npm run build
npm run start:prod
```

ثم افتح `http://SERVER-IP:4000`.

## Docker (أفضل لخادم VPS)
عدّل كلمات السر في `docker-compose.yml` ثم:

```bash
docker compose up -d --build
```

Docker volumes تحفظ قاعدة البيانات والملفات حتى بعد إعادة تشغيل/تحديث الحاوية.

## مهم جداً
إذا نشرت على منصة تحذف قرص التطبيق عند إعادة النشر، اربط `/app/data` و`/app/server/uploads` بقرص Persistent Volume. على VPS عادي أو Docker volumes تبقى البيانات محفوظة محلياً.

## النسخ الاحتياطي
لنسخة احتياطية كاملة احفظ:
- مجلد `data/`
- مجلد `server/uploads/`

بهذين المجلدين يمكنك استرجاع كل الكتب والفيديوهات والبيانات.
