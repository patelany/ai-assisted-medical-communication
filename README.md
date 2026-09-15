# ClarityAI — Medical Communication Platform

A full-stack clinical platform that integrates with Epic EHR via FHIR R4 to transform patient data into plain-language family updates, delivered securely through a 6-digit access code system.

Built as an independent research project to study how AI-simplified medical communication affects family understanding and anxiety — and as a prototype for a hospital-deployable communication tool designed for all clinical staff including physicians, RNs, PAs, and NPs.

**Live:** https://ai-assisted-medical-communication.vercel.app

---

## Motivation

When a loved one is hospitalized, the immediate family is often too overwhelmed to keep friends and extended family informed. Those waiting for news can go hours without an update — not because nothing is happening, but because the people who know are too focused on being present.

ClarityAI removes the communication burden from the care team entirely. A clinician searches for a patient, reviews an auto-filled update form pulled from Epic, clicks Generate, and the family receives a plain-language update instantly — no phone calls, no repeated explanations, no miscommunication.

---

## Research Question

> How does AI-simplified medical communication affect family understanding, trust, and emotional response compared to raw clinical language?

### Hypothesis
Hybrid messages — plain English with key clinical values preserved — will produce the highest understanding scores and lowest anxiety scores across both medical and non-medical family members.

---

## System Architecture

```
Clinician opens ClarityAI → authenticates with Touch ID or email/password
     ↓
Connects to Epic EHR via OAuth 2.0 + PKCE
     ↓
Searches patient by name or MRN
     ↓
Epic FHIR R4 pulls patient data (8 parallel calls):
  Patient demographics · Vitals · Labs · Conditions
  Clinical notes · Orders · Emergency contact · Encounter
     ↓
Clinician reviews auto-filled form — or enters notes manually
     ↓
Clicks Generate
     ↓
Layer 1: AWS Comprehend Medical — PHI detection & redaction
Layer 2: Claude — secondary PHI pass + message transformation
     ↓
Three message versions generated:
  • Raw Clinical      — precise medical language, de-identified
  • Hybrid            — plain English with clinical values preserved
  • AI + Context      — warm, fully plain language, no jargon
     ↓
Hybrid version posted to family viewer (Supabase)
Family notified via SMS (Twilio) — consent required
     ↓
Family accesses updates via 6-digit code at /view
AI chat assistant available for follow-up questions
```

---

## Key Features

### Clinical Layer
- **Epic FHIR R4 integration** — patient search by name or MRN, 8 parallel FHIR data pulls
- **EHR-agnostic architecture** — built to support Epic, Cerner, athenahealth, MEDITECH via FHIR R4
- **Patient-first workflow** — form locked until patient is confirmed in EHR
- **Three-step patient selection** — search → results list → auto-fill or manual entry
- **Edit and delete updates** — clinicians can correct mistakes after generating
- **Two-layer HIPAA de-identification pipeline:**
  - AWS Comprehend Medical (primary — trained on clinical text)
  - Claude secondary pass (relative dates, room numbers, implicit identifiers)
  - Medical abbreviation whitelist (ICU, ER, INR, WBC never redacted)
- **Visual HIPAA report** showing exactly what was redacted and why
- Six patient status types: Stable, Improving, Delayed, Under Review, Awaiting Procedure, Critical
- SMS consent checkbox with auto-send on generate
- Update history persists across sessions via Supabase

### Research Layer
- **Self-administered study** at `/study` — fully anonymous, no researcher present
- **Latin square design** — each participant sees all 3 scenarios but only one message version per scenario, rotating across participants to eliminate order bias
- **AI PM research methods** — measures trust calibration, hallucination tolerance, action tendency, perceived completeness, reassurance, and AI disclosure effect
- **Two-path study flow** — medical professionals test the clinician view, non-medical participants test the family viewer
- **Demographics** — age range, medical background, prior hospitalization experience, communication experience
- **Supabase database** — study responses persist permanently
- **Research dashboard** — bar charts comparing scores across message types
- **Group breakdowns** — by medical background, age range, prior hospitalization
- **CSV export** for statistical analysis
- **WebAuthn biometric authentication** protecting the dashboard
- **Device deduplication** — localStorage flag prevents double submission

