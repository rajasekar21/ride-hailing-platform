import axios from "axios";

const USER_BASE = import.meta.env.VITE_USER_BASE;
const RIDE_BASE = import.meta.env.VITE_API_BASE;

export const getUsers = () => axios.get(`${USER_BASE}/users`);
export const createRide = () => axios.post(`${RIDE_BASE}/rides`);
