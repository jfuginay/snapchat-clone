# 🚀 The "Nuke and Rebuild" Database Guide

This guide outlines the process for completely resetting your database to resolve the stubborn `pgvector`/`postgis` extension issues. This is our final attempt to fix this without contacting Supabase support.

### ⚠️ Pre-flight Warning
This process is **destructive** and will **permanently delete all user data**. Only proceed if you are ready to start with a completely clean slate.

---

## 📋 The Rebuild Plan

### Step 1: Nuke the Old Schema (5 mins)

1.  **Get the Nuke Script**: Open the file `features/rag/nuke_and_rebuild_prep.sql`. This script has now been updated to handle the permissions error you saw.
2.  **Run in Supabase**: Copy the entire contents and run it in your Supabase SQL Editor.
3.  **Confirmation**: The script should now complete successfully. It will delete all tables and user authentication data, giving us a clean slate.

### Step 2: Fix the Extensions (5 mins)

1.  **Go to Extensions**: In your Supabase Dashboard, navigate to **Database** -> **Extensions**.
2.  **Disable `postgis`**: Find the `postgis` extension. Since we have removed all its dependencies, you should now be able to **disable** it by clicking the toggle.
3.  **Enable `postgis` Correctly**: Immediately after disabling it, enable it again.
    *   In the confirmation pop-up, ensure you select the **`extensions`** schema.
4.  **Verify `pgvector` and `postgis`**: Confirm that both `pgvector` and `postgis` are now listed as "Enabled" and are installed in the `extensions` schema. Your extensions are now perfectly configured.

### Step 3: Rebuild from Scratch (5 mins)

1.  **Get the Master Script**: Open the file `COMPLETE_DATABASE_SETUP.sql`. This file contains the entire schema for your application, including the new RAG feature.
2.  **Run in Supabase**: Copy the entire contents and run it in your Supabase SQL Editor.
3.  **Confirmation**: This script should now run from top to bottom without any errors. It will:
    *   Enable all necessary extensions correctly.
    *   Create all tables (`users`, `location_history`, `local_knowledge`, etc.).
    *   Set up all functions and triggers.

---

## 🎯 Expected Outcome

After completing these three steps, you will have a perfectly clean, fully functional database that is identical to what a new user would get. All legacy data issues will be gone, and all extensions will be correctly configured.

### If It Succeeds...
You are now completely unblocked and can proceed with developing the RAG feature.

### If It Fails...
If you *still* get the `extension "pgvector" is not available` error during Step 3, you have irrefutable proof that the issue is with your Supabase project's provisioning. The only remaining step is to contact Supabase support using the ticket template I provided earlier.

"That's what she said." - Michael Scott 