import axios from "axios";

const USER_BASE = import.meta.env.VITE_USER_BASE;
const RIDE_BASE = import.meta.env.VITE_API_BASE;

export const getUsers = () => axios.get(`${USER_BASE}/v1/riders`);
export const createRide = () =>
  axios.post(`${RIDE_BASE}/v1/trips`, {
    rider_id: 1,
    pickup_location: "100 Main Rd, MG Road",
    drop_location: "200 Cross, Viman Nagar",
    city: "Bengaluru",
    distance_km: 8.5,
    surge_multiplier: 1.2,
    base_fare: 50.0
  });
