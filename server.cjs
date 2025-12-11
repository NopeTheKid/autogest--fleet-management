
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Database Setup
const db = new sqlite3.Database('./autogest.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

// --- EMAIL CONFIGURATION ---
// IMPORTANT: You must configure this with a real account to send emails.
// For Gmail, you'll need to create an "App Password". See: https://support.google.com/accounts/answer/185833
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER, // Set in .env file
    pass: process.env.MAIL_PASS      // Set in .env file
  }
});

// Verify mailer connection on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('Mailer configuration error:', error);
    console.log('Please check your .env file and make sure MAIL_USER and MAIL_PASS are correct.');
  } else {
    console.log('Mail server is ready to take our messages');
  }
});

// --- DAILY CHECK SCHEDULER (04:00 AM) ---
cron.schedule('0 4 * * *', () => {
  console.log(`[${new Date().toISOString()}] Running daily notification check...`);
  checkAndSendNotifications();  // TODO: Uncomment this line to enable daily email notifications
});

const checkAndSendNotifications = () => {
  // Calculate Target Date (Today + 30 days)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 30);
  const targetDateString = targetDate.toISOString().split('T')[0];

  console.log(`Checking for events due on or before ${targetDateString}`);

  const sql = `
    SELECT * FROM vehicles WHERE 
    (nextInspectionDate IS NOT NULL AND nextInspectionDate <= ?) OR
    (nextIucDate IS NOT NULL AND nextIucDate <= ?) OR
    (nextAnnualReviewDate IS NOT NULL AND nextAnnualReviewDate <= ?)
  `;

  db.all(sql, [targetDateString, targetDateString, targetDateString], (err, rows) => {
    if (err) {
      console.error('Error querying for notifications:', err);
      return;
    }

    if (rows.length === 0) {
      console.log('No upcoming or due alerts found.');
      return;
    }

    let emailBody = `
      <h2>⚠️ Alertas de Frota - AutoGest</h2>
      <p>Os seguintes eventos estão pendentes ou vencem nos próximos 30 dias (até <strong>${targetDateString}</strong>):</p>
      <ul>
    `;

    let eventCount = 0;
    rows.forEach(vehicle => {
      if (vehicle.nextInspectionDate && vehicle.nextInspectionDate <= targetDateString) {
        emailBody += `<li>🚗 <strong>${vehicle.make} ${vehicle.model}</strong> (${vehicle.plate}): Inspeção Periódica (IPO) em ${vehicle.nextInspectionDate}</li>`;
        eventCount++;
      }
      if (vehicle.nextIucDate && vehicle.nextIucDate <= targetDateString) {
        emailBody += `<li>📄 <strong>${vehicle.make} ${vehicle.model}</strong> (${vehicle.plate}): Pagamento de Selo (IUC) em ${vehicle.nextIucDate}</li>`;
        eventCount++;
      }
      if (vehicle.nextAnnualReviewDate && vehicle.nextAnnualReviewDate <= targetDateString) {
        emailBody += `<li>🔧 <strong>${vehicle.make} ${vehicle.model}</strong> (${vehicle.plate}): Revisão Anual em ${vehicle.nextAnnualReviewDate}</li>`;
        eventCount++;
      }
    });

    emailBody += `</ul><p>Aceda à aplicação para gerir estes alertas.</p>`;

    // Send Email
    const mailOptions = {
      from: `"AutoGest Bot" <${process.env.MAIL_USER}>`, // Must be the same as the 'user' in auth
      to: process.env.MAIL_TO,
      subject: `⚠️ Alerta AutoGest: ${eventCount} eventos próximos ou em atraso`,
      html: emailBody
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log('Error sending email:', error);
      }
      console.log('Notification email sent:', info.response);
    });
  });
};

// Helper to generate dynamic dates (Same as frontend to keep seed consistent)
const getRelativeDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

function initDb() {
  const sql = `
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      make TEXT,
      model TEXT,
      year INTEGER,
      plate TEXT,
      vin TEXT,
      fuel TEXT,
      engine TEXT,
      power TEXT,
      tires TEXT,
      color TEXT,
      image TEXT,
      km INTEGER,
      status TEXT,
      nextInspectionDate TEXT,
      nextInspectionStatus TEXT,
      nextIucDate TEXT,
      nextIucStatus TEXT,
      nextServiceKm INTEGER,
      nextServiceDate TEXT,
      lastAnnualReviewDate TEXT,
      nextAnnualReviewDate TEXT,
      history TEXT
    );
  `;
  
  db.run(sql, (err) => {
    if (err) return console.error(err.message);
    console.log('Vehicles table ready.');
  });
}

// Routes
app.get('/api/vehicles', (req, res) => {
  db.all("SELECT * FROM vehicles", [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    // Parse JSON history string back to object
    const vehicles = rows.map(v => ({
      ...v,
      history: v.history ? JSON.parse(v.history) : []
    }));
    res.json({
      message: "success",
      data: vehicles
    });
  });
});

app.post('/api/vehicles', (req, res) => {
  const v = req.body;
  const sql = `
    INSERT INTO vehicles VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, 
      ?, ?, ?, ?, ?, ?, 
      ?, ?, 
      ?, ?, 
      ?, ?, ?, ?, ?
    )
  `;
  const params = [
    v.id, v.make, v.model, v.year, v.plate, v.vin, v.fuel, v.engine,
    v.power, v.tires, v.color, v.image, v.km, v.status,
    v.nextInspectionDate, v.nextInspectionStatus,
    v.nextIucDate, v.nextIucStatus,
    v.nextServiceKm, v.nextServiceDate,
    v.lastAnnualReviewDate, v.nextAnnualReviewDate,
    JSON.stringify(v.history || [])
  ];
  
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "success", data: v, id: this.lastID });
  });
});

app.put('/api/vehicles/:id', (req, res) => {
  const v = req.body;
  const sql = `
    UPDATE vehicles SET 
      make=?, model=?, year=?, plate=?, vin=?,
      fuel=?, engine=?, power=?, tires=?, color=?,
      image=?, km=?, status=?, 
      nextInspectionDate=?, nextInspectionStatus=?,
      nextIucDate=?, nextIucStatus=?,
      nextServiceKm=?, nextServiceDate=?,
      lastAnnualReviewDate=?, nextAnnualReviewDate=?,
      history=?
    WHERE id=?
  `;
  const params = [
    v.make, v.model, v.year, v.plate, v.vin,
    v.fuel, v.engine, v.power, v.tires, v.color,
    v.image, v.km, v.status,
    v.nextInspectionDate, v.nextInspectionStatus,
    v.nextIucDate, v.nextIucStatus,
    v.nextServiceKm, v.nextServiceDate,
    v.lastAnnualReviewDate, v.nextAnnualReviewDate,
    JSON.stringify(v.history || []),
    req.params.id
  ];

  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "success", data: v, changes: this.changes });
  });
});

app.delete('/api/vehicles/:id', (req, res) => {
  const sql = 'DELETE FROM vehicles WHERE id = ?';
  const params = [req.params.id];
  
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "deleted", changes: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
