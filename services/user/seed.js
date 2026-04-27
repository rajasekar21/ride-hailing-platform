const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const { Sequelize, DataTypes } = require("sequelize");

const db = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "users.db"
});

const Rider = db.define("Rider", {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  city: DataTypes.STRING,
  created_at: DataTypes.STRING
});

async function seed() {
  await db.sync({ force: true });

  const results = [];
  const filePath = process.env.DATASET_FILE || path.join(__dirname, "users.csv");

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push({
        id: parseInt(data.rider_id, 10),
        name: data.name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        created_at: data.created_at
      });
    })
    .on("end", async () => {
      await Rider.bulkCreate(results, { ignoreDuplicates: true });
      console.log(`✅ Seeded ${results.length} riders`);
    });
}

seed();
