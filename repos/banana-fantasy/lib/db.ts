import { isFirestoreConfigured } from '@/lib/firebaseAdmin';
import * as jsonDb from './db-json';
import * as firestoreDb from './db-firestore';

const db = isFirestoreConfigured() ? firestoreDb : jsonDb;

export const getPromos = db.getPromos;
export const claimPromo = db.claimPromo;
export const getReferralStats = db.getReferralStats;
export const generateReferralCode = db.generateReferralCode;
export const spinWheel = db.spinWheel;
export const getWheelHistory = db.getWheelHistory;
export const createPurchase = db.createPurchase;
export const verifyPurchase = db.verifyPurchase;
export const getPurchaseHistory = db.getPurchaseHistory;
export const createWithdrawal = db.createWithdrawal;
export const getWithdrawalsByUser = db.getWithdrawalsByUser;
export const getContests = db.getContests;
export const getContest = db.getContest;
export const getContestStandings = db.getContestStandings;
export const getExposure = db.getExposure;
export const getDraftHistory = db.getDraftHistory;
