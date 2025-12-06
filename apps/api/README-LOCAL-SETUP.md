Local setup: API

1) Install Node (LTS) and pnpm

- Install Node.js from https://nodejs.org/ (LTS). That provides `node` and `npm`.
- Install pnpm (recommended for this monorepo):

```powershell
npm i -g pnpm
```

Or enable Corepack (Node >=16.14):

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

2) From the repository root

```powershell
# install workspace deps
pnpm install

# start the API
cd .\apps\api
pnpm dev
```

3) If you cannot use pnpm, install per-package with npm:

```powershell
cd .\apps\api
npm install
npm run dev
```

Notes
- `db:migrate` is a placeholder (`scripts/migrate.js`). Install `pg` and implement the migration logic before running migrations in production.
- Many TypeScript types (`@types/*`) are declared in package.json; run `pnpm install` after Node/pnpm are available to resolve editor errors.
