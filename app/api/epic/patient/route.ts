import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "../auth/route";

const EPIC_FHIR_BASE =
  "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4";

async function fhirGet(path: string, token: string) {
  const res = await fetch(`${EPIC_FHIR_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/fhir+json",
    },
  });
  if (!res.ok) {
    throw new Error(`FHIR request failed: ${res.status} ${path}`);
  }
  return res.json();
}

function formatName(name: any): string {
  if (!name) return "Unknown";
  return `${name.given?.join(" ") || ""} ${name.family || ""}`.trim();
}

async function searchPatients(query: string, token: string) {
  // Try MRN first
  const byMrn = await fhirGet(
    `/Patient?identifier=${encodeURIComponent(query)}`,
    token
  ).catch(() => null);

  if (byMrn?.entry?.length > 0) {
    return byMrn.entry.map((e: any) => ({
      id: e.resource.id,
      name: formatName(e.resource.name?.[0]),
      mrn:
        e.resource.identifier?.find((i: any) =>
          i.type?.coding?.some((c: any) => c.code === "MR")
        )?.value || "",
      dob: e.resource.birthDate || "",
      gender: e.resource.gender || "",
    }));
  }

  // Try name search
  const byName = await fhirGet(
    `/Patient?name=${encodeURIComponent(query)}&_count=10`,
    token
  ).catch(() => null);

  if (byName?.entry?.length > 0) {
    return byName.entry.map((e: any) => ({
      id: e.resource.id,
      name: formatName(e.resource.name?.[0]),
      mrn:
        e.resource.identifier?.find((i: any) =>
          i.type?.coding?.some((c: any) => c.code === "MR")
        )?.value || "",
      dob: e.resource.birthDate || "",
      gender: e.resource.gender || "",
    }));
  }

  return [];
}

async function resolvePatientId(
  input: string,
  token: string
): Promise<string> {
  // If it looks like a FHIR ID (long alphanumeric) use it directly
  if (input.length > 10 && /^[a-zA-Z0-9]+$/.test(input)) {
    return input;
  }

  // Otherwise treat as MRN and search for the patient
  const bundle = await fhirGet(
    `/Patient?identifier=${encodeURIComponent(input)}`,
    token
  );

  const entry = bundle.entry?.[0]?.resource;
  if (!entry?.id) {
    throw new Error(`No patient found for MRN: ${input}`);
  }

  return entry.id;
}

export async function GET(request: NextRequest) {
  try {
    const input = request.nextUrl.searchParams.get("patientId");
    const searchQuery = request.nextUrl.searchParams.get("search");

    const token = await getAccessToken();

    // SEARCH MODE — returns list of matching patients
    if (searchQuery) {
      const results = await searchPatients(searchQuery.trim(), token);
      return NextResponse.json({ results });
    }

    // FETCH MODE — returns full patient data
    if (!input) {
      return NextResponse.json(
        { error: "patientId or search is required" },
        { status: 400 }
      );
    }

    const patientId = await resolvePatientId(input.trim(), token);

    const [
      patient,
      vitalsBundle,
      labsBundle,
      conditionsBundle,
      notesBundle,
      ordersBundle,
      relatedPersonBundle,
      encounterBundle,
    ] = await Promise.all([
      fhirGet(`/Patient/${patientId}`, token),
      fhirGet(
        `/Observation?patient=${patientId}&category=vital-signs&_count=10&_sort=-date`,
        token
      ),
      fhirGet(
        `/Observation?patient=${patientId}&category=laboratory&_count=10&_sort=-date`,
        token
      ),
      fhirGet(`/Condition?patient=${patientId}&clinical-status=active`, token),
      fhirGet(
        `/DocumentReference?patient=${patientId}&type=34108-1&_count=3&_sort=-date`,
        token
      ),
      fhirGet(`/ServiceRequest?patient=${patientId}&status=active`, token),
      fhirGet(`/RelatedPerson?patient=${patientId}`, token),
      fhirGet(`/Encounter?patient=${patientId}&status=in-progress`, token),
    ]);

    const name = patient.name?.[0];
    const fullName = formatName(name);

    const emergencyContact = relatedPersonBundle.entry?.[0]?.resource;
    const contactName = emergencyContact?.name?.[0];
    const contactFullName = contactName ? formatName(contactName) : null;
    const contactPhone =
      emergencyContact?.telecom?.find((t: any) => t.system === "phone")
        ?.value || null;

    const vitals =
      vitalsBundle.entry?.map((e: any) => {
        const obs = e.resource;
        return {
          name: obs.code?.text || obs.code?.coding?.[0]?.display,
          value: obs.valueQuantity
            ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit}`
            : obs.valueString || "N/A",
          date: obs.effectiveDateTime,
        };
      }) || [];

    const labs =
      labsBundle.entry?.map((e: any) => {
        const obs = e.resource;
        return {
          name: obs.code?.text || obs.code?.coding?.[0]?.display,
          value: obs.valueQuantity
            ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit}`
            : obs.valueString || "N/A",
          date: obs.effectiveDateTime,
        };
      }) || [];

    const conditions =
      conditionsBundle.entry?.map((e: any) => {
        const cond = e.resource;
        return {
          name: cond.code?.text || cond.code?.coding?.[0]?.display,
          status: cond.clinicalStatus?.coding?.[0]?.code,
        };
      }) || [];

    const recentNote = notesBundle.entry?.[0]?.resource;
    const noteText =
      recentNote?.content?.[0]?.attachment?.data
        ? Buffer.from(
            recentNote.content[0].attachment.data,
            "base64"
          ).toString("utf-8")
        : null;

    const orders =
      ordersBundle.entry?.map((e: any) => {
        const order = e.resource;
        return {
          name: order.code?.text || order.code?.coding?.[0]?.display,
          status: order.status,
          intent: order.intent,
        };
      }) || [];

    const encounter = encounterBundle.entry?.[0]?.resource;
    const admissionDate = encounter?.period?.start || null;
    const location =
      encounter?.location?.[0]?.location?.display || null;

    return NextResponse.json({
      patientName: fullName,
      patientId,
      admissionDate,
      location,
      emergencyContact: contactFullName
        ? { name: contactFullName, phone: contactPhone }
        : null,
      suggestedStatus: conditions.some((c: any) =>
        c.name?.toLowerCase().includes("critical")
      )
        ? "critical"
        : "stable",
      suggestedAction:
        orders.length > 0
          ? orders
              .map((o: any) => o.name)
              .filter(Boolean)
              .slice(0, 3)
              .join(", ")
          : "",
      suggestedReason: [
        ...labs.slice(0, 3).map((l: any) => `${l.name}: ${l.value}`),
        ...vitals.slice(0, 2).map((v: any) => `${v.name}: ${v.value}`),
      ].join(", "),
      recentNote: noteText,
      vitals,
      labs,
      conditions,
      orders,
    });
  } catch (error: any) {
    console.error("Epic patient route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient data", details: error.message },
      { status: 500 }
    );
  }
}