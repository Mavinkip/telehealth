# Testing Guide for Telehealth Communication System

This guide provides detailed step-by-step instructions for testing all features of the Telehealth Communication System.

## Pre-Testing Checklist

Before starting testing, ensure:

- [ ] Supabase project is created and configured
- [ ] Database schema is installed (`supabase/schema.sql`)
- [ ] Sample data is loaded (`supabase/seed_data.sql`)
- [ ] Realtime is enabled for the `messages` table
- [ ] Admin user is created and has `role = 'admin'` in profiles table
- [ ] Application is configured with correct Supabase credentials in `js/config.js`
- [ ] Application is running on a local web server (not opened directly as file)
- [ ] You have at least 2 different browsers or browser profiles for testing chat/video

## Test Case 1: Patient Registration and Login

### Objective
Verify that patients can register new accounts and login successfully.

### Steps

1. **Register a New Patient**
   - Navigate to the application URL
   - Click "Register" on the login page
   - Fill in the registration form:
     - Full Name: "Test Patient"
     - Email: "patient@test.com"
     - Password: "test123456"
     - Confirm Password: "test123456"
     - Role: "Patient"
     - Phone: "+254700000001"
   - Click "Register"
   - **Expected**: Success message "Registration successful!"
   - **Expected**: Redirect to login page

2. **Login as Patient**
   - Enter email: "patient@test.com"
   - Enter password: "test123456"
   - Click "Login"
   - **Expected**: Success message "Login successful!"
   - **Expected**: Redirect to Patient Dashboard

3. **Verify Profile Creation**
   - Go to Supabase Dashboard > Authentication > Users
   - **Expected**: New user "patient@test.com" exists
   - Go to Supabase Dashboard > Database > profiles table
   - **Expected**: Profile row exists with role = 'patient'

### Test Result
- [ ] PASS - Patient registration and login work correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 2: Doctor Registration and Login

### Objective
Verify that doctors can register new accounts and login successfully.

### Steps

1. **Register a New Doctor**
   - Navigate to the application URL
   - Click "Register" on the login page
   - Fill in the registration form:
     - Full Name: "Dr. Test Doctor"
     - Email: "doctor@test.com"
     - Password: "test123456"
     - Confirm Password: "test123456"
     - Role: "Doctor"
     - Specialty: "General Practice"
     - Phone: "+254700000002"
   - Click "Register"
   - **Expected**: Success message "Registration successful!"
   - **Expected**: Redirect to login page

2. **Login as Doctor**
   - Enter email: "doctor@test.com"
   - Enter password: "test123456"
   - Click "Login"
   - **Expected**: Success message "Login successful!"
   - **Expected**: Redirect to Doctor Dashboard

3. **Verify Profile Creation**
   - Go to Supabase Dashboard > Authentication > Users
   - **Expected**: New user "doctor@test.com" exists
   - Go to Supabase Dashboard > Database > profiles table
   - **Expected**: Profile row exists with role = 'doctor' and specialty = 'General Practice'

### Test Result
- [ ] PASS - Doctor registration and login work correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 3: Patient Dashboard Navigation

### Objective
Verify that patients can navigate through all dashboard sections.

### Steps

1. **Login as Patient**
   - Use credentials from Test Case 1

2. **Test Dashboard View**
   - **Expected**: Dashboard shows:
     - Welcome message with patient name
     - Quick action cards (Book Appointment, Medical Records, Messages, Profile)
     - Upcoming appointments section
     - Recent medical records section

3. **Test Navigation Links**
   - Click "Dashboard" in navbar
   - **Expected**: Dashboard view loads
   - Click "Appointments" in navbar
   - **Expected**: Appointments view loads
   - Click "Medical Records" in navbar
   - **Expected**: Medical Records view loads
   - Click "Profile" in navbar
   - **Expected**: Profile view loads

4. **Test Quick Action Cards**
   - Click "Book Appointment" card
   - **Expected**: Navigates to Appointments view
   - Click "Medical Records" card
   - **Expected**: Navigates to Medical Records view
   - Click "Messages" card
   - **Expected**: Opens chat interface
   - Click "Profile" card
   - **Expected**: Navigates to Profile view

### Test Result
- [ ] PASS - Patient dashboard navigation works correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 4: Booking Appointments

### Objective
Verify that patients can book appointments with doctors.

