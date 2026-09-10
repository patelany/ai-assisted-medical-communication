# AI-Assisted Medical Communication Simplification & Family Update Platform

A full-stack research platform that uses AI to transform complex clinical language into plain-language patient updates, delivered automatically to family members via a secure access code system.

Built as an independent research project to study how AI-simplified medical communication affects family understanding and anxiety compared to raw clinical language.

---

## Motivation

When a loved one is hospitalized, the immediate family is often too overwhelmed to keep friends and extended family informed. Those waiting for news can go hours — or an entire day — without an update, not because nothing is happening, but because the people who know are too focused on being present.

This project was born from that experience. It aims to remove the communication burden from immediate family entirely, while ensuring that everyone who cares receives clear, reassuring updates automatically.

---

## Research Question

> How does AI-simplified medical communication affect user understanding and emotional response compared to raw clinical language?

### Hypothesis
AI-simplified and context-enhanced updates will increase comprehension and reduce anxiety compared to unmodified clinical language, with hybrid versions serving both medical and non-medical audiences most effectively.

---

## System Architecture

```
Doctor Input
     ↓
Layer 1: AWS Comprehend Medical — PHI detection & redaction
     ↓
Layer 2: Claude (claude-sonnet-4-6) — secondary PHI check + message transformation
     ↓
Three message versions generated:
  • Raw Clinical      — precise medical language, de-identified
  • Hybrid            — plain English with clinical values preserved (e.g. INR 2.8)
  • AI + Context      — warm, fully plain language, no jargon
     ↓
Updates stored → Family viewer polls every 10 seconds
     ↓
Family members access via 6-digit code (delivered via Twilio SMS)
     ↓
AI chat assistant available for follow-up questions
```

---

## Key Features

### Clinical Layer
- Structured doctor input — status, planned action, change in plan, clinical reason
- **Two-layer HIPAA de-identification pipeline**
  - AWS Comprehend Medical (primary — trained specifically on clinical text)
  - Claude secondary pass (catches relative dates, room numbers, implicit identifiers)
- Visual HIPAA report showing exactly what was redacted and why
- Six patient status types: Stable, Improving, Delayed, Under Review, Awaiting Procedure, Critical

### Research Layer
- Three message versions per scenario for side-by-side comparison
- Per-version ratings: Understanding (1–5) and Anxiety (1–5)
- Qualitative free-text notes per version
- Participant ID (auto-generated) and type (Medical / Non-Medical)
- Form validation with inline red-outline error indicators
- Dashboard with live bar charts comparing average scores across versions
- CSV export for statistical analysis

### Family Layer
- 6-digit access code generated per patient session, stored in localStorage
- Twilio SMS delivery — one text sent once, family never needs to be texted again
- Live update feed polling every 10 seconds — no refresh needed
- Expandable clinical details clipboard for medically-trained family members
- AI chat assistant (Claude) for follow-up questions about updates
  - Context-aware — knows the most recent update
  - Guardrailed — never gives medical advice, always redirects clinical questions to care team

### Security Layer
- API keys never exposed client-side — all AI calls routed through Next.js server API routes
- AWS Comprehend Medical IAM user scoped to minimum required permissions (principle of least privilege)
- Researcher dashboard protected by WebAuthn biometric authentication (Touch ID)
- Password fallback with server-side credential validation
- Biometric registration gated behind password — prevents unauthorized credential enrollment
- `.env.local` excluded from version control via `.gitignore`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI — Message Transformation | Anthropic Claude (claude-sonnet-4-6) |
| AI — PHI Detection (Primary) | AWS Comprehend Medical |
| AI — PHI Detection (Secondary) | Claude prompt-based |
| AI — Chat Assistant | Anthropic Claude |
| SMS Delivery | Twilio |
| Authentication | WebAuthn (biometric) + server-side password |
| Deployment | Vercel |

---

## Experiment Design

**Independent Variable:** Message type (Raw Clinical / Hybrid / AI + Context)

