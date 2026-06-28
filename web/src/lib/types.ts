export type UserRole = 'patient' | 'doctor' | 'admin';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  specialty: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  jitsi_room_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  soap_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  medication: string;
  dosage: string;
  instructions: string | null;
  issued_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  appointment_id: string;
  content: string;
  sent_at: string;
  read_at: string | null;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  details: string | null;
  timestamp: string;
}
