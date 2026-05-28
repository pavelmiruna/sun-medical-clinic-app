function formatDate(dateValue) {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);
  return new Intl.DateTimeFormat("ro-RO").format(d);
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export function buildReferralGeneratedContent(sourceSnapshot) {
  const referral     = sourceSnapshot.referral;
  const patient      = sourceSnapshot.patient;
  const consultation = sourceSnapshot.consultation;
  const doctor       = sourceSnapshot.doctor;
  const clinic       = sourceSnapshot.clinic;

  const age = calculateAge(patient?.dateOfBirth);

  return {
    header: {
      documentTitle:   "Bilet de trimitere",
      templateKey:     "referral_v1",
      issuedAt:        consultation?.appointmentScheduledAt ?? referral?.issuedAt ?? new Date().toISOString(),
      // Cabinet
      unitateSanitara: clinic?.name         ?? "",
      adresaCabinet:   clinic?.address      ?? "",
      phoneCabinet:    clinic?.phone        ?? "",
      serialPrefix:    clinic?.serialPrefix ?? "",
      seria:           clinic?.serialPrefix ?? "",
      nr:              referral?.serialNumber != null ? String(referral.serialNumber) : "",
    },

    patientSection: {
      fullName:    patient?.fullName    ?? "",
      cnp:         patient?.cnp         ?? "",
      phone:       patient?.phone       ?? "",
      dateOfBirth: formatDate(patient?.dateOfBirth),
      age:         age !== null ? `${age} ani` : "",
      isMinor:     patient?.isMinor     ?? false,
    },

    doctorSection: {
      fullName:       doctor?.fullName       ?? "",
      specialization: doctor?.specialization ?? "",
      email:          doctor?.email          ?? "",
      parafaCode:     doctor?.parafaCode     ?? "",
      signatureUrl:   doctor?.signatureUrl   ?? "",
      parafaImageUrl: doctor?.parafaImageUrl ?? "",
    },

    referralSection: {
      specialty:       referral?.specialty       ?? "",
      reason:          referral?.reason          ?? "",
      clinicalSummary: referral?.clinicalSummary ?? consultation?.diagnosis ?? "",
      destinationUnit: referral?.destinationUnit ?? "",
      priority:        referral?.priority        ?? "ROUTINE",
      notes:           referral?.notes           ?? "",
    },

    consultationSection: {
      chiefComplaint:    consultation?.chiefComplaint    ?? "",
      diagnosis:         consultation?.diagnosis         ?? "",
      objectiveFindings: consultation?.objectiveFindings ?? "",
      recommendations:   consultation?.recommendations   ?? "",
      plan:              consultation?.plan              ?? "",
    },

    footer: {
      generatedAt:   formatDate(new Date()),
      extraMentions: "",
    },
  };
}