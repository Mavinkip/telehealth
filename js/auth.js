// When user selects 'admin' role, show warning/status
if (role === 'admin') {
    adminFields.style.display = 'block';
    const adminExists = await this.checkAdminExists();
    if (adminExists) {
        msg.innerHTML = `⚠️ An administrator already exists...`;
    } else {
        msg.innerHTML = `✅ No admin exists yet. You can register as the first administrator!`;
    }
}