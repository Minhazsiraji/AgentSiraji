# AgentSiraji Business OS — n8n Self-Hosted Foundation

**Status: deployment-ready source, NOT a live n8n service.** This directory has no integration with the existing website deployment. The compose stack is for a *separate VM*, not Vercel. It must not touch 2-Taka-R-Bazar, existing CRM production data, or office equipment.

## Architecture
Oracle OCI Always Free ARM Ubuntu VM (if available) -> Caddy HTTPS -> n8n -> Postgres (n8n metadata + isolated `business_os` schema); separate runner. Current stage has NO OAuth credentials, AI paid API keys, automatic messaging, ad purchases, or social publishing.

## Provisioning prerequisites (requires the account owner)
1. Create/sign in to OCI Free Tier at https://www.oracle.com/cloud/free/ . Select **Always Free eligible** Ampere A1 VM in the home region, ideally 2 OCPU and 6 GB RAM within free quota. Availability is not guaranteed. Never select paid resources.
2. Use Ubuntu 24.04 ARM image and a persistent boot volume within free allowances. Add an SSH public key that YOU control. Do not use your work laptop as the always-on server.
3. OCI security list and VM firewall: allow TCP 443 and 80 inbound; restrict SSH 22 to a known trusted address or suitable secure access solution. Do NOT open Postgres 5432, n8n 5678 or runners broker 5679.
4. Create a DNS `A` record for a subdomain you own (e.g. `automation.yourdomain.com`) pointing to VM public IPv4. Confirm DNS propagation.
5. Install Docker Engine + Compose plugin on your own cloud VM using Docker's official Ubuntu installation instructions: https://docs.docker.com/engine/install/ubuntu/ . The VM admin permission does not require Windows laptop admin access.
6. Clone this repository onto the VM, check out `feat/agent-business-os-n8n-foundation`, and cd to `automation/n8n`. Never commit real secrets to Git.

## Start commands (on the cloud VM)
```bash
cp .env.example .env
chmod 600 .env
# Edit .env on the VM. Use three different cryptographically random secrets,
# at least 40 characters each (e.g. 'openssl rand -hex 32').
bash scripts/preflight.sh
docker compose --env-file .env pull
docker compose --env-file .env up -d
docker compose --env-file .env ps
curl -fsSI https://YOUR_N8N_DOMAIN/
```
Set up the first n8n owner account through HTTPS, use a unique password, enable 2FA if available, and register the free Community edition if desired. Import `workflows/01_manual_prospect_quality_review.json` via the editor. It is an **inactive dry-run** containing explicitly fictional companies and will never contact anyone.

## Qualification before marking live
- [ ] OCI VM public IP reachable; domain resolves to it; TLS valid.
- [ ] `docker compose ps` healthy/running; no public DB or runner ports.
- [ ] n8n owner account protected; 2FA confirmed.
- [ ] Manual example scores compute correctly; no outbound messages sent.
- [ ] Database persistence survives restart; PostgreSQL initialization schema exists.
- [ ] Backup script works and encrypted off-site backup + restore test completed.
- [ ] Error alerts established; quota usage and security audit checked.
- [ ] API credentials authorized by account owner and stored only in n8n encrypted credentials.
- [ ] Real-world leads have public evidence, deduplication, do-not-contact checks and human approval.
- [ ] Any future Meta/YouTube integration uses authorized platform access and rate limits.

## Learning architecture
Record prospect evidence, human review (`business_os.decisions`) and measured outcomes (`business_os.outcomes`); compare outcomes against scored expectations weekly. Version brand rules and scoring revisions. **No self-modifying production code, unsupervised cold messaging, or auto-posting.** Store minimal personal data and enforce retention/deletion procedures before adding real contacts.

## Backups and upgrades
`bash scripts/backup.sh` creates a restricted local Postgres dump. Transfer to a secure separate destination; a dump stored solely on the VM is NOT a resilient backup. Back up the n8n_data volume for files and retain the N8N_ENCRYPTION_KEY securely and separately or encrypted credentials cannot be recovered. Test restore on a non-production VM. Verify official release notes before updating pinned image versions; back up first.

## Existing reusable investment
`Minhazsiraji/AgentSiraji-LeadPilot` already supports deterministic scoring, approval-based replies and follow-ups for configured businesses. Plan a signed authenticated adapter rather than duplicate a CRM or copy production customer data.

## Blocker as of 19 Oct 2026
No OCI VM/account management connector is authorized in ChatGPT. Connected DigitalOcean account had 0 droplets. Without an owner-provisioned free VM + DNS, **there is no live n8n URL and no live automation**. Source preparation is not production deployment.
