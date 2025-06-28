# Supabase Support Ticket: `pgvector` Extension Failure

## 🚀 Subject

Critical Issue: `pgvector` extension is unavailable despite being enabled and listed as available

---

## 📝 Body

Hi Supabase Team,

I'm encountering a critical issue with my database instance that is preventing me from using the `pgvector` extension. I have exhausted all troubleshooting steps and have gathered conclusive evidence that points to a platform-level issue with my project's provisioning.

**Project Ref:** `[Enter Your Project Ref Here - Found in your Supabase project's settings]`

### The Problem

When I run `CREATE EXTENSION vector;` or any script that depends on it, I consistently receive the following error:

```
ERROR: 0A000: extension "pgvector" is not available
DETAIL: Could not open extension control file "/usr/lib/postgresql/share/postgresql/extension/pgvector.control": No such file or directory.
HINT: The extension must first be installed on the system where PostgreSQL is running.
```

### Contradictory Evidence

Here is why this is a platform issue and not a user configuration error:

1.  **UI Confirms It's Enabled**: My dashboard's "Extensions" page clearly shows that `pgvector` is enabled.

2.  **Database Confirms It's Available**: When I run the diagnostic query `SELECT * FROM pg_available_extensions WHERE name = 'vector';`, the database correctly returns one row, confirming that the extension is installed and available on the instance.

This is a direct contradiction. The database reports that the extension is available but then fails to find the control file when trying to activate it. This suggests a file system or permissions issue on the underlying server.

### Troubleshooting Steps Already Taken

We have already tried the following, none of which resolved the issue:
- Enabling the extension via the Supabase dashboard UI.
- Running `CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;`
- Running `CREATE EXTENSION vector;` directly.
- Pausing and restarting the project.
- Checking all role permissions.

### Request

Could you please investigate the health and file system integrity of my database instance? It appears the `pgvector` files are not correctly linked or accessible by the PostgreSQL server, despite the system catalog reporting them as available.

This is a hard blocker for my development. I would appreciate a prompt investigation.

Thank you. 