import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "../auth/route";

const EPIC_FHIR_BASE = "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4";

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

export async function GET(request: NextRequest) {
  try {
    const patientId = request.nextUrl.searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }

    const token = await getAccessToken();

    // Fetch all data in parallel
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
      fhirGet(`/Observation?patient=${patientId}&category=vital-signs&_count=10&_sort=-date`, token),
      fhirGet(`/Observation?patient=${patientId}&category=laboratory&_count=10&_sort=-date`, token),
      fhirGet(`/Condition?patient=${patientId}&clinical-status=active`, token),
      fhirGet(`/DocumentReference?patient=${patientId}&type=34108-1&_count=3&_sort=-date`, token),
      fhirGet(`/ServiceRequest?patient=${patientId}&status=active`, token),
      fhirGet(`/RelatedPerson?patient=${patientId}`, token),
      fhirGet(`/Encounter?patient=${patientId}&status=in-progress`, token),
    ]);

    // Extract patient name
    const name = patient.name?.[0];
    const fullName = name
      ? `${name.given?.join(" ")} ${name.family}`
      : "Unknown";

    // Extract emergency contact
    const emergencyContact = relatedPersonBundle.entry?.[0]?.resource;
    const contactName = emergencyContact?.name?.[0];
    const contactFullName = contactName
      ? `${contactName.given?.join(" ")} ${contactName.family}`
      : null;
    const contactPhone = emergencyContact?.telecom?.find(
      (t: any) => t.system === "phone"
    )?.value || null;

    // Extract vitals
    const vitals = vitalsBundle.entry?.map((e: any) => {
      const obs = e.resource;
      return {
        name: obs.code?.text || obs.code?.coding?.[0]?.display,
        value: obs.valueQuantity
          ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit}`
          : obs.valueString || "N/A",
        date: obs.effectiveDateTime,
      };
    }) || [];

    // Extract labs
    const labs = labsBundle.entry?.map((e: any) => {
      const obs = e.resource;
      return {
        name: obs.code?.text || obs.code?.coding?.[0]?.display,
        value: obs.valueQuantity
          ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit}`
          : obs.valueString || "N/A",
        date: obs.effectiveDateTime,
      };
    }) || [];

    // Extract conditions
    const conditions = conditionsBundle.entry?.map((e: any) => {
      const cond = e.resource;
      return {
        name: cond.code?.text || cond.code?.coding?.[0]?.display,
        status: cond.clinicalStatus?.coding?.[0]?.code,
      };
    }) || [];

    // Extract most recent clinical note
    const recentNote = notesBundle.entry?.[0]?.resource;
    const noteText = recentNote?.content?.[0]?.attachment?.data
      ? Buffer.from(
          recentNote.content[0].attachment.data,
          "base64"
        ).toString("utf-8")
      : null;

    // Extract active orders
    const orders = ordersBundle.entry?.map((e: any) => {
      const order = e.resource;
      return {
        name: order.code?.text || order.code?.coding?.[0]?.display,
        status: order.status,
        intent: order.intent,
      };
    }) || [];

    // Extract current encounter
    const encounter = encounterBundle.entry?.[0]?.resource;
    const admissionDate = encounter?.period?.start || null;
    const location =
      encounter?.location?.[0]?.location?.display || null;

    // Build pre-filled form data for ClarityAI
    const formData = {
      patientName: fullName,
      patientId,
      admissionDate,
      location,
      emergencyContact: contactFullName
        ? {
            name: contactFullName,
            phone: contactPhone,
          }
        : null,
      suggestedStatus: conditions.some((c: any) =>
        c.name?.toLowerCase().includes("critical")
      )
        ? "critical"
        : "stable",
      suggestedAction: orders.length > 0
        ? orders.map((o: any) => o.name).filter(Boolean).slice(0, 3).join(", ")
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
    };

    return NextResponse.json(formData);
  } catch (error: any) {
    console.error("Epic patient route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient data", details: error.message },
      { status: 500 }
    );
  }
}