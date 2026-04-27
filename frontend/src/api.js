import axios from "axios";

const USER_BASE = import.meta.env.VITE_USER_BASE || "http://localhost:3001";
const RIDE_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const DRIVER_BASE = import.meta.env.VITE_DRIVER_BASE || "http://localhost:3002";
const PAYMENT_BASE = import.meta.env.VITE_PAYMENT_BASE || "http://localhost:3003";
const RATING_BASE = import.meta.env.VITE_RATING_BASE || "http://localhost:3005";

const requestId = () => `demo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const traceId = () => `trace-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const withHeaders = () => {
  const reqId = requestId();
  return {
    headers: {
      "X-Request-ID": reqId,
      "X-Trace-ID": reqId + "-" + traceId()
    },
    timeout: 10000
  };
};

export const getUsers = () => axios.get(`${USER_BASE}/v1/riders`);
export const getDrivers = () => axios.get(`${DRIVER_BASE}/v1/drivers?active=true`);
export const getTrips = () => axios.get(`${RIDE_BASE}/v1/trips`);
export const getTripById = (tripId) => axios.get(`${RIDE_BASE}/v1/trips/${tripId}`);
export const getPaymentById = (paymentId) => axios.get(`${PAYMENT_BASE}/v1/payments/${paymentId}`);
export const getRideMetrics = () => axios.get(`${RIDE_BASE}/metrics`);
export const getPaymentMetrics = () => axios.get(`${PAYMENT_BASE}/metrics`);
export const getRatingMetrics = () => axios.get(`${RATING_BASE}/metrics`);

export const createRide = (payload) =>
  axios.post(`${RIDE_BASE}/v1/trips`, payload, withHeaders());

export const acceptRide = (tripId) =>
  axios.post(`${RIDE_BASE}/v1/trips/${tripId}/accept`, {}, withHeaders());

export const completeRide = (tripId) =>
  axios.post(`${RIDE_BASE}/v1/trips/${tripId}/complete?mode=async`, {}, withHeaders());

export const cancelRide = (tripId) =>
  axios.post(`${RIDE_BASE}/v1/trips/${tripId}/cancel`, {}, withHeaders());

export const rateTrip = (tripId, payload) =>
  axios.post(`${RATING_BASE}/v1/trips/${tripId}/rating`, payload, withHeaders());

export const createDefaultRide = () =>
  createRide({
    rider_id: 1,
    pickup_location: "100 Main Rd, MG Road",
    drop_location: "200 Cross, Viman Nagar",
    city: "Bengaluru",
    distance_km: 8.5,
    surge_multiplier: 1.2,
    base_fare: 50.0
  });
