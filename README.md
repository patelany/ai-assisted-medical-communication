# ClarityAI — Medical Communication Platform

A full-stack clinical platform that integrates with Epic EHR via FHIR R4 to automatically transform patient data into plain-language family updates, delivered securely through a 6-digit access code system.

Built as an independent research project to study how AI-simplified medical communication affects family understanding and anxiety compared to raw clinical language — and as a prototype for a hospital-deployable communication tool.

**Live:** https://ai-assisted-medical-communication.vercel.app

---

## Motivation

When a loved one is hospitalized, the immediate family is often too overwhelmed to keep friends and extended family informed. Those waiting for news can go hours without an update — not because nothing is happening, but because the people who know are too focused on being present.

ClarityAI removes the communication burden from the care team entirely. A clinician searches for a patient, reviews an auto-filled update form pulled from Epic, clicks Generate, and the family receives a plain-language update instantly — no phone calls, no repeated explanations, no miscommunication.

---

## Research Question

> How does AI-simplified medical communication affect family understanding and emotional response compared to raw clinical language?

### Hypothesis
Hybrid messages — plain English with key clinical values preserved — will produce the highest understanding scores and lowest anxiety scores across both medical and non-medical family members.

---

## System Architecture

```
Doctor opens ClarityAI
     ↓
Searches patient by name or MRN
     ↓
Epic FHIR R4 API pulls patient data (8 parallel calls):
  Patient demographics · Vitals · Labs · Conditions
  Clinical notes · Orders · Emergency contact · Encounter
     ↓
Doctor chooses: Auto-fill from Epic OR Enter manually
     ↓
Reviews and edits clinical form
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
Hybrid version posted to family viewer automatically
     ↓
Family accesses updates via 6-digit code at /view
     ↓
AI chat assistant available for follow-up questions
```

---

## Key Features

### Clinical Layer
- **Epic FHIR R4 integration** — patient search by name or MRN, 8 parallel data pulls
- **Patient-first workflow** — form locked until patient is confirmed in Epic
- **Three-step patient selection** — search → results list → auto-fill or manual entry
- **Two-layer HIPAA de-identification pipeline:**
  - AWS Comprehend Medical (primary — trained on clinical text)
  - Claude secondary pass (catches relative dates, room numbers, implicit identifiers)
  - Medical abbreviation whitelist (ICU, ER, INR, WBC, etc. never redacted)
- **Visual HIPAA report** showing exactly what was redacted and why
- Six patient status types: Stable, Improving, Delayed, Under Review, Awaiting Procedure, Critical

### Research Layer
- **Self-administered study** at `/study` — fully anonymous, no researcher present
- **Three-step demographics** — age range, medical background, prior hospitalization experience
- **3 randomized scenarios** per participant from 4 pre-built clinical situations
- **Randomized message order** per scenario — labeled A/B/C to prevent label bias
- **Supabase database** — study responses persist permanently, never lost on server restart
- **Research dashboard** — bar charts comparing understanding and anxiety across message types
- **Group breakdowns** — by medical background, age range, prior hospitalization experience
- **CSV export** for statistical analysis
- **WebAuthn biometric authentication** (Touch ID) protecting the dashboard

### Family Layer
- **6-digit access code** per patient session, persistent in localStorage
- **Web SMS opt-in form** — Twilio compliant, consent checkbox not pre-selected
- **Live update feed** — polls every 10 seconds, no refresh needed
- **Dark slate Clinical Reference panel** — highlights clinical values (INR 2.8, WBC 8.2)
- **AI chat assistant** — context-aware, guardrailed against medical advice
- **Standalone `/view` route** — families never see the doctor interface

### Security Layer
- API keys server-side only — never exposed to the browser
- AWS IAM user scoped to minimum permissions (ComprehendMedical only)
- WebAuthn biometric auth for researcher dashboard
- Password fallback with server-side validation
- Biometric registration gated behind password
- `.env.local` excluded from version control

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| EHR Integration | Epic FHIR R4 (JWT RS384 auth) |
| AI — Message Transformation | Anthropic Claude (claude-sonnet-4-6) |
| AI — PHI Detection (Primary) | AWS Comprehend Medical |
| AI — PHI Detection (Secondary) | Claude prompt-based |
| AI — Chat Assistant | Anthropic Claude |
| Study Database | Supabase (PostgreSQL) |
| SMS Delivery | Twilio |
| Authentication | WebAuthn (biometric) + server-side password |
| Deployment | Vercel |

---

## Epic FHIR Integration

ClarityAI integrates with Epic via the FHIR R4 standard using JWT RS384 backend authentication.

**Registered APIs:**
- Patient.Read / Search (Demographics)
- Observation.Read / Search (Labs, Vital Signs, Assessments, Labor & Delivery, OB/GYN, Social History, Outside Record Results, DICOM Image Characteristics)
- Condition.Read / Search (Encounter Diagnosis, Problems, Infection, Care Plan Problem, Health Concerns)
- DocumentReference.Read / Search (Clinical Notes)
- ServiceRequest.Read / Search (Orders)
- RelatedPerson.Read / Search (Friends and Family — emergency contacts)
- Encounter.Read / Search (Patient Chart)
- MedicationRequest.Read / Search (Signed Medication Order)

