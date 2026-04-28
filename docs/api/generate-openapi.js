const path = require("path");
const swaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" });

const outputFile = path.join(__dirname, "openapi.json");
const endpointsFiles = [
  path.join(__dirname, "../../services/auth/app.js"),
  path.join(__dirname, "../../services/user/app.js"),
  path.join(__dirname, "../../services/driver/app.js"),
  path.join(__dirname, "../../services/ride/app.js"),
  path.join(__dirname, "../../services/payment/index.js"),
  path.join(__dirname, "../../services/notification/app.js"),
  path.join(__dirname, "../../services/rating/app.js")
];

const doc = {
  info: {
    title: "Ride Hailing Microservices API",
    description: "Auto-generated from service route code using swagger-autogen.",
    version: "1.0.0"
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local service URL (set per service when testing)"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  }
};

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log(`OpenAPI generated: ${outputFile}`);
});
