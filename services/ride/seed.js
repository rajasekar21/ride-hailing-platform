const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const { Sequelize, DataTypes } = require("sequelize");

const db = new Sequelize({
  dialect: "sqlite",
  storage: "rides.db"
});

const Ride = db.define("Ride", {
  status: DataTypes.STRING
});

async function seed() {
  await db.sync({ force: true });

  const results = [];
  const filePath = path.join(__dirname, "trips.csv");

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => results.push({ status: "COMPLETED" }))
    .on("end", async () => {
      await Ride.bulkCreate(results);
      console.log(`✅ Seeded ${results.length} rides`);
    });
}

seed();
