const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const { Sequelize, DataTypes } = require("sequelize");

const db = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "drivers.db"
});

const Driver = db.define("Driver", {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  name: DataTypes.STRING,
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  vehicle_type: DataTypes.STRING,
  vehicle_plate: DataTypes.STRING,
  is_active: DataTypes.BOOLEAN,
  city: DataTypes.STRING,
  created_at: DataTypes.STRING
});

async function seed() {
  await db.sync({ force: true });

  const results = [];
  const filePath = process.env.DATASET_FILE || path.join(__dirname, "drivers.csv");

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push({
        id: parseInt(data.driver_id, 10),
        name: data.name,
        phone: data.phone,
        email: data.email,
        vehicle_type: data.vehicle_type,
        vehicle_plate: data.vehicle_plate,
        is_active: data.is_active.toLowerCase() === "true",
        city: data.city,
        created_at: data.created_at
      });
    })
    .on("end", async () => {
      await Driver.bulkCreate(results, { ignoreDuplicates: true });
      console.log(`✅ Seeded ${results.length} drivers`);
    });
}

seed();