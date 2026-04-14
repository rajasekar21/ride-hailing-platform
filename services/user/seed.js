const { Sequelize, DataTypes } = require("sequelize");

const db = new Sequelize({
  dialect: "sqlite",
  storage: "users.db"
});

const User = db.define("User", {
  name: DataTypes.STRING
});

async function seed() {
  await db.sync({ force: true });

  await User.bulkCreate([
    { name: "Raja" },
    { name: "User1" },
    { name: "User2" }
  ]);

  console.log("✅ Users seeded");
}

seed();
