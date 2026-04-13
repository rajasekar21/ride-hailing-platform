
const amqp=require("amqplib");
(async()=>{const c=await amqp.connect("amqp://rabbitmq");const ch=await c.createChannel();
await ch.assertQueue("notify");
ch.consume("notify",msg=>{console.log("Notify",msg.content.toString());ch.ack(msg);});})();
