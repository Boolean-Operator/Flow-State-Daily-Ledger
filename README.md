# Flow-State Daily Ledger

Flow-State Daily Ledger is a local-first, mobile-oriented planning application
for daily Work and Personal tasks, scrum-standup preparation, projects, and
Back Burner work.

## Getting Started

Install dependencies, create the local ledger file if it does not already
exist, and run the development server:

```bash
npm install
test -e dummy-data.json || cp data/example-ledger.json dummy-data.json
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local ledger data

`dummy-data.json` is the active local ledger. It is deliberately ignored by Git
because it may contain personal and machine-specific beta activity. Do not add
it to commits.

`data/example-ledger.json` is the committed, sanitized starting fixture. It
contains the required schema and no personal tasks. Copy it only when creating a
new local ledger; do not overwrite an existing `dummy-data.json` unless you
intend to reset local data.

### Back up

With application writes stopped, copy the local ledger into the ignored backup
directory:

```bash
mkdir -p local-backups
cp dummy-data.json "local-backups/dummy-data-$(date +%Y%m%d-%H%M%S).json"
```

Store important backups somewhere outside the repository as well. Git and
GitHub do not back up `dummy-data.json`.

### Restore

Stop the development server, preserve the current file if necessary, and copy a
chosen backup into place:

```bash
cp local-backups/<backup-file>.json dummy-data.json
npm run dev
```

The application validates the restored file against the current runtime schema
when it reads it.

## Project guidance

- `AGENTS.md` contains durable repository instructions.
- `PLANS.md` contains the current roadmap and project status.
- `docs/` contains the detailed product and workflow specifications.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

The JSON store is intended for local beta validation. Hosted deployment and
multi-device synchronization remain later roadmap work.
