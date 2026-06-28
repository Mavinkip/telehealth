-- File: schema.sql
-- Purpose: Complete database schema for Telehealth Communication System
-- Dependencies: Supabase/Postgres
-- Fits in: Database setup layer
-- 
-- IMPORTANT: Run this in your Supabase SQL Editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    phone TEXT,
    specialty TEXT, -- For doctors only
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    jitsi_room_id TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    soap_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    medication TEXT NOT NULL,
    dosage TEXT NOT NULL,
    instructions TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment_id ON medical_records(appointment_id);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment_id ON prescriptions(appointment_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_appointment_id ON messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can view all profiles (needed for doctor/patient selection)
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Only authenticated users can insert profiles (handled by trigger)
CREATE POLICY "Authenticated users can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- RLS Policies for appointments
-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments"
    ON appointments FOR SELECT
    USING (
        auth.uid() = patient_id OR
        auth.uid() = doctor_id OR
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Patients can create appointments
CREATE POLICY "Patients can create appointments"
    ON appointments FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

-- Patients can update their own appointments (cancel/reschedule)
CREATE POLICY "Patients can update own appointments"
    ON appointments FOR UPDATE
    USING (
        auth.uid() = patient_id OR
        auth.uid() = doctor_id OR
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- RLS Policies for medical_records
-- Patients can view their own medical records
CREATE POLICY "Patients can view own medical records"
    ON medical_records FOR SELECT
    USING (
        auth.uid() = patient_id OR
        auth.uid() = doctor_id OR
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Doctors can create medical records for their patients
CREATE POLICY "Doctors can create medical records"
    ON medical_records FOR INSERT
    WITH CHECK (auth.uid() = doctor_id);

-- Doctors can update medical records they created
CREATE POLICY "Doctors can update own medical records"
    ON medical_records FOR UPDATE
    USING (auth.uid() = doctor_id);

-- RLS Policies for prescriptions
-- Patients can view their own prescriptions
CREATE POLICY "Patients can view own prescriptions"
    ON prescriptions FOR SELECT
    USING (
        auth.uid() = patient_id OR
        auth.uid() = doctor_id OR
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Doctors can create prescriptions
CREATE POLICY "Doctors can create prescriptions"
    ON prescriptions FOR INSERT
    WITH CHECK (auth.uid() = doctor_id);

-- RLS Policies for messages
-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
    ON messages FOR SELECT
    USING (
        auth.uid() = sender_id OR
        auth.uid() = receiver_id OR
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Users can send messages
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Users can update read status of messages they received
CREATE POLICY "Users can update received messages"
    ON messages FOR UPDATE
    USING (auth.uid() = receiver_id);

-- RLS Policies for activity_logs
-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
    ON activity_logs FOR SELECT
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Users can view their own activity logs
CREATE POLICY "Users can view own activity logs"
    ON activity_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Authenticated users can insert activity logs
CREATE POLICY "Authenticated users can insert activity logs"
    ON activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