### Steps

1. **Login as Patient**
   - Use credentials from Test Case 1

2. **Navigate to Appointments**
   - Click "Appointments" in navbar

3. **Book New Appointment**
   - Click "Book New Appointment" button
   - **Expected**: Booking modal opens
   - Select a doctor from the dropdown
   - Select a date and time (at least 1 hour in the future)
   - Add optional notes: "Regular checkup"
   - Click "Book Appointment"
   - **Expected**: Success message "Appointment booked successfully!"
   - **Expected**: Modal closes
   - **Expected**: New appointment appears in the appointments list

4. **Verify Database Record**
   - Go to Supabase Dashboard > Database > appointments table
   - **Expected**: New appointment row exists with:
     - patient_id = your patient user ID
     - doctor_id = selected doctor's ID
     - status = 'scheduled'
     - jitsi_room_id is populated

### Test Result
- [ ] PASS - Appointment booking works correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 5: Doctor Dashboard and Appointment Management

### Objective
Verify that doctors can view and manage their appointments.

### Steps

1. **Login as Doctor**
   - Use credentials from Test Case 2

2. **Test Dashboard View**
   - **Expected**: Dashboard shows:
     - Welcome message with doctor name
     - Statistics cards (Today's Appointments, Total Patients, Completed This Month)
     - Today's schedule with upcoming appointments

3. **View All Appointments**
   - Click "Appointments" in navbar
   - **Expected**: List of all appointments appears
   - **Expected**: Each appointment shows patient name, contact info, date/time, status

4. **View Patient List**
   - Click "Patients" in navbar
   - **Expected**: List of patients appears
   - **Expected**: Each patient shows name, email, phone, member since date

### Test Result
- [ ] PASS - Doctor dashboard works correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 6: Conducting Consultations

### Objective
Verify that doctors can conduct consultations and add medical records.

### Steps

1. **Login as Doctor**
   - Use credentials from Test Case 2

2. **Navigate to Appointments**
   - Click "Appointments" in navbar

3. **Start Consultation**
   - Find a scheduled appointment
   - Click "Consult" button
   - **Expected**: Consultation modal opens

4. **Add SOAP Notes**
   - In the SOAP Notes field, enter:
     ```
     Subjective: Patient reports headache for 2 days
     Objective: Vital signs normal
     Assessment: Tension headache
     Plan: Prescribed pain relievers
     ```
   - Add a prescription:
     - Medication: "Ibuprofen"
     - Dosage: "400mg"
     - Instructions: "Take every 6 hours as needed"
   - Click "Add Medication" to add another prescription:
     - Medication: "Acetaminophen"
     - Dosage: "500mg"
     - Instructions: "Take every 4-6 hours as needed"
   - Check "Mark appointment as completed"
   - Click "Save Consultation"
   - **Expected**: Success message "Consultation saved successfully!"
   - **Expected**: Modal closes
   - **Expected**: Appointment status changes to "completed"

5. **Verify Database Records**
   - Go to Supabase Dashboard > Database > medical_records table
   - **Expected**: New medical record exists with SOAP notes
   - Go to Supabase Dashboard > Database > prescriptions table
   - **Expected**: Two prescription rows exist

### Test Result
- [ ] PASS - Consultation functionality works correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 7: Patient Viewing Medical Records

### Objective
Verify that patients can view their medical records and prescriptions.

### Steps

1. **Login as Patient**
   - Use credentials from Test Case 1

2. **Navigate to Medical Records**
   - Click "Medical Records" in navbar

3. **View Records**
   - **Expected**: List of medical records appears
   - Each record should show:
     - Doctor name and specialty
     - Date of consultation
     - SOAP notes
     - Prescriptions (if any)

4. **Verify Data Privacy**
   - Go to Supabase Dashboard > Database > medical_records table
   - **Expected**: Patient can only see their own records (RLS working)

### Test Result
- [ ] PASS - Medical records viewing works correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 8: Real-time Chat

### Objective
Verify that real-time chat works between patients and doctors.

### Steps

1. **Prepare Two Browser Sessions**
   - Open Browser A (e.g., Chrome)
   - Open Browser B (e.g., Firefox or Chrome incognito)

2. **Login as Patient in Browser A**
   - Use patient credentials from Test Case 1
   - Navigate to dashboard

3. **Login as Doctor in Browser B**
   - Use doctor credentials from Test Case 2
   - Navigate to dashboard

4. **Patient Initiates Chat**
   - In Browser A, click "Messages" card or navbar
   - **Expected**: Chat interface opens with conversation list
   - Click on a conversation with the doctor
   - Type message: "Hello Doctor, I have a question"
   - Click "Send" or press Enter
   - **Expected**: Message appears in sent state (blue, right-aligned)

5. **Doctor Receives Message**
   - In Browser B, click "Messages" or navigate to a patient and click "Message"
   - **Expected**: Message appears in received state (gray, left-aligned)
   - **Expected**: Message appears in real-time (no page refresh needed)

6. **Doctor Replies**
   - In Browser B, type reply: "Hello! How can I help you?"
   - Click "Send"
   - **Expected**: Message appears in sent state in Browser B

7. **Patient Receives Reply**
   - In Browser A
   - **Expected**: Reply appears in received state in real-time

8. **Verify Database**
   - Go to Supabase Dashboard > Database > messages table
   - **Expected**: Both messages exist with correct sender/receiver IDs

### Test Result
- [ ] PASS - Real-time chat works correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 9: Video Consultations

### Objective
Verify that Jitsi Meet video calls work correctly.

### Steps

1. **Prepare Two Browser Sessions**
   - Open Browser A and Browser B (different browsers or profiles)

2. **Login as Patient in Browser A**
   - Use patient credentials from Test Case 1
   - Navigate to Appointments

3. **Login as Doctor in Browser B**
   - Use doctor credentials from Test Case 2
   - Navigate to Appointments

4. **Patient Joins Video Call**
   - In Browser A, find a scheduled appointment
   - Click "Join Video Call"
   - **Expected**: Video call interface opens
   - **Expected**: Jitsi Meet room loads
   - **Expected**: Camera/microphone permissions requested
   - Allow camera/microphone access
   - **Expected**: Your video preview appears

5. **Doctor Joins Video Call**
   - In Browser B, find the same appointment
   - Click "Start Call"
   - **Expected**: Video call interface opens
   - **Expected**: Jitsi Meet room loads
   - Allow camera/microphone access
   - **Expected**: Both participants visible in the call

6. **Test Video Features**
   - Test microphone: Speak and verify audio is transmitted
   - Test camera: Verify video is clear
   - Test chat within Jitsi: Use the chat feature
   - Test screen sharing: Share screen if available
   - Test mute/unmute: Toggle microphone
   - Test video on/off: Toggle camera

7. **End Call**
   - Click "End Call" or hangup button in either browser
   - **Expected**: Call ends
   - **Expected**: Redirected to respective dashboard

8. **Verify Activity Log**
   - Go to Supabase Dashboard > Database > activity_logs table
   - **Expected**: Log entries for CALL_STARTED, CONFERENCE_JOINED, CONFERENCE_LEFT

### Test Result
- [ ] PASS - Video consultations work correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 10: Admin User Management

### Objective
Verify that admins can manage users in the system.

### Steps

1. **Login as Admin**
   - Use admin credentials created during setup
   - **Expected**: Redirect to Admin Dashboard

2. **View Dashboard**
   - **Expected**: Dashboard shows system statistics
   - **Expected**: Quick action cards for various admin functions

3. **View User Management**
   - Click "User Management" in navbar
   - **Expected**: List of all users appears
   - **Expected**: Each user shows name, email, role, specialty, created date

4. **Add New User**
   - Click "Add New User" button
   - **Expected**: Add user modal opens
   - Fill in:
     - Full Name: "Test Admin User"
     - Email: "adminuser@test.com"
     - Password: "test123456"
     - Role: "Admin"
   - Click "Add User"
   - **Expected**: Success message "User added successfully!"
   - **Expected**: New user appears in the list

5. **View All Appointments**
   - Click "All Appointments" in navbar
   - **Expected**: List of all appointments from all users appears

6. **Generate Reports**
   - Click "Reports" in navbar
   - **Expected**: Appointment statistics with progress bars
   - **Expected**: User statistics

7. **View Activity Logs**
   - Click "Activity Logs" in navbar
   - **Expected**: List of system activities appears
   - **Expected**: Each log shows user, action, details, timestamp

### Test Result
- [ ] PASS - Admin functionality works correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 11: Profile Management

### Objective
Verify that users can update their profiles.

### Steps

1. **Login as Patient**
   - Use patient credentials from Test Case 1

2. **Navigate to Profile**
   - Click "Profile" in navbar

3. **Update Profile**
   - Change Full Name to "Updated Patient Name"
   - Change Phone to "+254700000999"
   - Click "Update Profile"
   - **Expected**: Success message "Profile updated successfully!"

4. **Verify Update**
   - Navigate to Dashboard
   - **Expected**: Welcome message shows updated name
   - Go to Supabase Dashboard > Database > profiles table
   - **Expected**: Profile row shows updated values

5. **Test Doctor Profile Update**
   - Logout and login as doctor
   - Navigate to Profile
   - Update phone number
   - **Expected**: Update successful

### Test Result
- [ ] PASS - Profile management works correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 12: Appointment Cancellation

### Objective
Verify that appointments can be cancelled.

### Steps

1. **Login as Patient**
   - Use patient credentials from Test Case 1

2. **Navigate to Appointments**
   - Click "Appointments" in navbar

3. **Cancel Appointment**
   - Find a scheduled appointment
   - Click "Cancel" button
   - **Expected**: Confirmation dialog appears
   - Click "OK" to confirm
   - **Expected**: Success message "Appointment cancelled successfully!"
   - **Expected**: Appointment status changes to "cancelled"

4. **Verify Database**
   - Go to Supabase Dashboard > Database > appointments table
   - **Expected**: Appointment status = 'cancelled'

5. **Test Admin Cancellation**
   - Login as admin
   - Navigate to All Appointments
   - Cancel an appointment
   - **Expected**: Cancellation successful

### Test Result
- [ ] PASS - Appointment cancellation works correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 13: Security and Access Control

### Objective
Verify that Row Level Security (RLS) policies are working correctly.

### Steps

1. **Test Patient Access Restriction**
   - Login as Patient A
   - Try to access Patient B's medical records
   - **Expected**: Can only see own records
   - Try to access appointments for other patients
   - **Expected**: Can only see own appointments

2. **Test Doctor Access Restriction**
   - Login as Doctor A
   - Try to access medical records for patients not assigned
   - **Expected**: Can only see records for own patients
   - Try to access another doctor's appointments
   - **Expected**: Can only see own appointments

3. **Test Admin Access**
   - Login as admin
   - Navigate to various sections
   - **Expected**: Can view all data across the system

4. **Verify RLS Policies**
   - Go to Supabase Dashboard > Database > Authentication > Policies
   - **Expected**: All tables have RLS enabled
   - **Expected**: Policies are correctly defined for each role

### Test Result
- [ ] PASS - Security and access control work correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Case 14: Logout and Session Management

### Objective
Verify that logout works correctly and sessions are managed properly.

### Steps

1. **Login as Patient**
   - Use patient credentials

2. **Test Logout**
   - Click "Logout" button in navbar
   - **Expected**: Success message "Logged out successfully."
   - **Expected**: Redirected to login page

3. **Test Session Persistence**
   - Login again
   - Refresh the page
   - **Expected**: Still logged in (session persisted)
   - Close browser
   - Reopen browser and navigate to app
   - **Expected**: Redirected to login page (session expired)

4. **Verify Activity Logs**
   - Go to Supabase Dashboard > Database > activity_logs table
   - **Expected**: LOGOUT entries exist

### Test Result
- [ ] PASS - Logout and session management work correctly
- [ ] FAIL - Issues encountered (describe below)

---

## Test Summary

### Overall Results
- Total Test Cases: 14
- Passed: ___
- Failed: ___
- Pass Rate: ___%

### Issues Encountered

Document any issues found during testing:

1. **Issue**: 
   - **Severity**: (Low/Medium/High)
   - **Steps to Reproduce**: 
   - **Expected Behavior**: 
   - **Actual Behavior**: 
   - **Workaround**: 

2. **Issue**: 
   - **Severity**: (Low/Medium/High)
   - **Steps to Reproduce**: 
   - **Expected Behavior**: 
   - **Actual Behavior**: 
   - **Workaround**: 

### Recommendations

List any recommendations for improvement:

1. 
2. 
3. 

---

**Testing Completed By**: ____________________  
**Date**: ____________________  
**Environment**: (Development/Staging/Production)
