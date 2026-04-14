
const express=require("express");
const cors = require("cors");
const app = express();
const amqp=require("amqplib");
const {Sequelize,DataTypes}=require("sequelize");
const app=express();app.use(express.json());
const db=new Sequelize({dialect:"sqlite",storage:"rides.db"});
const R=db.define("R",{status:DataTypes.STRING}); db.sync();
let ch; (async()=>{const c=await amqp.connect("amqp://rabbitmq");ch=await c.createChannel();await ch.assertQueue("ride");})();
app.post("/rides",async(r,s)=>{let ride=await R.create({status:"NEW"});ch.sendToQueue("ride",Buffer.from(JSON.stringify({id:ride.id})));s.send(ride);});
app.use(cors());
app.use(express.json());
app.listen(3000);
