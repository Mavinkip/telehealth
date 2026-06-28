# Telehealth Communication System

A comprehensive web-based telehealth platform for remote healthcare consultations, built for Kabarak University, Department of Telecommunication.

## Features

- **Patient Module**: Book appointments, view medical records, chat with doctors, join video consultations
- **Doctor Module**: Manage appointments, conduct video consultations, prescribe medication, update patient records
- **Admin Module**: User management, appointment oversight, system reports, activity monitoring
- **Real-time Chat**: Secure messaging between patients and doctors using Supabase Realtime
- **Video Consultations**: Integrated Jitsi Meet for high-quality video calls
- **Secure Authentication**: Role-based access control with Supabase Auth
- **HIPAA-aware Security**: Row Level Security (RLS) policies for data protection

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Backend**: Supabase (PostgreSQL database, Auth, Realtime, Storage)
- **Video**: Jitsi Meet External API
- **Hosting**: Static hosting (any web server or CDN)

## Project Structure

```
health/
├── index.html                 # Main HTML entry point
├── css/
│   └── styles.css           # Custom styling with Bootstrap 5
├── js/
│   ├── config.js            # Supabase and Jitsi configuration
│   ├── auth.js              # Authentication (login, register, session)
│   ├── patient.js           # Patient-specific functionality
│   ├── doctor.js            # Doctor-specific functionality
│   ├── admin.js             # Admin-specific functionality
│   ├── chat.js              # Real-time chat functionality
│   ├── video.js             # Jitsi video integration
│   └── app.js               # Main application initialization
└── supabase/
    ├── schema.sql           # Database schema with RLS policies
    └── seed_data.sql        # Sample data for testing
```