**Patient data pull:** 8 parallel `Promise.all()` calls building suggestedStatus, suggestedAction, suggestedReason, emergency contact, vitals, labs, conditions, and orders.

**Test patient:** Camila Lopez (Epic sandbox)

**Path to production:** Epic App Orchard application → first hospital pilot (free) → convert to paid.

---

## Research Study

**Access the study:** https://ai-assisted-medical-communication.vercel.app/study

**Study code:** `CLARITY2026`

**Design:**
- **Independent Variable:** Message type (Raw Clinical / Hybrid / AI + Context)
- **Dependent Variables:** Understanding score (1–5 Likert), Anxiety score (1–5 Likert), Qualitative notes
- **Moderating Variables:** Medical background, age range, prior hospitalization experience
- **Participants:** 20–30 volunteers
- **Within-subjects design** — each participant rates all three versions per scenario
- **Randomization** — scenario order and message order randomized per participant
- **Label blinding** — versions shown as Message A/B/C, not Raw/Hybrid/Context
- **Debrief** — AI-generated nature revealed after all ratings submitted
- **Anonymous** — random participant IDs, no PII collected

**All scenarios are fictional — no real patient data used at any stage.**

---

## Business Model

**Free for families — always.**

**Paid by hospitals:** $500–2,000/month per department.

Rationale: Families are already in crisis. Charging them to receive information about their loved one is ethically indefensible. Hospitals benefit from reduced nursing interruptions, improved patient satisfaction scores, and better family communication — quantifiable value they will pay for.

**Go-to-market path:**
1. Run research study → collect data proving communication improvement
2. Use data to pitch hospital pilot (free, 3 months)
3. Convert pilot to paid after proving value
4. Apply to Epic App Orchard for embedded workflow integration

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
RESEARCHER_PASSWORD=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EPIC_CLIENT_ID=
EPIC_PRIVATE_KEY=
EPIC_CLIENT_SECRET=
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
  page.tsx                    # Main app — tabs, state, patient session
  view/page.tsx               # Standalone family viewer page
  study/page.tsx              # Self-administered research study
  api/
    generate/route.ts         # Two-layer HIPAA pipeline + Claude transformation
    viewer/route.ts           # File-based update storage (.updates.json)
    sms/route.ts              # Twilio SMS delivery
    auth/route.ts             # Researcher credential validation
    chat/route.ts             # AI chat assistant
    study/route.ts            # Supabase study response storage
    epic/
      auth/route.ts           # Epic JWT RS384 authentication
      patient/route.ts        # Epic FHIR patient search + 8-parallel data fetch
components/
  DoctorPanel.tsx             # Patient-first flow: Epic search → form
  EpicPatientSearch.tsx       # Three-step patient search with results list
  MessageCards.tsx            # Research study rating cards
  FamilyViewer.tsx            # Family feed + SMS opt-in + clinical reference panel
  FamilyChat.tsx              # Floating AI chat assistant
  Dashboard.tsx               # Supabase study data, bar charts, group breakdowns
  ResearcherAuth.tsx          # WebAuthn Touch ID + password fallback
  StudyFlow.tsx               # Full self-administered study (6 steps)
lib/
  anthropic.ts                # Anthropic client singleton
public/
  epic-public-key.json        # JWK Set for Epic JWT verification (non-production)
  epic-public-key-prod.json   # JWK Set for Epic JWT verification (production)
  privacy.html                # Privacy policy (Twilio compliance)
  terms.html                  # Terms of service (Twilio compliance)
```

---

## Security & Ethics

**De-identification:** All clinical input passes through a two-layer PHI detection pipeline before message transformation. AWS Comprehend Medical handles primary detection. Claude performs a secondary pass for relative dates and implicit identifiers. A medical abbreviation whitelist prevents false positives on terms like ICU, ER, INR, and WBC.

**Research ethics:**
- All scenarios are fictional — no real patient data used
- Participants informed of AI-generated nature after rating (debrief)
- No PII collected — random participant IDs only
- Data stored in Supabase, exportable as anonymous CSV

**AI guardrails:** The family chat assistant is explicitly instructed to never provide medical advice, never assess severity, and always redirect clinical questions to the care team.

**Authentication:** Dashboard protected by WebAuthn biometric authentication. Biometric data never leaves the device — authentication uses a challenge-response cryptographic protocol via the device's Secure Enclave.

**Limitations:**
- Updates stored file-based in development — production would use encrypted persistent database
- Access code system does not implement rate limiting on failed attempts
- Relative temporal references may not be caught by Comprehend Medical
- Epic integration currently in sandbox — production requires App Orchard approval
- Study sample size of 20–30 limits statistical generalizability

---

## Future Work

- Epic App Orchard approval for hospital deployment
- SMART on FHIR launch handler for embedded Epic workflow
- Patient session persistence in Supabase (one permanent code per patient)
- Rate limiting on access code entry attempts
- SMS notification on each new update (not just initial code delivery)
- IRB approval for formal clinical research publication
- Stripe payments for hospital subscription billing
- Multi-department support with role-based access

---

## Author

Built by Anyssa Patel as an independent research project.

Background: Frontend software developer at TSPi, neuroscience undergraduate, coding bootcamp graduate. ClarityAI represents the intersection of clinical domain knowledge, full-stack engineering, and applied AI research.