**Dependent Variables:**
- Understanding score (1–5 Likert scale)
- Anxiety score (1–5 Likert scale)
- Qualitative interpretation (free text)

**Moderating Variable:** Participant type (Medical Professional / Non-Medical)

**Participants:** 15–30 volunteers across medical and non-medical backgrounds

**Procedure:**
1. Researcher fills in clinical scenario on Doctor View
2. Participant rates all three message versions on understanding and anxiety
3. Participant adds qualitative notes on what was clear or unclear
4. After rating, participant is told versions were AI-generated and asked for their reaction
5. Data exported as CSV for statistical analysis

**Fictional scenarios only — no real patient data used at any stage.**

---

## Local Setup

### Prerequisites
- Node.js 18+
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))
- AWS account with Comprehend Medical access
- Twilio account with a phone number

### Environment Variables

Create a `.env.local` file in the project root:

```
ANTHROPIC_API_KEY=your-key-here
AWS_ACCESS_KEY_ID=your-key-here
AWS_SECRET_ACCESS_KEY=your-secret-here
AWS_REGION=us-east-1
TWILIO_ACCOUNT_SID=your-sid-here
TWILIO_AUTH_TOKEN=your-token-here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_MESSAGING_SERVICE_SID=your-sid-here
RESEARCHER_USERNAME=your-username
RESEARCHER_PASSWORD=your-password
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
clarityai/
├── app/
│   ├── api/
│   │   ├── generate/route.ts    # Two-layer HIPAA pipeline + Claude transformation
│   │   ├── viewer/route.ts      # Family update storage and retrieval
│   │   ├── sms/route.ts         # Twilio SMS delivery
│   │   ├── auth/route.ts        # Researcher credential validation
│   │   └── chat/route.ts        # AI chat assistant
│   ├── page.tsx                 # Main app — state management and routing
│   └── globals.css
├── components/
│   ├── DoctorPanel.tsx          # Clinical input form + access code + SMS
│   ├── MessageCards.tsx         # Three message versions + research ratings
│   ├── FamilyViewer.tsx         # Family update feed + clinical details
│   ├── FamilyChat.tsx           # AI chat assistant widget
│   ├── Dashboard.tsx            # Research charts and data table
│   └── ResearcherAuth.tsx       # WebAuthn + password authentication
└── lib/
    └── anthropic.ts             # Anthropic client singleton
```

---

## Security & Ethics

**De-identification:** All clinical input passes through a two-layer PHI detection pipeline before any message transformation. AWS Comprehend Medical handles primary detection; Claude performs a secondary pass for relative dates and implicit identifiers. No raw PHI is stored or transmitted.

**Research ethics:**
- All scenarios are fictional — no real patient data used
- Participants are informed of the AI-generated nature of messages after rating
- No personally identifiable information collected beyond a random participant ID
- Data stored locally and exported as anonymous CSV

**AI guardrails:** The family chat assistant is explicitly instructed to never provide medical advice, never assess severity, and always redirect clinical questions to the care team.

**Authentication:** The research dashboard is protected by WebAuthn biometric authentication using the Web Authentication API standard. Biometric data never leaves the device — authentication uses a challenge-response cryptographic protocol via the device's Secure Enclave.

**Limitations:**
- Updates currently stored in server memory (file-based in development) — a production system would use an encrypted persistent database
- Access code system does not currently implement rate limiting on failed attempts
- Relative temporal references (e.g. "tomorrow morning") may not be caught by Comprehend Medical and rely on Claude's secondary pass
- Sample size of 15–30 participants limits statistical generalizability

---

## Future Work

- Persistent database (Supabase) for production deployment
- Patient session management — one permanent code per patient across shifts
- Family account creation for multi-device access
- Rate limiting on access code entry attempts
- SMS notification on new update arrival (not just initial code delivery)
- AWS SNS migration for SMS at production scale
- IRB approval process for formal clinical research

---

## Author

Built by Anyssa Patel as an independent research project.