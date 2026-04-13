
const amqp=require("amqplib");
(async()=>{const c=await amqp.connect("amqp://rabbitmq");const ch=await c.createChannel();
await ch.assertQueue("ride");await ch.assertQueue("payment");
ch.consume("ride",msg=>{let d=JSON.parse(msg.content.toString());
console.log("Driver assigned",d.id);
ch.sendToQueue("payment",Buffer.from(JSON.stringify({rideId:d.id})));
ch.ack(msg);});})();
