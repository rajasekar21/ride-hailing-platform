
const amqp=require("amqplib");
(async()=>{const c=await amqp.connect("amqp://rabbitmq");const ch=await c.createChannel();
await ch.assertQueue("payment");await ch.assertQueue("notify");
ch.consume("payment",msg=>{let d=JSON.parse(msg.content.toString());
console.log("Payment success",d.rideId);
ch.sendToQueue("notify",Buffer.from(JSON.stringify(d)));
ch.ack(msg);});})();
