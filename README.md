# ClarityAI — Medical Communication Platform

A full-stack clinical platform that integrates with Epic EHR via FHIR R4 to transform patient data into plain-language family updates, delivered securely through a 6-digit access code system.

Built as an independent research project to study how AI-simplified medical communication affects family understanding and anxiety — and as a prototype for a hospital-deployable communication tool designed for all clinical staff including physicians, RNs, PAs, and NPs.

**Live:** https://ai-assisted-medical-communication.vercel.app
**Study:** https://ai-assisted-medical-communication.vercel.app/study

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
- **Patient-first workflow** — form locked until patient is confirmed
- **Manual entry fallback** — title-case name formatting, MRN as identifier
- **Edit and delete updates** — clinicians can correct mistakes after generating
- **Two-layer HIPAA de-identification pipeline:**
  - AWS Comprehend Medical (primary — trained on clinical text)
  - Claude secondary pass (relative dates, room numbers, implicit identifiers)
  - Medical abbreviation whitelist (ICU, ER, INR, WBC never redacted)
- **Visual HIPAA report** showing exactly what was redacted and why
- Six patient status types: Stable, Improving, Delayed, Under Review, Awaiting Procedure, Critical
- SMS consent checkbox with phone number auto-formatting
- Update history persists across sessions via Supabase
- Patient session persistence — refresh restores current patient
- Clinician authentication — bcrypt passwords + WebAuthn Touch ID

### Research Layer
- **Self-administered study** at `/study` — fully anonymous, no researcher present
- **Email-based deduplication** — SHA-256 hash stored, not the email itself
- **Session resumption** — participants can re-enter email to resume where they left off
- **Latin square design** — each participant sees all 3 scenarios but only one message version per scenario, rotating across participants to eliminate order bias
- **Two-path study flow:**
  - Medical professionals experience the clinician view (form → HIPAA report → family viewer)
  - Non-medical participants experience the family viewer directly
- **AI PM research methods** — measures trust calibration, hallucination tolerance, action tendency, perceived completeness, reassurance, and AI disclosure effect
- **Step progress bar** — participants see where they are in the flow
- **Pre-generation** — all 3 scenarios generated in parallel before study begins, eliminating mid-study loading
- **Demographics** — age range, medical background, prior hospitalization, communication experience
- **Supabase persistence** — study responses and sessions stored permanently
- **Research dashboard** — bar charts comparing scores across message types
- **CSV export** for statistical analysis
- **WebAuthn biometric authentication** protecting the dashboard

### Family Layer
- **6-digit access code** per patient session
- **Brute force protection** — 10 attempt limit, 15-minute lockout
- **Split 6-digit input** — individual boxes, auto-advance, paste support
- **Live update feed** — polls every 3 seconds
- **Dark slate Clinical Reference panel** — highlights clinical values
- **AI chat assistant** — attention-catching prompt, context-aware, guardrailed against inappropriate content
- **Standalone `/view` route** — families never see the clinician interface
- Session persistence — access code remembered across visits

### Security Layer
- Rate limiting on all API routes (in-memory, IP-based)
- CSRF protection via origin validation
- Input sanitization against prompt injection
- Cryptographically secure access codes
- 8-hour session expiry for clinician authentication
- bcrypt password hashing
- Supabase RLS with service_role policies
- Audit logging to Supabase `audit_logs` table
- httpOnly cookies for Epic OAuth token storage
- API keys server-side only

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
| Database | Supabase (PostgreSQL) |
| SMS Delivery | Twilio |
| Authentication | WebAuthn (biometric) + bcrypt |
| Deployment | Vercel |

---

## Epic FHIR Integration

ClarityAI integrates with Epic via the FHIR R4 standard using OAuth 2.0 authorization_code flow with PKCE.

**Registered APIs:** Patient, Observation, Condition, DocumentReference, ServiceRequest, RelatedPerson, Encounter, MedicationRequest

**EHR-agnostic vision:** Cerner, athenahealth, and MEDITECH integrations planned — all FHIR R4 compliant.

**Path to production:** Epic App Orchard application → first hospital pilot (free) → convert to paid.

---

## Research Study

**Access the study:** https://ai-assisted-medical-communication.vercel.app/study

**Design:**
- **Independent Variable:** Message type (Raw Clinical / Hybrid / AI + Context)
- **Dependent Variables:** Understanding, Anxiety, Trust, Reassurance, Perceived Completeness, Action Tendency (all 1–5)
- **AI PM Variables:** AI disclosure effect, decision trust, trust decay response
- **Usability Variables:** Ease of use, would want this, open feedback, comparison to current experience
- **Design:** Latin square — within-subjects across scenarios, between-subjects across versions
- **Two-path flow:** Medical professionals test clinician view; non-medical test family viewer
- **Participants:** 20–30 volunteers
- **Label blinding** — versions shown as A/B/C, not Raw/Hybrid/Context
- **Debrief** — AI-generated nature revealed after all ratings submitted
- **Anonymous** — random participant IDs, SHA-256 email hashes, no PII collected

**All scenarios are fictional — no real patient data used at any stage.**

---

## Business Model

**Free for families — always.**

