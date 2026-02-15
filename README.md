# Autogest - Fleet Management System 🚗💼

Autogest is a streamlined fleet management solution designed to help organizations easily track, maintain, and manage their vehicles and drivers. Whether you are managing a small local delivery fleet or a large corporate motor pool, Autogest keeps your operations organized and efficient.

## ✨ Key Features
* **Vehicle Inventory:** Keep a detailed registry of all vehicles, including make, model, license plate, and current status.
* **Driver Management:** Assign vehicles to specific drivers and keep track of driver information.
* **Maintenance Tracking:** Log service history, repair costs, and upcoming maintenance schedules to keep the fleet safe and on the road.
* **Trip & Route Logging:** Monitor vehicle usage, mileage, and active assignments.
* **Reporting & Analytics:** Generate overviews of fleet health, operational costs, and vehicle availability.

## ⚙️ Installation & Setup
1. **Clone the repository:**
```bash
   git clone [https://github.com/NopeTheKid/autogest--fleet-management.git](https://github.com/NopeTheKid/autogest--fleet-management.git)
   cd autogest--fleet-management

```

2. **Install dependencies:**
```bash
# Example for Node/NPM:
npm install

# Example for Python:
pip install -r requirements.txt

```


3. **Environment Variables:**
Create a `.env` file in the root directory and configure your environment variables:
```env
# Server Port
PORT=3001
# The vehicle API
VITE_API_URL=''

# Nodemailer Gmail Configuration
# The email address used to send notifications.
MAIL_USER=""

# The 16-digit App Password generated from your Google Account.
MAIL_PASS=""

# The recipient's email address for notifications.
MAIL_TO=""

```

4. **Run the application:**
```bash
# Example command to start the server
npm start
# or
python run.py

```

## 🚀 Usage

Once the server is running, navigate to `http://localhost:[PORT]` in your web browser.

* **Admin Access:** Log in with the default administrator credentials (make sure to change these in production!) to start adding vehicles and drivers to the system.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

Distributed under the [MIT/GPL/etc] License. See `LICENSE` for more information.