## Installation Instructions

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- A Supabase account (free tier works)
- Basic knowledge of web development

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Click "New Project"
4. Enter project details:
   - **Name**: telehealth-system (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Choose the region closest to you
5. Wait for the project to be created (2-3 minutes)

### Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Project Settings** > **API**
2. Copy the following values:
   - **Project URL**: e.g., `https://your-project.supabase.co`
   - **anon public key**: e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 3: Configure the Application

1. Open `js/config.js` in a text editor
2. Replace the placeholder values with your Supabase credentials:

```javascript
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_PROJECT_URL',  // Replace with your Project URL
    anonKey: 'YOUR_SUPABASE_ANON_KEY'  // Replace with your anon public key
};
```

3. Save the file

### Step 4: Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `supabase/schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the schema
6. Wait for the schema to be created (you should see "Success" message)

### Step 5: Load Sample Data (Optional but Recommended)

1. In the SQL Editor, click "New Query"
2. Copy the contents of `supabase/seed_data.sql`
3. Paste it into the SQL Editor
4. Click "Run" to load sample data
5. You should see a success message with data counts

### Step 6: Enable Realtime for Chat

1. In your Supabase dashboard, go to **Database** > **Replication**
2. Click "Add a publication"
3. Name it: `supabase_realtime`
4. Select the `messages` table
5. Click "Save"

### Step 7: Create an Admin User

Since the sample data doesn't include auth users (only profiles), you need to create an admin user:

1. In your Supabase dashboard, go to **Authentication** > **Users**
2. Click "Add User" > "Create New User"
3. Enter:
   - **Email**: admin@telehealth.com (or your preferred email)
   - **Password**: Choose a strong password
   - **Auto Confirm User**: Check this box
4. Click "Create User"
5. Go to **SQL Editor** and run:

```sql
-- Update the user's role to admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@telehealth.com';
```

### Step 8: Run the Application

Since this is a static frontend, you have several options:

**Option A: Simple HTTP Server (Python)**
```bash
cd /home/delva/Downloads/me/game/health
python3 -m http.server 8000
```
Then open: http://localhost:8000

**Option B: Simple HTTP Server (Node.js)**
```bash
cd /home/delva/Downloads/me/game/health
npx http-server -p 8000
```
Then open: http://localhost:8000

**Option C: VS Code Live Server**
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

**Option D: Direct File Access**
Simply open `index.html` directly in your browser (some features may have CORS issues)

## Testing Instructions

### Test Patient Account

1. Register a new patient account:
   - Click "Register" on the login page
   - Fill in: Full Name, Email, Password, Role: Patient
   - Click "Register"
   - Check your email for verification (or use auto-confirm in Supabase)
2. Login with your patient credentials
3. Test features:
   - View dashboard
   - Book an appointment with a doctor
   - View medical records (empty for new users)
   - Update profile

### Test Doctor Account

1. Register a new doctor account:
   - Click "Register" on the login page
   - Fill in: Full Name, Email, Password, Role: Doctor
   - Select a specialty
   - Click "Register"
2. Login with your doctor credentials
3. Test features:
   - View dashboard with appointment statistics
   - View scheduled appointments
   - View patient list
   - Conduct consultation (add SOAP notes, prescribe medication)

### Test Admin Account

1. Login with your admin account (created in Step 7)
2. Test features:
   - View system statistics
   - Manage users (add, edit, delete)
   - View all appointments
   - Generate reports
   - View activity logs

### Test Video Consultations

1. As a patient, book an appointment with a doctor
2. As the doctor, view the appointment on the dashboard
3. At the scheduled time, click "Start Call" (doctor) or "Join Video Call" (patient)
4. Both participants should join the Jitsi Meet room
5. Test audio/video functionality
6. End the call when done

### Test Real-time Chat

1. Open the application in two different browsers (or use incognito mode)
2. Login as a patient in one browser
3. Login as a doctor in another browser
4. As the patient, click "Messages" on the dashboard
5. Select a conversation with the doctor
6. Send a message
7. The message should appear in real-time in the doctor's chat interface
8. Reply from the doctor's side
9. Verify the message appears in the patient's chat

### Test Complete Workflow

1. **Patient registers** and logs in
2. **Patient books an appointment** with a doctor
3. **Doctor sees the appointment** on their dashboard
4. **At appointment time**, both join the video call
5. **Doctor conducts consultation** and adds SOAP notes
6. **Doctor prescribes medication** if needed
7. **Doctor marks appointment as completed**
8. **Patient views medical records** and prescriptions
9. **Patient and doctor chat** for follow-up questions

## Troubleshooting

### Configuration Warning on Startup

**Problem**: You see a warning about Supabase configuration
**Solution**: 
- Open `js/config.js`
- Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual credentials
- Refresh the page

### Authentication Errors

**Problem**: Login/registration fails
**Solutions**:
- Verify your Supabase credentials in `js/config.js`
- Check that email confirmation is disabled (for testing) or confirm your email
- Ensure the database schema is properly set up
- Check browser console for specific error messages

### Realtime Chat Not Working

**Problem**: Messages don't appear in real-time
**Solutions**:
- Verify that Realtime is enabled for the `messages` table in Supabase
- Check that the publication includes the `messages` table
- Ensure your Supabase project has Realtime enabled (free tier includes it)
- Check browser console for WebSocket connection errors

### Video Call Issues

**Problem**: Jitsi video call doesn't load or has issues
**Solutions**:
- Check your internet connection
- Ensure browser permissions allow camera/microphone access
- Try a different browser (Chrome/Firefox recommended)
- Check browser console for Jitsi API errors
- Verify that `meet.jit.si` is accessible from your network

### Database Permission Errors

**Problem**: Operations fail with permission errors
**Solutions**:
- Verify RLS policies are correctly set up
- Check that your user has the correct role in the `profiles` table
- Ensure the trigger `handle_new_user` is working for new registrations
- Check Supabase logs for detailed error information

### CORS Issues

**Problem**: Requests fail with CORS errors when opening files directly
**Solution**: Use a local web server (see Step 8) instead of opening files directly

## Security Considerations

This is a university project demonstration. For production use, consider:

1. **HTTPS**: Always use HTTPS in production
2. **Environment Variables**: Store sensitive credentials in environment variables, not in code
3. **Additional Validation**: Add server-side validation beyond client-side
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Audit Logging**: Enhance activity logging for compliance
6. **Data Encryption**: Ensure all sensitive data is encrypted at rest
7. **Regular Security Audits**: Conduct regular security assessments

## Customization

### Changing Colors

Edit `css/styles.css` to modify the color scheme:

```css
:root {
    --primary-color: #0087CC;      /* Main brand color */
    --secondary-color: #2C3E50;    /* Text color */
    --background-light: #F4F8FB;   /* Background color */
    --success-color: #28a745;      /* Success messages */
    --danger-color: #dc3545;       /* Error messages */
}
```

### Adding New Features

The modular structure makes it easy to add features:

1. **New patient features**: Edit `js/patient.js`
2. **New doctor features**: Edit `js/doctor.js`
3. **New admin features**: Edit `js/admin.js`
4. **New database tables**: Add to `supabase/schema.sql`
5. **New UI components**: Add to `index.html` and `css/styles.css`

## Support and Documentation

- **Supabase Documentation**: https://supabase.com/docs
- **Jitsi Meet API**: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe
- **Bootstrap 5**: https://getbootstrap.com/docs/5.3/

## License

This is a university project for educational purposes.

## Acknowledgments

- Kabarak University, Department of Telecommunication
- Supabase for the excellent BaaS platform
- Jitsi Meet for the video conferencing solution
- Bootstrap for the UI framework

---

**Project Version**: 1.0.0  
**Last Updated**: June 2026  
**Developer**: University Project Team