**Paid by hospitals:** $500–2,000/month per department.

Families are already in crisis. Charging them to receive information about their loved one is ethically indefensible. Hospitals benefit from reduced nursing interruptions, improved patient satisfaction scores, and better family communication — quantifiable value they will pay for.

---

## Local Setup

### Prerequisites
- Node.js 18+
- Anthropic API key
- AWS account with Comprehend Medical access
- Twilio account
- Supabase project
- Epic developer account (fhir.epic.com)
- Resend account (resend.com)

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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EPIC_CLIENT_ID=
EPIC_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=
RESEND_API_KEY=
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
  page.tsx                          # Main app — tabs, state, patient session
  view/page.tsx                     # Standalone family viewer
  study/page.tsx                    # Self-administered research study
  api/
    generate/route.ts               # Two-layer HIPAA pipeline + Claude transformation
    viewer/route.ts                 # Supabase update storage and retrieval
    viewer/[id]/route.ts            # Edit and delete individual updates
    sms/route.ts                    # Twilio SMS delivery
    auth/route.ts                   # Researcher credential validation
    chat/route.ts                   # AI chat assistant
    study/route.ts                  # Study response storage
    study/send-code/route.ts        # Email hash + duplicate prevention
    study/verify-code/route.ts      # Code verification
    study/save-progress/route.ts    # Session progress persistence
    study/get-progress/route.ts     # Session progress retrieval
    clinician/
      register/route.ts             # Clinician account registration
      login/route.ts                # Clinician authentication
    epic/
      connect/route.ts              # Epic OAuth2 + PKCE redirect
      callback/route.ts             # Epic OAuth2 callback
      patient/route.ts              # Patient search + FHIR data fetch
components/
  ClinicianPanel.tsx                # Patient-first flow: Epic search → form
  ClinicianAuth.tsx                 # WebAuthn Touch ID + email/password
  EpicPatientSearch.tsx             # EHR selector + patient search
  FamilyViewer.tsx                  # Family feed + brute force protection
  FamilyChat.tsx                    # Floating AI chat assistant
  Dashboard.tsx                     # Study data, bar charts, exports
  ResearcherAuth.tsx                # Dashboard authentication
  study/
    StudyFlow.tsx                   # Main orchestrator — state and routing
    StudyTypes.ts                   # Shared types and constants
    StudyUtils.ts                   # Shuffle and ID generation
    StudyProgressBar.tsx            # Step progress indicator
    RatingScale.tsx                 # 1–5 rating component
    StudyAccessCode.tsx             # Access code gate
    StudyVerifyEmail.tsx            # Email entry and deduplication
    StudyReturning.tsx              # Returning participant resume
    StudyConsent.tsx                # Informed consent
    StudyDemographics.tsx           # Participant demographics
    StudyPreparing.tsx              # Parallel scenario pre-generation
    ClinicianIntro.tsx              # Clinician path intro
    ClinicianForm.tsx               # Two-panel clinician form
    ClinicianResult.tsx             # HIPAA report + generated update
    ClinicianRating.tsx             # Clinician experience rating
    FamilyIntro.tsx                 # Family path intro
    StudyFamilyViewer.tsx           # Family viewer in study context
    FamilyRating.tsx                # Family experience rating
    StudyScenario.tsx               # Scenario message rating
    StudyPostScenario.tsx           # AI PM research questions
    StudyDebrief.tsx                # Debrief + final submission
    StudyComplete.tsx               # Thank you screen
lib/
  rateLimit.ts                      # In-memory IP-based rate limiter
  csrf.ts                           # Origin validation CSRF protection
  auditLog.ts                       # Supabase audit logging
```

---

## Security & Ethics

**De-identification:** All clinical input passes through a two-layer PHI detection pipeline. AWS Comprehend Medical handles primary detection. Claude performs a secondary pass. A medical abbreviation whitelist prevents false positives.

**Research ethics:**
- All scenarios are fictional — no real patient data used
- Participants informed of AI-generated nature after rating (debrief)
- No PII collected — random participant IDs, SHA-256 email hashes only
- Device-level and server-level deduplication prevents double submission

**AI guardrails:** The family chat assistant is explicitly instructed to never provide medical advice, never assess severity, block off-topic questions, and redirect clinical questions to the care team.

**Limitations:**
- Epic integration currently in sandbox — production requires App Orchard approval
- Study sample size of 20–30 limits statistical generalizability
- In-memory rate limiting resets on server restart

---

## Future Work

- Epic App Orchard approval for hospital deployment
- SMART on FHIR launch handler for embedded Epic workflow
- Cerner, athenahealth, MEDITECH OAuth integrations
- Social health journey feed — private post-discharge updates for ongoing treatment
- Stripe payments for hospital subscription billing
- IRB approval for formal clinical research publication
- Multi-department support with role-based access
- Redis-based rate limiting for production scale

---

## Author

Built by Anyssa Patel as an independent research project.

Background: Frontend software developer at TSPi, neuroscience undergraduate, coding bootcamp graduate. ClarityAI represents the intersection of clinical domain knowledge, full-stack engineering, applied AI research, and AI product management methodology.