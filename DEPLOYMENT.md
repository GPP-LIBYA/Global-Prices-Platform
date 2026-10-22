# دليل النشر الرسمي لمنصة الأسعار العالمية (GPP)
# Official Deployment Guide - Global Prices Platform (GPP)

---

## فهرس المحتويات | Table of Contents
1. [نظرة عامة على معمارية النشر | Architecture Overview](#1-نظرة-عامة-على-معمارية-النشر--architecture-overview)
2. [تنبيه هام بشأن لوحة التحكم ADMIN-GPP | Critical Isolation Notice](#2-تنبيه-هام-بشأن-لوحة-التحكم-admin-gpp--critical-isolation-notice)
3. [متطلبات النظام والتشغيل | System Requirements](#3-متطلبات-النظام-والتشغيل--system-requirements)
4. [إعداد متغيرات البيئة | Environment Configuration](#4-إعداد-متغيرات-البيئة--environment-configuration)
5. [خطوات التنزيل والبناء | Clone, Install & Build](#5-خطوات-التنزيل-والبناء--clone-install--build)
6. [إعداد خادم الويب Nginx | Nginx Configuration](#6-إعداد-خادم-الويب-nginx--nginx-configuration)
7. [إعداد خادم الويب Apache | Apache Configuration](#7-إعداد-خادم-الويب-apache--apache-configuration)
8. [إعداد وتفعيل شهادة الأمان HTTPS / SSL](#8-إعداد-وتفعيل-شهادة-الأمان-https--ssl)
9. [خطوات الفحص والتحقق بعد النشر | Post-Deployment Verification](#9-خطوات-الفحص-والتحقق-بعد-النشر--post-deployment-verification)

---

## 1. نظرة عامة على معمارية النشر | Architecture Overview

تم بناء منصة الأسعار العالمية (Public GPP) كمنصة واجهة أمامية عالية الأداء (React SPA + Vite + Tailwind CSS) تعمل بالكامل على جذر الدومين:
* **النطاق الرسمي للمنصة العامة (Public GPP):**  
  `https://gpp.ltnet.gov.ly/`
* **المسار المخصص للوحة الإدارة (ADMIN-GPP):**  
  `https://gpp.ltnet.gov.ly/admin/`

---

## 2. تنبيه هام بشأن لوحة التحكم ADMIN-GPP | Critical Isolation Notice

> ⚠️ **تحذير فني بالغ الأهمية للإدارة الفنية:**  
> لوحة التحكم **ADMIN-GPP** تطبيق منفصل تمامًا يعمل تحت المسار `/admin/`.  
> عند نشر أو تحديث ملفات المنصة العامة (Public GPP) على المجلد الرئيسي (`/`):
> 1. **يُمنع منعًا باتًا** حذف مجلد `/admin/` أو استبدال ملفاته أثناء نسخ مجلد `dist/`.
> 2. **يُمنع** اعتراض طلبات المسار `/admin/` بواسطة قواعد إعادة التوجيه (Rewrite rules) الخاصة بالمنصة العامة.
> 3. استخدم دائمًا أمر المزامنة الآمن الموضح أدناه (`rsync` باستثناء `admin`).

> ⚠️ **Critical Notice for DevOps & Sysadmins:**  
> **ADMIN-GPP** is an independent application deployed at `/admin/`.  
> When deploying or updating Public GPP at the root:  
> - **NEVER** overwrite, delete, or wipe the `/admin/` directory or its assets.  
> - Ensure SPA rewrite fallback rules for the root app do **NOT** intercept `/admin/` requests.

---

## 3. متطلبات النظام والتشغيل | System Requirements

* **نظام التشغيل:** Linux (Ubuntu 20.04/22.04/24.04 LTS, Debian 11/12, أو RHEL/Rocky Linux).
* **Node.js:** إصدار `20.x LTS` أو `22.x LTS` (يوصى بـ v20 أو v22).
* **npm:** إصدار `10.x` أو أحدث.
* **خادم الويب:** Nginx 1.18+ (موصى به) أو Apache 2.4+.
* **مدير الحزم / التثبيت:** `git`, `rsync`, `curl`.

---

## 4. إعداد متغيرات البيئة | Environment Configuration

انسخ ملف الإعدادات الاسترشادي `.env.example` إلى `.env` في بيئة الإنتاج:

```bash
cp .env.example .env
```

محتوى ملف `.env` لبيئة الإنتاج:

```env
# رابط مشروع Supabase الخاص بشبكة ليبيا للتجارة
VITE_SUPABASE_URL=https://uqqbbaylcmmtyutymqpa.supabase.co

# المفتاح العام الآمن (Anon Key)
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# خيار بيئة النشر (تلقائي مع أمر build:production)
VITE_DEPLOY_TARGET=production
```

> 🔒 **تنبيه أمني:** لا تقم برفع ملف `.env` إلى مستودع Git نهائيًا.

---

## 5. خطوات التنزيل والبناء | Clone, Install & Build

### 1) استنساخ المشروع من المستودع الرسمي:
```bash
git clone https://github.com/GPP-LIBYA/Global-Prices-Platform.git
cd Global-Prices-Platform
```

### 2) تثبيت الحزم البرمجية المعتمدة:
```bash
npm ci
```

### 3) فحص الأخطاء البرمجية ونمط TypeScript:
```bash
npm run lint
```

### 4) بناء نسخة الإنتاج الرسمية:
```bash
npm run build:production
```

> **ملاحظة:** يتم توليد ملفات التشغيل في مجلد `dist/` مع ضبط المسار الأساسي `base: '/'`.  
> إذا كان النشر للاستعراض على GitHub Pages، يُستخدم الأمر: `npm run build:github-pages`.

### 5) المزامنة الآمنة للملفات إلى مسار الخادم:
افترض أن مسار استضافة الموقع هو `/var/www/gpp`:

```bash
# إنشاء المجلدات في حال عدم وجودها
sudo mkdir -p /var/www/gpp

# مزامنة ملفات المنصة العامة مع استثناء مجلد لوحة الإدارة admin
sudo rsync -av --delete --exclude='admin' --exclude='admin/*' dist/ /var/www/gpp/

# ضبط الصلاحيات للمستخدم www-data
sudo chown -R www-data:www-data /var/www/gpp
sudo chmod -R 755 /var/www/gpp
```

---

## 6. إعداد خادم الويب Nginx | Nginx Configuration

أنشئ ملف الإعداد `/etc/nginx/sites-available/gpp.ltnet.gov.ly`:

```nginx
# إعادة التوجيه من HTTP إلى HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name gpp.ltnet.gov.ly;

    return 301 https://$host$request_uri;
}

# تكوين الإنتاج الرئيسي (HTTPS)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name gpp.ltnet.gov.ly;

    root /var/www/gpp;
    index index.html;

    # شهادات الأمان SSL (تعدل حسب مسار الشهادة)
    ssl_certificate /etc/letsencrypt/live/gpp.ltnet.gov.ly/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gpp.ltnet.gov.ly/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ترويسات الأمان
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ضغط Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json image/svg+xml;

    # 1. إعدادات لوحة التحكم المنفصلة ADMIN-GPP (ممنوع اعتراضها)
    location ^~ /admin {
        alias /var/www/gpp/admin; # أو مسار المشروع المنفصل للوحة الإدارة
        index index.html;
        try_files $uri $uri/ /admin/index.html;

        # التخزين المؤقت لملفات لوحة الإدارة
        location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }

    # 2. التخزين المؤقت للأصول الثابتة للمنصة العامة
    location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 3. توجيه المنصة العامة (Public GPP SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # منع الوصول للملفات المخفية
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

لتفعيل الإعداد في Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/gpp.ltnet.gov.ly /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. إعداد خادم الويب Apache | Apache Configuration

في حال استخدام Apache، تأكد من تفعيل الموديولات المطلوبة:
```bash
sudo a2enmod rewrite ssl headers expires deflate
```

أنشئ ملف VirtualHost في `/etc/apache2/sites-available/gpp.ltnet.gov.ly.conf`:

```apache
<VirtualHost *:80>
    ServerName gpp.ltnet.gov.ly
    Redirect permanent / https://gpp.ltnet.gov.ly/
</VirtualHost>

<VirtualHost *:443>
    ServerName gpp.ltnet.gov.ly
    DocumentRoot /var/www/gpp

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/gpp.ltnet.gov.ly/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/gpp.ltnet.gov.ly/privkey.pem

    # مسار لوحة الإدارة المستقلة
    Alias /admin /var/www/gpp/admin
    <Directory /var/www/gpp/admin>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
        RewriteEngine On
        RewriteBase /admin/
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /admin/index.html [L]
    </Directory>

    # قواعد المنصة العامة
    <Directory /var/www/gpp>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted

        RewriteEngine On
        RewriteBase /

        # استثناء مسار لوحة الإدارة من إعادة التوجيه
        RewriteRule ^admin(/.*)?$ - [L]

        # إعادة التوجيه لـ SPA
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # ترويسات الأمان
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"

    # التخزين المؤقت للأصول
    <FilesMatch "\.(ico|pdf|flv|jpg|jpeg|png|gif|js|css|swf|svg|woff|woff2)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
</VirtualHost>
```

لتفعيل الإعداد في Apache:
```bash
sudo a2ensite gpp.ltnet.gov.ly.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

---

## 8. إعداد وتفعيل شهادة الأمان HTTPS / SSL

باستخدام Let's Encrypt و Certbot:

```bash
# تثبيت Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# إصدار وتثبيت الشهادة تلقائيًا لـ Nginx
sudo certbot --nginx -d gpp.ltnet.gov.ly

# اختبار التجديد التلقائي
sudo certbot renew --dry-run
```

---

## 9. خطوات الفحص والتحقق بعد النشر | Post-Deployment Verification

بعد انتهاء النشر، نفّذ الفحوصات التالية:

1. **الاستجابة الأساسية (HTTP Status):**
   ```bash
   curl -I https://gpp.ltnet.gov.ly/
   # يجب أن تكون النتيجة: HTTP/2 200 OK
   ```

2. **تحميل الأصول الثابتة (Asset Loading):**
   تأكد من فتح المتصفح وفحص Network Tab للتأكد من تحميل ملفات `assets/*.js` و `assets/*.css` برمز `200` وبدون أخطاء `404`.

3. **مسار لوحة الإدارة (Admin Route Isolation):**
   افتح: `https://gpp.ltnet.gov.ly/admin/`
   تأكد من عدم تحميل المنصة العامة، وأن الطلب يوجه إلى ملفات مشروع لوحة الإدارة.

4. **التنقل بالروابط (HashRouter Navigation):**
   اختبر الانتقال بين الأقسام:
   - الصفحة الرئيسية: `https://gpp.ltnet.gov.ly/#/`
   - صفحة الأسعار: `https://gpp.ltnet.gov.ly/#/prices`
   - صفحة التقارير: `https://gpp.ltnet.gov.ly/#/reports`
   - صفحة الأخبار: `https://gpp.ltnet.gov.ly/#/news`

5. **فحص اتصال Supabase:**
   - تأكد من جلب بيانات السلع والأسعار والمؤشرات.
   - تأكد من تحميل الشعارات الوطنية وشعار شبكة ليبيا للتجارة من Supabase Storage.

6. **فحص نظام وضع الصيانة (Platform Status):**
   عند تغيير قيمة `is_maintenance` إلى `true` في جدول `platform_status` في Supabase، تظهر شاشة الصيانة الرسمية بالشارة الذهبية: «وضع الصيانة».

---
**شبكة ليبيا للتجارة (Libya Trade Net - LTNet)**  
*فريق التطوير والدعم الفني لمنصة الأسعار العالمية GPP*
