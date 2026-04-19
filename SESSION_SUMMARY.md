# POS System - Session Summary

## Overview
This document summarizes all fixes and changes made to the POS system across Web, Android, and Tauri platforms.

---

## App Versions

| Platform | Version |
|----------|---------|
| Web | Latest (Vite + React) |
| Android | **v1.0** (versionCode: 1) |
| Tauri | Latest |

---

## Date: Current Session

### Issue: Admin Dashboard Not Fetching Data

#### Web (React + Vite + Supabase)

**Problem:** Admin Dashboard at `/admin` was showing all zeros - no data was being fetched.

**Root Cause:** The `getAdminStats` and `getUsersStats` functions were defined inside `usersAPI` object, but `AdminDashboard.jsx` was importing and calling them from `dashboardAPI`.

**Files Modified:**
- `frontend/src/services/supabase.js`

**Changes Made:**
1. Added `getAdminStats()` function to `dashboardAPI` object (lines ~280-348)
   - Fetches total items, low stock, out of stock
   - Calculates today/week/month sales and transactions
   - Fetches user counts
2. Added `getUsersStats()` function to `dashboardAPI` object
3. Added 30-second auto-refresh polling to AdminDashboard

**Layout Updates in AdminDashboard.jsx:**
- Added separate "Today's Sales" and "Transactions" cards to match Android layout
- Reduced margin spacing for tighter layout

---

#### Android (Java + OkHttp)

**Problem:** Dashboard Row 2 cards (Today's Sales, Transactions) not showing data correctly.

**Root Cause:** Multiple issues:
1. All API keys were hardcoded throughout `ApiService.java` (23 occurrences)
2. Supabase URLs were hardcoded using `SupabaseClient.getSUPABASE_URL()` (23 occurrences)
3. Sales query used incorrect filter syntax
4. Missing Authorization header on some requests

**Files Modified:**
- `app/src/main/java/com/dtcteam/pypos/AppConfig.java` - Centralized config
- `app/src/main/java/com/dtcteam/pypos/api/ApiService.java` - All API calls

**Changes Made:**
1. **Centralized API Keys:**
   - Replaced all 23 hardcoded API keys: `sb_publishable_8tb4LzD6ZvfIUa04TSQSDA_FsSe7vF5`
   - Now uses: `AppConfig.getSupabaseKey()`

2. **Centralized URLs:**
   - Replaced all 23 instances of `SupabaseClient.getSUPABASE_URL()`
   - Now uses: `AppConfig.getSupabaseUrl()`

3. **Fixed getDashboardStats():**
   - Added Authorization header with Bearer token (fixes RLS issues)
   - Changed sales query from `like.` to range query: `gte.` + `lt.`
   - Query: `created_at=gte.{today}T00:00:00.000Z&created_at=lt.{today}T23:59:59.999Z`

4. **Fixed getSales():**
   - Added Authorization header
   - Uses AppConfig for URL and API key

---

### Summary of Changes by Platform

| Platform | File | Changes |
|----------|------|---------|
| Web | `src/services/supabase.js` | Added getAdminStats(), getUsersStats() to dashboardAPI |
| Web | `src/pages/AdminDashboard.jsx` | Added Today's Sales/Transactions cards, auto-refresh |
| Android | `api/ApiService.java` | Centralized 23 API keys, 23 URLs, fixed queries |
| Android | `AppConfig.java` | Already had centralized config (used by fixes) |

---

### Key Technical Fixes

1. **API Key Centralization:** All hardcoded Supabase keys replaced with `AppConfig.getSupabaseKey()`
2. **URL Centralization:** All hardcoded Supabase URLs replaced with `AppConfig.getSupabaseUrl()`
3. **Authorization Header:** Added Bearer token to fix Row Level Security (RLS) policies
4. **Date Filtering:** Changed from `like.` to range queries (`gte.`/`lt.`) for reliable date filtering
5. **Missing Export:** Added missing functions to correct API object

---

### Testing Notes

- Web Admin Dashboard: Refresh browser to test
- Android: Rebuild APK and install on device/emulator
- Check Logcat for "DASHBOARD" tag to see sales URL being used