### Family Layer
- **6-digit access code** per patient session, persists in localStorage for 7 days
- **Brute force protection** — 10 attempt limit, 15-minute lockout with countdown timer
- **Split 6-digit input** — individual boxes, auto-advance, paste support
- **Live update feed** — polls every 3 seconds, no refresh needed
- **Dark slate Clinical Reference panel** — highlights clinical values (INR 2.8, WBC 8.2)
- **AI chat assistant** — pulsing attention prompt, context-aware, guardrailed
- **Standalone `/view` route** — families never see the clinician interface
- Session persistence — access code remembered across visits

### Security Layer
- Rate limiting on all API routes (in-memory, IP-based)
- CSRF protection via origin validation on all POST routes
- Input sanitization against prompt injection
- Cryptographically secure access codes (`crypto.getRandomValues`)
- 8-hour session expiry for clinician authentication
- bcrypt password hashing (`RESEARCHER_PASSWORD_HASH`)
- Supabase RLS enabled with service_role policies
- Audit logging to Supabase `audit_logs` table
- httpOnly cookies for Epic OAuth token storage
- API keys server-side only — never exposed to the browser

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| EHR Integration | Epic FHIR R4 (OAuth 2.0 + PKCE) |
| AI — Message Transformation | Anthropic Claude (claude-sonnet-4-6) |
| AI — PHI Detection (Primary) | AWS Comprehend Medical |
| AI — PHI Detection (Secondary) | Claude prompt-based |
| AI — Chat Assistant | Anthropic Claude |
| Study Database | Supabase (PostgreSQL) |
| SMS Delivery | Twilio |
| Authentication | WebAuthn (biometric) + bcrypt password |
| Deployment | Vercel |

---

## Epic FHIR Integration

ClarityAI integrates with Epic via the FHIR R4 standard using OAuth 2.0 authorization_code flow with PKCE.

**Registered APIs:**
- Patient.Read / Search (Demographics)
- Observation.Read / Search (Labs, Vital Signs)
- Condition.Read / Search (Encounter Diagnosis, Problems)
- DocumentReference.Read / Search (Clinical Notes)
- ServiceRequest.Read / Search (Orders)
- RelatedPerson.Read / Search (Emergency contacts)
- Encounter.Read / Search (Patient Chart)
- MedicationRequest.Read / Search (Signed Medication Order)

**EHR-agnostic vision:** Cerner, athenahealth, and MEDITECH integrations planned — all FHIR R4 compliant. The clinician sees a branded EHR selector (Epic in red, others coming soon) on login.

**Path to production:** Epic App Orchard application → first hospital pilot (free) → convert to paid.

---

## Research Study

**Access the study:** https://ai-assisted-medical-communication.vercel.app/study

**Study code:** `CLARITY2026`

**Design:**
- **Independent Variable:** Message type (Raw Clinical / Hybrid / AI + Context)
- **Dependent Variables:** Understanding (1–5), Anxiety (1–5), Trust (1–5), Reassurance (1–5), Perceived Completeness (1–5), Action Tendency (1–5)
- **AI PM Variables:** AI disclosure effect, decision trust, trust decay response
- **Usability Variables:** Ease of use, would want this, open feedback, comparison to current experience
- **Design:** Latin square — within-subjects across scenarios, between-subjects across versions
- **Participants:** 20–30 volunteers
- **Randomization** — scenario order and version assignment randomized per participant
- **Label blinding** — versions shown as A/B/C, not Raw/Hybrid/Context
- **Debrief** — AI-generated nature revealed after all ratings submitted
- **Anonymous** — random participant IDs, no PII collected

**All scenarios are fictional — no real patient data used at any stage.**

---

## Local Setup

### Prerequisites
- Node.js 18+
- Anthropic API key
- AWS account with Comprehend Medical access
- Twilio account
- Supabase project
- Epic developer account (fhir.epic.com)

### Environment Variables

