export type Role = 'admin' | 'coach' | 'user';
export type BookingStatus = 'confirmed' | 'waitlist' | 'cancelled' | 'no_show' | 'completed' | 'pending_payment';
export type SessionType = 'CrossFit' | 'Hyrox' | 'Open Gym' | 'Kids' | 'Drop-in' | 'Strength' | 'Conditioning';

export interface GymConfig {
  id: string;
  name: string;
  timezone: string;
  locale: string;
  bookingWindowDays: number;
  bookingCutoffMinutes: number;
  allowOverbooking: boolean;
  waitlistAutoPromote: boolean;
  waitlistResponseWindowMinutes: number | null;
}

export interface MembershipRule {
  id: string;
  name: string;
  type: 'subscription' | 'pack' | 'dropin';
  validFrom: string;
  validTo: string | null;
  maxSessionsPerWeek: number | null;
  maxSessionsPerMonth: number | null;
  maxPerDay: number | null;
  allowedSessionTypes: SessionType[];
  earlyBookingDays: number;
  cancellationFreeHours: number;
  lateCancelPenalty: PenaltyRule | null;
  noShowPenalty: PenaltyRule | null;
  transferable: boolean;
  credits: number | null;
}

export interface PenaltyRule {
  id: string;
  label: string;
  blockDays?: number;
  consumeCredit?: boolean;
  warningOnly?: boolean;
}

export interface SessionTemplate {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: SessionType;
  capacity: number;
  location: string;
  coachId: string;
  notes?: string;
  bookingOpenAt: string;
  bookingCloseAt: string;
  allowGuests: boolean;
}

export interface Booking {
  id: string;
  sessionId: string;
  userId: string;
  status: BookingStatus;
  createdAt: string;
  isGuest: boolean;
  guestEmail?: string;
  penaltyApplied?: string;
}

export interface CheckIn {
  id: string;
  bookingId: string;
  checkedAt: string;
  method: 'coach' | 'qr' | 'self';
}

export interface Payment {
  id: string;
  bookingId?: string;
  amount: number;
  currency: string;
  status: 'requires_payment' | 'paid' | 'refunded';
  stripeSessionId?: string;
  stripeCustomerId?: string;
  invoiceUrl?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  gymId: string;
  status: 'active' | 'blocked' | 'penalized';
  entitlements: MembershipRule[];
}

export interface WorkoutResult {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  isPersonalRecord: boolean;
  recordedBy: 'coach' | 'user';
}
