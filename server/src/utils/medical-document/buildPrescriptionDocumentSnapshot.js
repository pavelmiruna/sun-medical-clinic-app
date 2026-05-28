export function buildPrescriptionDocumentSnapshot(prescription) {
  const dp = prescription.doctor?.doctorProfile ?? null;
  const clinic = dp?.clinic ?? null;

  const doctorFirstName = dp?.firstName ?? prescription.doctor?.firstName ?? "";
  const doctorLastName  = dp?.lastName  ?? prescription.doctor?.lastName  ?? "";
  const doctorFullName  = [doctorFirstName, doctorLastName].filter(Boolean).join(" ")
    || prescription.doctor?.email
    || "";

  return {
    prescription: {
      id: prescription.id,
      serialNumber: prescription.serialNumber ?? null,
      createdAt: prescription.createdAt,
      updatedAt: prescription.updatedAt,
      generalInstructions: prescription.generalInstructions ?? null,
    },

    consultation: prescription.consultation
      ? {
          id: prescription.consultation.id,
          chiefComplaint: prescription.consultation.chiefComplaint ?? null,
          diagnosis: prescription.consultation.diagnosis ?? null,
          treatment: prescription.consultation.treatment ?? null,
          objectiveFindings: prescription.consultation.objectiveFindings ?? null,
          notes: prescription.consultation.notes ?? null,
          recommendations: prescription.consultation.recommendations ?? null,
          plan: prescription.consultation.plan ?? null,
          createdAt: prescription.consultation.createdAt,
          appointmentScheduledAt: prescription.consultation.appointment?.scheduledAt ?? null,
        }
      : null,

    patient: prescription.patient
      ? {
          id: prescription.patient.id,
          firstName: prescription.patient.firstName ?? null,
          lastName:  prescription.patient.lastName  ?? null,
          fullName: `${prescription.patient.firstName ?? ""} ${prescription.patient.lastName ?? ""}`.trim(),
          cnp:       prescription.patient.cnp ?? null,
          birthDate: prescription.patient.dateOfBirth ?? null,
          phone:     prescription.patient.phone ?? null,
        }
      : null,

    doctor: prescription.doctor
      ? {
          id:             prescription.doctor.id,
          email:          prescription.doctor.email ?? null,
          fullName:       doctorFullName,
          firstName:      doctorFirstName,
          lastName:       doctorLastName,
          specialization: dp?.specialization ?? null,
          parafaCode:     dp?.parafaCode     ?? null,
          signatureUrl:   dp?.signatureUrl   ?? null,
          parafaImageUrl: dp?.parafaImageUrl ?? null,
        }
      : null,

    clinic: clinic
      ? {
          id:           clinic.id,
          name:         clinic.name,
          address:      clinic.address ?? null,
          phone:        clinic.phone   ?? null,
          email:        clinic.email   ?? null,
          serialPrefix: clinic.serialPrefix ?? null,
        }
      : null,

    items: (prescription.items ?? []).map((item) => ({
      id:             item.id,
      medicationName: item.medicationName,
      form:           item.form          ?? null,
      concentration:  item.concentration ?? null,
      dosage:         item.dosage        ?? null,
      frequency:      item.frequency     ?? null,
      duration:       item.duration      ?? null,
      route:          item.route         ?? null,
      instructions:   item.instructions  ?? null,
      quantity:       item.quantity      ?? null,
      orderIndex:     item.orderIndex    ?? 0,
    })),
  };
}