```
ANTHROPIC_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_MESSAGING_SERVICE_SID=
RESEARCHER_USERNAME=
RESEARCHER_PASSWORD_HASH=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EPIC_CLIENT_ID=
EPIC_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=
```

### Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
app/
  page.tsx                      # Main app — tabs, state, patient session
  view/page.tsx                 # Standalone family viewer
  study/page.tsx                # Self-administered research study
  api/
    generate/route.ts           # Two-layer HIPAA pipeline + Claude transformation
    viewer/route.ts             # Supabase update storage and retrieval
    viewer/[id]/route.ts        # Edit and delete individual updates
    sms/route.ts                # Twilio SMS delivery
    auth/route.ts               # Researcher credential validation
    chat/route.ts               # AI chat assistant
    study/route.ts              # Supabase study response storage
    clinician/
      register/route.ts         # Clinician account registration (bcrypt)
      login/route.ts            # Clinician authentication
    epic/
      connect/route.ts          # Epic OAuth2 + PKCE redirect
      callback/route.ts         # Epic OAuth2 callback, token → httpOnly cookie
      patient/route.ts          # Patient search + 8-parallel FHIR data fetch
components/
  ClinicianPanel.tsx            # Patient-first flow: Epic search → form
  ClinicianAuth.tsx             # WebAuthn Touch ID + email/password registration
  EpicPatientSearch.tsx         # EHR selector + three-step patient search
  FamilyViewer.tsx              # Family feed + brute force protection + clinical panel
  FamilyChat.tsx                # Floating AI chat assistant with attention prompt
  Dashboard.tsx                 # Supabase study data, bar charts, group breakdowns
  ResearcherAuth.tsx            # Researcher dashboard authentication
  StudyFlow.tsx                 # Full self-administered study (Latin square design)
lib/
  rateLimit.ts                  # In-memory IP-based rate limiter
  csrf.ts                       # Origin validation CSRF protection
  auditLog.ts                   # Supabase audit logging
public/
  epic-public-key.json          # JWK Set non-production
  epic-public-key-prod.json     # JWK Set production
  privacy.html                  # Privacy policy (Twilio compliance)
  terms.html                    # Terms of service (Twilio compliance)
```

---

## Security & Ethics

**De-identification:** All clinical input passes through a two-layer PHI detection pipeline before message transformation. AWS Comprehend Medical handles primary detection. Claude performs a secondary pass for relative dates and implicit identifiers. A medical abbreviation whitelist prevents false positives on terms like ICU, ER, INR, and WBC.

**Research ethics:**
- All scenarios are fictional — no real patient data used
- Participants informed of AI-generated nature after rating (debrief)
- No PII collected — random participant IDs only
- Data stored in Supabase, exportable as anonymous CSV
- Device-level deduplication prevents double submission

**AI guardrails:** The family chat assistant is explicitly instructed to never provide medical advice, never assess severity, and always redirect clinical questions to the care team.

**Authentication:** Clinician accounts stored in Supabase with bcrypt-hashed passwords. Dashboard protected by WebAuthn biometric authentication. Biometric data never leaves the device — authentication uses a challenge-response cryptographic protocol via the device's Secure Enclave.

**Limitations:**
- Epic integration currently in sandbox — production requires App Orchard approval
- Study sample size of 20–30 limits statistical generalizability
- In-memory rate limiting resets on server restart — production would use Redis

---

## Future Work

- Epic App Orchard approval for hospital deployment
- SMART on FHIR launch handler for embedded Epic workflow
- Cerner, athenahealth, MEDITECH OAuth integrations
- Patient session persistence (one permanent code per patient)
- Phone verification for study participants (Twilio)
- Social health journey feed — private post-discharge updates for ongoing treatment
- Stripe payments for hospital subscription billing
- IRB approval for formal clinical research publication
- Multi-department support with role-based access

---

## Author

Built by Anyssa Patel as an independent research project.

Background: Frontend software developer at TSPi, neuroscience undergraduate, coding bootcamp graduate. ClarityAI represents the intersection of clinical domain knowledge, full-stack engineering, applied AI research, and AI product management methodology.