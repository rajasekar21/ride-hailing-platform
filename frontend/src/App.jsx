import { useEffect, useState } from "react";
import {
  acceptRide,
  cancelRide,
  completeRide,
  createDefaultRide,
  getDrivers,
  getPaymentMetrics,
  getRatingMetrics,
  getRideMetrics,
  getTrips,
  getUsers,
  rateTrip
} from "./api";
import "./App.css";

function App() {
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("Smooth ride.");
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) || null;
  const canRate = !!selectedTrip && selectedTrip.trip_status === "COMPLETED" && selectedTrip.payment_status === "PAID";

  const loadDashboard = async () => {
    const requests = await Promise.allSettled([
      getUsers(),
      getDrivers(),
      getTrips(),
      getRideMetrics(),
      getPaymentMetrics(),
      getRatingMetrics()
    ]);

    const [usersRes, driversRes, tripsRes, rideMetricsRes, paymentMetricsRes, ratingMetricsRes] = requests;
    const requestLabels = ["Riders", "Drivers", "Trips", "Ride metrics", "Payment metrics", "Rating metrics"];
    const nextWarnings = [];

    requests.forEach((result, idx) => {
      if (result.status === "rejected") {
        const reasonRaw = result.reason?.response?.data?.error || result.reason?.message || "request failed";
        const reason = String(reasonRaw).replace(/\s+/g, " ").trim();
        if (reason) {
          nextWarnings.push(`${requestLabels[idx]}: ${reason}`);
        }
      }
    });

    setUsers(usersRes.status === "fulfilled" ? usersRes.value.data || [] : []);
    setDrivers(driversRes.status === "fulfilled" ? driversRes.value.data || [] : []);
    setTrips(tripsRes.status === "fulfilled" ? tripsRes.value.data || [] : []);
    setMetrics({
      ...(rideMetricsRes.status === "fulfilled" ? rideMetricsRes.value.data : {}),
      ...(paymentMetricsRes.status === "fulfilled" ? paymentMetricsRes.value.data : {}),
      ...(ratingMetricsRes.status === "fulfilled" ? ratingMetricsRes.value.data : {})
    });

    setWarnings(nextWarnings);
    if (!nextWarnings.length) {
      setMessage("Dashboard synced successfully.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard();
    }, 0);
    const interval = setInterval(() => {
      loadDashboard();
    }, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const onAction = async (actionFn, successMessage) => {
    try {
      await actionFn();
      setMessage(successMessage);
      await loadDashboard();
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    }
  };

  if (loading) return <p className="loading">Loading dashboard...</p>;

  return (
    <div className="dashboard">
      <h1>Ride-Hailing Demo Dashboard</h1>
      <p className="message">{message || "Ready for assignment demo recording."}</p>
      {warnings.length > 0 && (
        <section className="warning-panel">
          <strong>Some services are unavailable:</strong>
          <ul>
            {warnings.map((warn) => (
              <li key={warn}>{warn}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Step 1: Create Trip</h2>
        <button onClick={() => onAction(() => createDefaultRide(), "Trip created successfully.")}>
          Create Sample Trip
        </button>
      </section>

      <section className="card">
        <h2>Step 2: Trip Lifecycle</h2>
        <label htmlFor="trip-select">Select Trip</label>
        <select
          id="trip-select"
          value={selectedTripId ?? ""}
          onChange={(e) => setSelectedTripId(Number(e.target.value) || null)}
        >
          <option value="">Choose a trip</option>
          {trips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              #{trip.id} | Rider {trip.rider_id} | {trip.trip_status}
            </option>
          ))}
        </select>
        <div className="actions">
          <button disabled={!selectedTripId} onClick={() => onAction(() => acceptRide(selectedTripId), "Trip accepted.")}>
            Accept
          </button>
          <button disabled={!selectedTripId} onClick={() => onAction(() => completeRide(selectedTripId), "Trip completed and payment attempted.")}>
            Complete + Charge
          </button>
          <button disabled={!selectedTripId} onClick={() => onAction(() => cancelRide(selectedTripId), "Trip cancelled.")}>
            Cancel
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Step 3: Submit Rating</h2>
        <div className="actions">
          <input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(Number(e.target.value))} />
          <input type="text" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          <button
            disabled={!canRate}
            onClick={() =>
              onAction(
                () =>
                  rateTrip(selectedTripId, {
                    rider_id: selectedTrip.rider_id,
                    driver_id: selectedTrip.driver_id,
                    rating,
                    feedback
                  }),
                "Rating submitted."
              )
            }
          >
            Rate Selected Completed & Paid Trip
          </button>
        </div>
        <small>
          Rating is enabled only after trip completion and successful payment (final step).
        </small>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Metrics</h3>
          <pre>{Object.keys(metrics).length ? JSON.stringify(metrics, null, 2) : "No metrics available yet."}</pre>
          <div className="metric-highlight">
            <span>Average Driver Rating</span>
            <strong>{metrics.avg_driver_rating ?? "N/A"}</strong>
          </div>
        </div>
        <div className="card">
          <h3>Riders ({users.length})</h3>
          <ul>
            {users.slice(0, 8).map((u) => (
              <li key={u.id || u.email}>{u.name}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Active Drivers ({drivers.length})</h3>
          <ul>
            {drivers.slice(0, 8).map((d) => (
              <li key={d.id}>{d.name} ({d.vehicle_plate})</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Trips ({trips.length})</h3>
          <ul>
            {trips.slice(0, 8).map((t) => (
              <li key={t.id}>#{t.id} - {t.trip_status} - INR {t.fare_amount || 0}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="card">
        <button onClick={loadDashboard}>Refresh Dashboard</button>
      </section>
    </div>
  );
}

export default App;
