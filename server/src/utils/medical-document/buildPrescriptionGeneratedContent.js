function formatDate(dateValue) {
  if (!dateValue) return null;
  return new Intl.DateTimeFormat("ro-RO").format(new Date(dateValue));
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export function buildPrescriptionGeneratedContent(sourceSnapshot) {
  const patient      = sourceSnapshot.patient;
  const doctor       = sourceSnapshot.doctor;
  const consultation = sourceSnapshot.consultation;
  const prescription = sourceSnapshot.prescription;
  const clinic       = sourceSnapshot.clinic;
  const items        = sourceSnapshot.items ?? [];

  const age = calculateAge(patient?.birthDate);

  return {
    header: {
      documentTitle:  "Prescripție medicală",
      templateKey:    "prescription_v1",
      issuedAt:       consultation?.appointmentScheduledAt ?? prescription?.issuedAt ?? new Date().toISOString(),
      // Cabinet info
      unitateSanitara: clinic?.name         ?? "",
      adresaCabinet:   clinic?.address      ?? "",
      phoneCabinet:    clinic?.phone        ?? "",
      serialPrefix:    clinic?.serialPrefix ?? "",
      seria:           clinic?.serialPrefix ?? "",
      nr:              prescription?.serialNumber != null ? String(prescription.serialNumber) : "",
    },

    patientSection: {
      fullName:  patient?.fullName  ?? "",
      cnp:       patient?.cnp       ?? "",
      birthDate: formatDate(patient?.birthDate),
      age:       age !== null ? `${age} ani` : "",
      phone:     patient?.phone     ?? "",
    },

    doctorSection: {
      fullName:       doctor?.fullName       ?? "",
      specialization: doctor?.specialization ?? "",
      email:          doctor?.email          ?? "",
      parafaCode:     doctor?.parafaCode     ?? "",
      signatureUrl:   doctor?.signatureUrl   ?? "",
      parafaImageUrl: doctor?.parafaImageUrl ?? "",
    },

    clinicalSection: {
      chiefComplaint:    consultation?.chiefComplaint    ?? "",
      diagnosis:         consultation?.diagnosis         ?? "",
      treatment:         consultation?.treatment         ?? "",
      notes:             consultation?.notes             ?? "",
      recommendations:   consultation?.recommendations   ?? "",
      objectiveFindings: consultation?.objectiveFindings ?? "",
      plan:              consultation?.plan              ?? "",
      prescriptionDiagnosis: "",
    },

    medications: items
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((item, index) => ({
        lineNo:         index + 1,
        medicationName: item.medicationName ?? "",
        form:           item.form           ?? "",
        concentration:  item.concentration  ?? "",
        dosage:         item.dosage         ?? "",
        frequency:      item.frequency      ?? "",
        duration:       item.duration       ?? "",
        route:          item.route          ?? "",
        instructions:   item.instructions   ?? "",
        quantity:       item.quantity       ?? "",
      })),

    footer: {
      extraMentions: prescription?.generalInstructions ?? "",
      generatedAt:   formatDate(new Date()),
    },
  };
}