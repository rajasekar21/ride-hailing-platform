
const e=require("express");const j=require("jsonwebtoken");const a=e();a.use(e.json());
a.post("/login",(r,s)=>s.send({token:j.sign({u:r.body.u},"secret")}));
a.listen(3000);
