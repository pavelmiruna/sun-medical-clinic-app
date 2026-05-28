import {
  createReferral,
  getReferralById,
  updateReferral,
  getMyDoctorReferrals,
  getPatientReferrals,
} from "../services/referral.service.js";
import {
  createReferralSchema,
  updateReferralSchema,
} from "../validators/referral.validator.js";

export async function createReferralController(req, res, next) {
  try {
    const parsed = createReferralSchema.parse(req.body);

    const referral = await createReferral({
      ...parsed,
      currentUser: req.user,
    });

    return res.status(201).json(referral);
  } catch (error) {
    next(error);
  }
}

export async function getReferralByIdController(req, res, next) {
  try {
    const referral = await getReferralById(req.params.id, req.user);
    return res.status(200).json(referral);
  } catch (error) {
    next(error);
  }
}

export async function updateReferralController(req, res, next) {
  try {
    const parsed = updateReferralSchema.parse(req.body);
    const referral = await updateReferral(req.params.id, req.user, parsed);
    return res.status(200).json(referral);
  } catch (error) {
    next(error);
  }
}

export async function getMyDoctorReferralsController(req, res, next) {
  try {
    const referrals = await getMyDoctorReferrals(req.user);
    return res.status(200).json(referrals);
  } catch (error) {
    next(error);
  }
}

export async function getPatientReferralsController(req, res, next) {
  try {
    const referrals = await getPatientReferrals(req.params.patientId, req.user);
    return res.status(200).json(referrals);
  } catch (error) {
    next(error);
  }
}