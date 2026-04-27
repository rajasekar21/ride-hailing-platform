const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const { Sequelize, DataTypes } = require("sequelize");

const db = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "payments.db"
});

const Payment = db.define("Payment", {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  trip_id: DataTypes.INTEGER,
  amount: DataTypes.FLOAT,
  currency: { type: DataTypes.STRING, defaultValue: "INR" },
  status: DataTypes.STRING,
  method: DataTypes.STRING,
  reference: DataTypes.STRING,
  created_at: DataTypes.STRING,
  refunded_at: DataTypes.STRING,
  refund_amount: DataTypes.FLOAT
});

async function seed() {
  await db.sync({ force: true });

  const results = [];
  const filePath = process.env.DATASET_FILE || path.join(__dirname, "payments.csv");

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push({
        id: parseInt(data.payment_id, 10),
        trip_id: parseInt(data.trip_id, 10),
        amount: parseFloat(data.amount),
        status: data.status,
        method: data.method,
        reference: data.reference,
        created_at: data.created_at
      });
    })
    .on("end", async () => {
      await Payment.bulkCreate(results, { ignoreDuplicates: true });
      console.log(`✅ Seeded ${results.length} payments`);
    });
}

seed();