require('dotenv').config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// připojení k MongoDB Atlas
const client = new MongoClient(process.env.MONGODB_URI);
const dbName = "dbapp";

// -------- MIDDLEWARE ----------
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Nepřihlášený." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Neplatný token." });
    req.user = user;
    next();
  });
}

// -------- REGISTRACE ----------
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection("users");

    const exists = await users.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email již existuje." });

    const hashedPwd = await bcrypt.hash(password, 10);
    await users.insertOne({ name, email, password: hashedPwd });

    res.json({ message: "Registrace proběhla úspěšně." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// -------- LOGIN ----------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection("users");

    const user = await users.findOne({ email });
    if (!user) return res.status(400).json({ message: "Uživatel s tímto emailem neexistuje." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Nesprávné heslo." });

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "2h" });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 2 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: false
    });

    res.json({ message: "Přihlášení úspěšné." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// -------- ADD STATION ----------
app.post("/add_station", authenticateToken, async (req, res) => {
  const { name, lat, lon, desc } = req.body;
  if (!name || !lat || !lon) return res.status(400).json({ message: "Chybí povinná pole." });

  try {
    await client.connect();
    const db = client.db(dbName);
    const stations = db.collection("stations");

    const newStation = {
      name,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      desc: desc || "",
      email: req.user.email,
      createdAt: new Date(),
    };

    const result = await stations.insertOne(newStation);
    res.json({ message: "Stanice přidána.", id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Chyba serveru." });
  }
});

// -------- GET ALL STATIONS ----------
app.get("/stations", authenticateToken, async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const stations = db.collection("stations");

    const allStations = await stations.find().toArray();
    res.json(allStations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Chyba serveru." });
  }
});

// -------- DELETE STATION ----------
app.delete("/delete_station/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await client.connect();
    const db = client.db(dbName);
    const stations = db.collection("stations");

    const { ObjectId } = require("mongodb");
    const result = await stations.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Stanice nenalezena." });

    res.json({ message: "Stanice smazána." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Chyba serveru." });
  }
});

// -------- ADD RECORD ----------
app.post("/add_record", authenticateToken, async (req, res) => {
  const { stationId, recordTime, people, bikes, cars } = req.body;

  if (!stationId || !recordTime || people === undefined || bikes === undefined || cars === undefined) {
    return res.status(400).json({ message: "Chybí povinná pole." });
  }

  try {
    await client.connect();
    const db = client.db(dbName);
    const records = db.collection("records");

    // použij čas z formuláře
    const timestamp = new Date(recordTime);

    const newRecord = {
      stationId,
      timestamp,
      people: parseInt(people),
      bikes: parseInt(bikes),
      cars: parseInt(cars),
      createdBy: req.user.email
    };

    const result = await records.insertOne(newRecord);

    res.json({ message: "Záznam přidán.", id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Chyba serveru." });
  }
});



// -------- GET RECORDS FOR STATION ----------
app.get("/records/:stationId", authenticateToken, async (req, res) => {
  const { stationId } = req.params;
  try {
    await client.connect();
    const db = client.db(dbName);
    const records = db.collection("records");
    const stations = db.collection("stations");

    const { ObjectId } = require("mongodb");

    // ověříme, zda stanice existuje
    const station = await stations.findOne({ _id: new ObjectId(stationId) });
    if (!station) return res.status(404).json({ message: "Stanice nenalezena." });

    // načteme všechny záznamy pro tuto stanici, seřazené podle času
    const allRecords = await records
      .find({ stationId: stationId })
      .sort({ time: 1 })
      .toArray();

    // přidáme název stanice do každého záznamu (volitelné)
    const result = allRecords.map(r => ({
      ...r,
      stationName: station.name
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Chyba serveru." });
  }
});

// -------- CHECK LOGIN ----------
app.get("/auth/check", authenticateToken, (req, res) => {
  res.json({ logged: true, user: req.user });
});


// -------- LOGOUT ----------
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Odhlášeno." });
});

app.listen(PORT, () => console.log(`Server běží na https://dppage.onrender.com:${PORT}`));
