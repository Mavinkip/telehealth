-- File: seed_data.sql
-- Purpose: Sample data for testing the Telehealth Communication System
-- Dependencies: schema.sql (must be run first)
-- Fits in: Database setup layer
--
-- IMPORTANT: Run this in your Supabase SQL Editor after running schema.sql
-- This will create sample doctors, patients, and appointments for testing

-- Note: This script creates sample data using direct INSERT statements
-- In a real scenario, you would create users via Supabase Auth first,
-- then the trigger would create the profile automatically.
-- For testing purposes, we're inserting profiles directly.

-- Sample Doctors
INSERT INTO profiles (id, full_name, email, role, phone, specialty, created_at) VALUES
    (gen_random_uuid(), 'Dr. Sarah Johnson', 'sarah.johnson@telehealth.com', 'doctor', '+254700123456', 'Cardiology', NOW()),
    (gen_random_uuid(), 'Dr. Michael Chen', 'michael.chen@telehealth.com', 'doctor', '+254700234567', 'General Practice', NOW()),
    (gen_random_uuid(), 'Dr. Emily Williams', 'emily.williams@telehealth.com', 'doctor', '+254700345678', 'Pediatrics', NOW()),
    (gen_random_uuid(), 'Dr. James Brown', 'james.brown@telehealth.com', 'doctor', '+254700456789', 'Dermatology', NOW()),
    (gen_random_uuid(), 'Dr. Lisa Anderson', 'lisa.anderson@telehealth.com', 'doctor', '+254700567890', 'Neurology', NOW())
ON CONFLICT DO NOTHING;

-- Sample Patients
INSERT INTO profiles (id, full_name, email, role, phone, created_at) VALUES
    (gen_random_uuid(), 'John Smith', 'john.smith@email.com', 'patient', '+254711234567', NOW()),
    (gen_random_uuid(), 'Mary Johnson', 'mary.johnson@email.com', 'patient', '+254711345678', NOW()),
    (gen_random_uuid(), 'David Wilson', 'david.wilson@email.com', 'patient', '+254711456789', NOW()),
    (gen_random_uuid(), 'Sarah Davis', 'sarah.davis@email.com', 'patient', '+254711567890', NOW()),
    (gen_random_uuid(), 'Michael Miller', 'michael.miller@email.com', 'patient', '+254711678901', NOW()),
    (gen_random_uuid(), 'Emily Taylor', 'emily.taylor@email.com', 'patient', '+254711789012', NOW()),
    (gen_random_uuid(), 'Robert Anderson', 'robert.anderson@email.com', 'patient', '+254711890123', NOW()),
    (gen_random_uuid(), 'Jennifer Thomas', 'jennifer.thomas@email.com', 'patient', '+254711901234', NOW())
ON CONFLICT DO NOTHING;

-- Get the IDs of the inserted doctors and patients
-- Note: In a real script, you would use variables or CTEs to get these IDs
-- For this example, we'll use a simpler approach with subqueries

-- Sample Appointments
-- These use the first doctor and first few patients
INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, jitsi_room_id, notes, created_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 0),
    (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 0),
    NOW() + INTERVAL '1 day',
    'scheduled',
    'telehealth-' || (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 0) || '-' || (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 0) || '-' || EXTRACT(EPOCH FROM NOW()),
    'Regular checkup',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE notes = 'Regular checkup');

INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, jitsi_room_id, notes, created_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 1),
    (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 1),
    NOW() + INTERVAL '2 days',
    'scheduled',
    'telehealth-' || (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 1) || '-' || (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 1) || '-' || EXTRACT(EPOCH FROM NOW()),
    'Follow-up consultation',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE notes = 'Follow-up consultation');

INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, jitsi_room_id, notes, created_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 2),
    (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 0),
    NOW() - INTERVAL '1 day',
    'completed',
    'telehealth-completed-' || EXTRACT(EPOCH FROM NOW()),
    'Initial consultation',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE notes = 'Initial consultation');

INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, jitsi_room_id, notes, created_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 3),
    (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 2),
    NOW() - INTERVAL '2 days',
    'cancelled',
    'telehealth-cancelled-' || EXTRACT(EPOCH FROM NOW()),
    'Cancelled by patient',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE notes = 'Cancelled by patient');

INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, jitsi_room_id, notes, created_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 4),
    (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 1),
    NOW() + INTERVAL '3 days',
    'scheduled',
    'telehealth-' || (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 4) || '-' || (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 1) || '-' || EXTRACT(EPOCH FROM NOW()),
    'Specialist consultation',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE notes = 'Specialist consultation');

-- Sample Medical Records (for completed appointment)
INSERT INTO medical_records (patient_id, doctor_id, appointment_id, soap_notes, created_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 2),
    (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 0),
    (SELECT id FROM appointments WHERE notes = 'Initial consultation'),
    'Subjective: Patient reports persistent headaches for the past week. Pain is described as throbbing, located in the frontal area. No history of migraines.
Objective: Vital signs normal. Neurological exam shows no focal deficits. Blood pressure 120/80 mmHg.
Assessment: Tension headache, likely stress-related.
Plan: Prescribed pain relievers, recommended stress management techniques, follow-up in 2 weeks if symptoms persist.',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM medical_records WHERE soap_notes LIKE 'Subjective: Patient reports persistent headaches%');

-- Sample Prescriptions
INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, medication, dosage, instructions, issued_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 2),
    (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 0),
    (SELECT id FROM appointments WHERE notes = 'Initial consultation'),
    'Ibuprofen',
    '400mg',
    'Take one tablet every 6 hours as needed for pain. Do not exceed 4 tablets in 24 hours. Take with food.',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM prescriptions WHERE medication = 'Ibuprofen' AND dosage = '400mg');

INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, medication, dosage, instructions, issued_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 2),
    (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 0),
    (SELECT id FROM appointments WHERE notes = 'Initial consultation'),
    'Acetaminophen',
    '500mg',
    'Take one tablet every 4-6 hours as needed for pain. Do not exceed 6 tablets in 24 hours.',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM prescriptions WHERE medication = 'Acetaminophen' AND dosage = '500mg');

-- Sample Messages
INSERT INTO messages (sender_id, receiver_id, appointment_id, content, sent_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 0),
    (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 0),
    (SELECT id FROM appointments WHERE notes = 'Regular checkup'),
    'Hello Dr. Johnson, I have a few questions before our appointment tomorrow.',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM messages WHERE content LIKE 'Hello Dr. Johnson%');

INSERT INTO messages (sender_id, receiver_id, appointment_id, content, sent_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 0),
    (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 0),
    (SELECT id FROM appointments WHERE notes = 'Regular checkup'),
    'Hello! Of course, feel free to ask your questions. I''ll be happy to help.',
    NOW() + INTERVAL '5 minutes'
WHERE NOT EXISTS (SELECT 1 FROM messages WHERE content LIKE 'Hello! Of course%');

-- Sample Activity Logs
INSERT INTO activity_logs (user_id, action, details, timestamp)
SELECT 
    (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 0),
    'REGISTER',
    'User registered as patient',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE action = 'REGISTER' AND details = 'User registered as patient');

INSERT INTO activity_logs (user_id, action, details, timestamp)
SELECT 
    (SELECT id FROM profiles WHERE role = 'doctor' ORDER BY created_at LIMIT 1 OFFSET 0),
    'REGISTER',
    'User registered as doctor',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE action = 'REGISTER' AND details = 'User registered as doctor');

INSERT INTO activity_logs (user_id, action, details, timestamp)
SELECT 
    (SELECT id FROM profiles WHERE role = 'patient' ORDER BY created_at LIMIT 1 OFFSET 0),
    'BOOK_APPOINTMENT',
    'Booked appointment with doctor',
    NOW() + INTERVAL '1 hour'
WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE action = 'BOOK_APPOINTMENT');

-- Display summary
DO $$
BEGIN
    RAISE NOTICE 'Sample data inserted successfully!';
    RAISE NOTICE 'Doctors: 5';
    RAISE NOTICE 'Patients: 8';
    RAISE NOTICE 'Appointments: 5 (3 scheduled, 1 completed, 1 cancelled)';
    RAISE NOTICE 'Medical Records: 1';
    RAISE NOTICE 'Prescriptions: 2';
    RAISE NOTICE 'Messages: 2';
    RAISE NOTICE 'Activity Logs: 3';
END $$;
