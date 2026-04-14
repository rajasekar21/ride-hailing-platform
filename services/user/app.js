
const express=require("express");
const cors = require("cors");
const app = express();
const {Sequelize,DataTypes}=require("sequelize");
const app=express(); app.use(express.json());
const db=new Sequelize({dialect:"sqlite",storage:"users.db"});
const U=db.define("U",{name:DataTypes.STRING}); db.sync();
app.get("/users",async(r,s)=>s.send(await U.findAll()));
app.use(cors());
app.use(express.json());
app.post("/users",async(r,s)=>s.send(await U.create(r.body)));
app.listen(3000);
