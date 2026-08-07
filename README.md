# دار العلوم — Dar Al Uloom

Full-stack Islamic digital library built with React/Vite, Express, PostgreSQL and Prisma. Includes books/PDF reader, videos, favorites, multilingual RTL/LTR UI, admin/developer panels, uploads, theming and PWA/offline support.

## Replit quick start
1. Import this repository/ZIP into Replit.
2. Create a PostgreSQL database and add `DATABASE_URL` in **Secrets**.
3. Add `JWT_SECRET`, `DEFAULT_ADMIN_USERNAME`, and `DEFAULT_ADMIN_PASSWORD` in Secrets.
4. Run `npm install`, then `npm run dev`.
5. For deployment use `npm run build` followed by `npm run start:prod`.

> Do not commit real passwords or JWT secrets. The first startup seeds the default admin only if needed.

# دار العلوم — مكتبة إسلامية (تطبيق مستقل)

تطبيق ويب متكامل (React + Node.js/Express + PostgreSQL) لإدارة وعرض مكتبة
كتب وفيديوهات إسلامية. **مستقل بالكامل** — لا يعتمد على Base44 ولا أي منصة
ذكاء اصطناعي ولا أي خدمة سحابية خاصة. **يعمل 24 ساعة على الإنترنت بمجرد
نشره على Render أو أي VPS — لا يحتاج جهازك الشخصي أن يكون مفتوحاً أو
متصلاً أبداً بعد النشر.**

## المتطلبات

- Node.js 18 أو أحدث
- قاعدة بيانات PostgreSQL (محلية عبر Docker، أو مجانية سحابياً، أو من Render)

## التشغيل محلياً (للتطوير فقط)

```bash
npm install
```

سينشئ هذا الأمر تلقائياً ملف Prisma Client (عبر `postinstall`).

انسخ ملف إعدادات السيرفر وعدّله:

```bash
cp server/.env.example server/.env
```

