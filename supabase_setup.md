# Supabase Setup Guide for AuthSys

এই গাইডটি আপনাকে AuthSys প্রোজেক্টের জন্য Supabase PostgreSQL ডাটাবেস সেটআপ করতে সাহায্য করবে।

## ১. Supabase প্রোজেক্ট তৈরি করা

1. [Supabase.com](https://supabase.com) এ যান এবং সাইন আপ করুন
2. "New Project" ক্লিক করুন
3. প্রোজেক্টের নাম দিন (যেমন: `AuthSys`)
4. ডাটাবেস পাসওয়ার্ড সেট করুন (এটি সংরক্ষণ করুন)
5. রিজিয়ন সিলেক্ট করুন (আপনার কাছের রিজিয়ন বেছে নিন)
6. "Create new project" ক্লিক করুন

## ২. ডাটাবেস কানেকশন স্ট্রিং পাওয়া

1. Supabase Dashboard-এ আপনার প্রোজেক্টে যান
2. বাম সাইডবার থেকে **Settings** > **Database** এ ক্লিক করুন
3. **Connection String** সেকশনে খুঁজুন
4. **URI** ট্যাব সিলেক্ট করুন
5. **Connection string** কপি করুন (এটি এই রকম দেখবে):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
   ```
6. `[YOUR-PASSWORD]` এর জায়গায় আপনার ডাটাবেস পাসওয়ার্ড দিন

## ৩. ডাটাবেস স্কিমা ইমপোর্ট করা

### অপশন ১: সম্পূর্ণ স্কিমা (নতুন প্রোজেক্টের জন্য)

1. Supabase Dashboard-এ **SQL Editor** এ যান
2. `supabase.sql` ফাইলের সম্পূর্ণ কন্টেন্ট কপি করুন
3. SQL Editor-এ পেস্ট করুন
4. **Run** বাটনে ক্লিক করুন

### অপশন ২: আপডেট মাইগ্রেশন (বিদ্যমান প্রোজেক্টের জন্য)

1. Supabase Dashboard-এ **SQL Editor** এ যান
2. `update_database.md` ফাইলের SQL কোড কপি করুন
3. SQL Editor-এ পেস্ট করুন
4. **Run** বাটনে ক্লিক করুন

**গুরুত্বপূর্ণ:** যদি আপনি আগে থেকেই একটি ডাটাবেস ব্যবহার করছেন, তবে শুধুমাত্র `update_database.md` ব্যবহার করুন।

## ৪. ব্যাকএন্ড কনফিগারেশন

1. `backend/.env` ফাইল খুলুন (যদি না থাকে তবে `backend/.env.example` কপি করে `.env` নামে সেভ করুন)
2. নিচের ভেরিয়েবলগুলো আপডেট করুন:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres

# Redis Configuration (Upstash)
REDIS_URL=redis://default:[YOUR-REDIS-PASSWORD]@[YOUR-REDIS-ENDPOINT]:6379

# Security
SECRET_KEY=your-secret-key-here-change-this-in-production
```

3. `[YOUR-PASSWORD]`, `[PROJECT-REF]`, `[YOUR-REDIS-PASSWORD]`, এবং `[YOUR-REDIS-ENDPOINT]` এর জায়গায় আপনার আসল ভ্যালু দিন

## ৫. Upstash Redis সেটআপ (ঐচ্ছিক কিন্তু রিকমেন্ডেড)

1. [Upstash.com](https://upstash.com) এ যান এবং সাইন আপ করুন
2. "Create Database" ক্লিক করুন
3. ডাটাবেসের নাম দিন (যেমন: `authsys-redis`)
4. রিজিয়ন সিলেক্ট করুন
5. "Create" ক্লিক করুন
6. **Details** ট্যাবে **REST API** সেকশনে **UPSTASH_REDIS_REST_URL** এবং **UPSTASH_REDIS_REST_TOKEN** কপি করুন
7. Redis URL ফরম্যাট করুন:
   ```
   redis://default:[TOKEN]@[HOST]:6379
   ```

## ৬. ব্যাকএন্ড সার্ভার চালু করা

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# অথবা source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## ৭. ভেরিফিকেশন

ব্যাকএন্ড সার্ভার চালু হলে নিচের লগ দেখতে পাবেন:

```
INFO:services.bootstrap:Schema migration: Tables check complete.
INFO:     Application startup complete.
```

এর মানে Supabase-এর সাথে সফলভাবে কানেক্ট হয়েছে।

## ৮. সাধারণ সমস্যা এবং সমাধান

### সমস্যা: `TypeError: 'expires_at' is an invalid keyword argument for EndUser`

**সমাধান:** Supabase SQL Editor-এ এই SQL রান করুন:

```sql
ALTER TABLE end_users ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
```

### সমস্যা: `Redis cache error`

**সমাধান:** 
- Upstash Redis সঠিকভাবে কনফিগার করা আছে কিনা চেক করুন
- `REDIS_URL` সঠিক আছে কিনা ভেরিফাই করুন

### সমস্যা: ব্যাকএন্ড সার্ভার চালু হচ্ছে না

**সমাধান:**
- সব dependencies ইনস্টল করা আছে কিনা চেক করুন: `pip install -r requirements.txt`
- Python ভার্সন 3.8+ ব্যবহার করছেন কিনা চেক করুন
- `.env` ফাইল সঠিকভাবে কনফিগার করা আছে কিনা চেক করুন

## ৯. নিরাপত্তা টিপস

- প্রোডাকশনে `SECRET_KEY` পরিবর্তন করুন
- ডাটাবেস পাসওয়ার্ড শক্তিশালী রাখুন
- `.env` ফাইল কখনও Git-এ পুশ করবেন না
- Supabase Row Level Security (RLS) সঠিকভাবে কনফিগার করুন

## ১০. সাপোর্ট

যদি কোনো সমস্যা হয়:
1. Supabase Dashboard-এ **Logs** চেক করুন
2. ব্যাকএন্ড টার্মিনাল লগ চেক করুন
3. ব্রাউজার কনসোল চেক করুন (ফ্রন্টএন্ড এররের জন্য)

---

**দ্রষ্টব্য:** এই সেটআপ গাইডটি AuthSys প্রোজেক্টের জন্য তৈরি করা হয়েছে। অন্য প্রোজেক্টের জন্য কনফিগারেশন আলাদা হতে পারে।
