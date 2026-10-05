# Deploy KSNB Automation to Vercel

## 1. Vercel

Import the GitHub repository into Vercel.

Recommended settings:

- Framework Preset: Other
- Root Directory: `.`
- Build Command: leave empty
- Output Directory: leave empty
- Install Command: leave empty

This repository is a static HTML site protected by login (Routing Middleware + Neon). See HUONG_DAN_DANG_NHAP.md for DATABASE_URL / AUTH_SECRET setup.

- Install Command: leave empty (Vercel runs `npm install` automatically because of package.json)

## 2. Local Auto-Sync

`live_sync_server.py` remains a local-only helper. It listens on `127.0.0.1:8765` and writes edited HTML back to the local repository.

Run it on the Windows machine where the repository exists:

```bat
python live_sync_server.py
```

or use `BAT_TU_DONG_LUU.bat` after updating its `cd /d` path to the actual repository directory.

## 3. Important limitation

The Vercel website cannot write files to the visitor's computer. Therefore:

- Online users can view the site normally.
- The inline editor can still be used, but without the local sync server it falls back to downloading the edited HTML.
- Local editing + auto-save requires opening the site from the local repository and running `live_sync_server.py`, or using the local server directly.

## 4. Git workflow

After local edits are saved into the repository:

```bash
git add .
git commit -m "Update KSNB documents"
git push
```

Vercel will automatically redeploy the pushed commit when the GitHub repository is connected to the Vercel project.
