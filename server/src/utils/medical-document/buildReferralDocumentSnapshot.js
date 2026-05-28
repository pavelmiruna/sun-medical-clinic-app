export function buildReferralDocumentSnapshot(referral) {
  const dp = referral.doctor?.doctorProfile ?? null;
  const clinic = dp?.clinic ?? null;

  const doctorFirstName = dp?.firstName ?? "";
  const doctorLastName  = dp?.lastName  ?? "";
  const doctorFullName  = [doctorFirstName, doctorLastName].filter(Boolean).join(" ")
    || referral.doctor?.email || "";

  return {
    referral: {
      id:              referral.id,
      serialNumber:    referral.serialNumber    ?? null,
      specialty:       referral.specialty       ?? null,
      reason:          referral.reason          ?? null,
      clinicalSummary: referral.clinicalSummary ?? null,
      destinationUnit: referral.destinationUnit ?? null,
      notes:           referral.notes           ?? null,
      priority:        referral.priority        ?? null,
      issuedAt:        referral.issuedAt        ?? null,
      createdAt:       referral.createdAt,
    },

    consultation: referral.consultation
      ? {
          id:                     referral.consultation.id,
          chiefComplaint:         referral.consultation.chiefComplaint    ?? null,
          diagnosis:              referral.consultation.diagnosis         ?? null,
          treatment:              referral.consultation.treatment         ?? null,
          objectiveFindings:      referral.consultation.objectiveFindings ?? null,
          notes:                  referral.consultation.notes             ?? null,
          recommendations:        referral.consultation.recommendations   ?? null,
          plan:                   referral.consultation.plan              ?? null,
          createdAt:              referral.consultation.createdAt,
          appointmentScheduledAt: referral.consultation.appointment?.scheduledAt ?? null,
        }
      : null,

    patient: referral.patient
      ? {
          id:          referral.patient.id,
          firstName:   referral.patient.firstName   ?? null,
          lastName:    referral.patient.lastName    ?? null,
          fullName:    `${referral.patient.firstName ?? ""} ${referral.patient.lastName ?? ""}`.trim(),
          cnp:         referral.patient.cnp         ?? null,
          phone:       referral.patient.phone       ?? null,
          dateOfBirth: referral.patient.dateOfBirth ?? null,
          isMinor:     referral.patient.isMinor     ?? false,
        }
      : null,

    doctor: referral.doctor
      ? {
          id:             referral.doctor.id,
          email:          referral.doctor.email          ?? null,
          fullName:       doctorFullName,
          specialization: dp?.specialization             ?? null,
          parafaCode:     dp?.parafaCode                 ?? null,
          signatureUrl:   dp?.signatureUrl               ?? null,
          parafaImageUrl: dp?.parafaImageUrl             ?? null,
        }
      : null,

    clinic: clinic
      ? {
          id:           clinic.id,
          name:         clinic.name,
          address:      clinic.address      ?? null,
          phone:        clinic.phone        ?? null,
          email:        clinic.email        ?? null,
          serialPrefix: clinic.serialPrefix ?? null,
        }
      : null,
  };
}