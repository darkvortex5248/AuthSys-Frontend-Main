# RinoxAuth — Improvement Implementation Plan

## Phase 1: CRITICAL BUGS

### 1.1 Fix wrong limit check in user creation
**File:** ackend/routers/developer_users.py:38
**Change:** "max_licenses" ? "max_users_per_app"
**Also line 72** (bulk-create)

### 1.2 Fix max_uses defaults consistency
**Files:**
- ackend/models/domain.py:170 — default=-1 ? default=1
- ackend/schemas/dashboard.py:65 — max_uses: int = 0 ? max_uses: int = 1
- ackend/schemas/dashboard.py:73 — max_uses: int = 0 ? max_uses: int = 1
- rontend/src/app/(dashboard)/users/page.tsx:52 — max_uses: -1 ? max_uses: 1
- rontend/src/app/(dashboard)/users/page.tsx:842 — || 0 ? || 1
- rontend/src/app/(dashboard)/users/page.tsx:129 — max_uses: -1 ? max_uses: 1
- rontend/src/app/(dashboard)/users/page.tsx:141 — max_uses: 0 ? use 
ewUser.max_uses

### 1.3 Fix client registration to set max_uses
**File:** ackend/routers/client_api.py:131-140
**Change:** Add max_uses=license_key.max_uses if license_key.max_uses is not None else 1

### 1.4 Update supabase.sql — add missing columns
**File:** supabase.sql

#### subscription_plans table (after has_device_panel):
max_devices and has_device_panel columns

#### end_users table:
max_uses, is_device_only, user_category, developer_id columns

### 1.5 Fix frontend users page
- Change default max_uses from -1 to 1
- Change input fallback from || 0 to || 1
- Change bulk create to send proper max_uses value

## Phase 2: CASE SENSITIVITY

### 2.1 Normalize username on creation
**Files:** developer_users.py, client_api.py, developer_auth.py
**Change:** All username lookups and saves use .strip().lower()

### 2.2 Add DB-unique constraint on (app_id, username)
**File:** ackend/models/domain.py:149
**Change:** Add __table_args__ = (UniqueConstraint('app_id', 'username'),) to EndUser

### 2.3 Bootstrap migration for existing usernames
**File:** ackend/services/bootstrap.py
**Change:** Lowercase existing usernames, handle duplicates

## Phase 3: DEFAULT VALUES

### 3.1 License key creation defaults
**File:** ackend/routers/developer_keys.py
**Change:** If key_type != "uses_based" and max_uses is None, default to 1

### 3.2 Frontend license key page
**File:** license-keys/page.tsx:55 — max_uses: -1 ? max_uses: 1

## Phase 4: QUALITY IMPROVEMENTS

### 4.1 Deduplicate utc_now()
### 4.2 Add pagination to user listing
### 4.3 Remove plaintext passwords from bulk create response
### 4.4 Fix bulk key duplicate handling
### 4.5 Add password strength validation