افتح `server/.env` وعدّل:
- `DATABASE_URL` — رابط اتصال PostgreSQL (محلي عبر Docker، أو مجاني من
  [Neon](https://neon.tech) / [Supabase](https://supabase.com) / Render)
- `JWT_SECRET` — أي نص عشوائي طويل وفريد
- `DEFAULT_ADMIN_USERNAME` / `DEFAULT_ADMIN_PASSWORD` — بيانات دخول المدير
  الأولى (يمكن تغييرها لاحقاً من لوحة الإعدادات)

أسرع طريقة لتشغيل PostgreSQL محلياً (يتطلب Docker):

```bash
docker run --name dar-al-uloom-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dar_al_uloom -p 5432:5432 -d postgres:16
```

ثم شغّل التطبيق:

```bash
npm run dev
```

هذا الأمر يقوم تلقائياً بـ:
1. إنشاء جداول قاعدة البيانات (`prisma db push`) إن لم تكن موجودة
2. إنشاء حساب المدير الافتراضي + التصنيفات الافتراضية (Seed)
3. تشغيل واجهة React على `http://localhost:5173`
4. تشغيل سيرفر الـ API على `http://localhost:4000`

افتح `http://localhost:5173` في المتصفح. الموقع نفسه (الكتب/الفيديوهات) عام
لأي زائر بدون تسجيل دخول. لوحة الإدارة فقط (`/admin`, `/settings`, `/dev`)
تتطلب تسجيل الدخول بحساب المدير.

> ملاحظة: `localhost` هنا يُستخدم فقط أثناء التطوير على جهازك. في مسار
> الإنتاج (Render أو أي VPS) لا يوجد أي `localhost` مطلقاً — الواجهة والـ
> API يعملان من نفس النطاق العام الذي يمنحك إياه الاستضافة، ويعملان طوال
> الوقت بغض النظر عن حالة جهازك.

## النشر على الإنترنت (Render) — يعمل 24 ساعة بدون جهازك

هذا المشروع جاهز للنشر مباشرة عبر ملف `render.yaml` المرفق (Render
Blueprint) الذي ينشئ تلقائياً:
- **Web Service** واحد يخدم الواجهة والـ API معاً من نفس النطاق
- **قاعدة بيانات PostgreSQL** مُدارة من Render

### الخطوات

1. ارفع المشروع إلى مستودع GitHub/GitLab.
2. في لوحة Render: **New → Blueprint**، ثم اختر المستودع. سيقرأ Render
   ملف `render.yaml` تلقائياً وينشئ الخدمتين.
3. عند الطلب، أدخل قيمتك الخاصة لـ `DEFAULT_ADMIN_PASSWORD` (لا تترك القيمة
   الافتراضية). مفتاح `JWT_SECRET` يُنشأ تلقائياً وبشكل عشوائي وآمن.
4. اضغط **Deploy Blueprint** وانتظر اكتمال البناء والنشر.
5. افتح `https://<اسم-خدمتك>.onrender.com/login` وسجّل الدخول بحساب المدير.

بعد هذه الخطوات، التطبيق يعمل بشكل دائم على خوادم Render — لا علاقة له
بجهازك اللابتوب مطلقاً، سواء كان مغلقاً أو مفتوحاً أو غير متصل بالإنترنت.

### ملاحظة مهمة عن الملفات المرفوعة (كتب PDF / فيديوهات / صور)

خطة Render المجانية **لا تدعم أقراصاً دائمة (Persistent Disk)** — أي ملفات
تُرفع (PDF، صور، فيديوهات) قد تُحذف عند كل إعادة نشر. ملف `render.yaml`
يتضمن إعداد قرص دائم (`disk:`) يحل هذه المشكلة، لكنه **يتطلب خطة مدفوعة**
(Starter فما فوق) لتفعيله. للاستخدام الجاد (مكتبة حقيقية بكتب وفيديوهات)
يُنصح بشدة بالترقية لخطة مدفوعة على الأقل لخدمة الـ Web Service، حتى تبقى
الملفات المرفوعة محفوظة دائماً.

بديل آخر: استضافة الملفات نفسها (PDF/فيديو) على تخزين سحابي متوافق مع S3
(مثل Cloudflare R2 أو Backblaze B2) بدل القرص المحلي — يتطلب تعديلاً بسيطاً
على `server/src/middleware/upload.js` إن رغبت بذلك لاحقاً.

### النشر على أي VPS آخر (بديل Render)

المشروع لا يعتمد على Render تحديداً ويعمل على أي خادم Node.js عادي:

```bash
npm install
npm run build      # يبني الواجهة إلى /dist
npm run start:prod # ينشئ الجداول + المدير الافتراضي + يشغّل السيرفر على المنفذ الدائم PORT
```

اضبط متغيرات البيئة (`DATABASE_URL`, `JWT_SECRET`, `PORT`, ...) عبر النظام
أو ملف `server/.env`، وشغّل العملية خلف مدير عمليات دائم مثل PM2 حتى تستمر
بعد إغلاق الطرفية (terminal) أو إعادة تشغيل الخادم:

```bash
pm2 start npm --name dar-al-uloom -- run start:prod
pm2 save && pm2 startup   # لتشغيل تلقائي عند إعادة تشغيل الخادم نفسه
```

## هيكل المشروع

```
src/                     الواجهة الأمامية (React + Vite)
  api/                   عميل الـ API المحلي (بديل @base44/sdk)
  pages/, components/    الصفحات والمكونات
server/                  الـ Backend المستقل
  prisma/schema.prisma   نموذج قاعدة البيانات (PostgreSQL)
  prisma/seed.js         بيانات أولية (حساب المدير + التصنيفات)
  src/routes/            REST APIs
  src/middleware/        مصادقة (JWT) ورفع الملفات (Multer)
  uploads/                books/ covers/ videos/ thumbnails/ images/
render.yaml              إعداد النشر التلقائي على Render (Web Service + Postgres)
```

## نقاط الـ API الرئيسية

| المسار | الوصف |
|---|---|
| `GET/POST/PUT/DELETE /api/books[/:id]` | إدارة الكتب |
| `GET/POST/PUT/DELETE /api/videos[/:id]` | إدارة الفيديوهات |
| `GET/POST/PUT/DELETE /api/video-channels[/:id]` | قنوات الفيديو |
| `GET/POST/PUT/DELETE /api/social-channels[/:id]` | قنوات التواصل |
| `GET/POST/PUT/DELETE /api/categories[/:id]` | التصنيفات |
| `GET/POST/PUT/DELETE /api/settings[/:id]` | إعدادات التطبيق (ألوان/خطوط/بنرات...) |
| `GET /api/search?q=` | بحث نصي محلي في الكتب/الفيديوهات |
| `POST /api/contact` | نموذج التواصل (يُخزَّن في قاعدة البيانات) |
| `POST /api/upload[/cover\|thumbnail\|book\|video]` | رفع الملفات (Multer) |
| `POST /api/auth/login`, `GET/PUT /api/auth/me` | مصادقة المدير (JWT) |

كل عمليات الإنشاء/التعديل/الحذف تتطلب تسجيل دخول المدير
(Header: `Authorization: Bearer <token>`)، بينما القراءة عامة لكل الزوار.
كل التغييرات تُحفظ في PostgreSQL وتظهر فوراً لكل من يفتح التطبيق — لا
توجد بيانات وهمية ولا تخزين مؤقت في المتصفح.

## ملاحظات مهمة حول التصميم

- **لا يوجد حسابات زوار**: يوجد حساب مدير واحد فقط لإدارة المحتوى. المفضلة
  (❤️) تُخزَّن محلياً في متصفح كل زائر (IndexedDB) دون الحاجة لتسجيل الدخول.
- **لا يوجد ذكاء اصطناعي**: البحث عن الكتب بحث نصي محلي كامل (title/author/
  category/description) — لا يتصل بأي LLM أو خدمة خارجية.
- **ترجمة واجهة التطبيق** (i18n بين العربية/الإنجليزية/الفرنسية...) نصوص
  ثابتة محلية بالكامل ولا علاقة لها بالذكاء الاصطناعي.
