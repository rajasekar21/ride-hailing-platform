import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  acceptRide,
  cancelRide,
  chargePayment,
  completeRide,
  createDriver,
  createRide,
  createUser,
  getAllDrivers,
  getPaymentById,
  getPaymentMetrics,
  getRatingMetrics,
  getRideMetrics,
  getTrips,
  getUserById,
  getUsers,
  rateTrip,
  refundPayment,
  updateDriverStatus,
  updateUser
} from "./api";
import "./App.css";

function App() {
  const PAGES = {
    OVERVIEW: "overview",
    RIDER: "rider",
    DRIVER: "driver",
    TRIP: "trip",
    PAYMENT: "payment",
    RATING: "rating"
  };
  const [activePage, setActivePage] = useState(PAGES.OVERVIEW);
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [paymentLookup, setPaymentLookup] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("Smooth ride.");
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoRunning, setDemoRunning] = useState(false);
  const [socket, setSocket] = useState(null);
  const [liveLocation, setLiveLocation] = useState({});

  const [riderForm, setRiderForm] = useState({ name: "", email: "", phone: "", city: "Bengaluru" });
  const [riderLookupId, setRiderLookupId] = useState("");
  const [riderLookupData, setRiderLookupData] = useState(null);
  const [riderUpdate, setRiderUpdate] = useState({ id: "", name: "", email: "", phone: "", city: "" });

  const [driverForm, setDriverForm] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    vehicle_type: "Sedan",
    vehicle_plate: "",
    city: "Bengaluru",
    is_active: true
  });
  const [driverStatusForm, setDriverStatusForm] = useState({ id: "", is_active: true });

  const [tripForm, setTripForm] = useState({
    rider_id: 1,
    pickup_location: "MG Road",
    drop_location: "Airport",
    city: "Bengaluru",
    distance_km: 8.5,
    surge_multiplier: 1.2
  });

  const [paymentForm, setPaymentForm] = useState({
    trip_id: "",
    amount: "",
    method: "CARD",
    idempotency_key: ""
  });
  const [refundPaymentId, setRefundPaymentId] = useState("");

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) || null;
  const canRate = !!selectedTrip && selectedTrip.trip_status === "COMPLETED" && selectedTrip.payment_status === "PAID";
  const pageOrder = [PAGES.OVERVIEW, PAGES.RIDER, PAGES.DRIVER, PAGES.TRIP, PAGES.PAYMENT, PAGES.RATING];
  const pageLabel = {
    [PAGES.OVERVIEW]: "Overview",
    [PAGES.RIDER]: "Rider Page",
    [PAGES.DRIVER]: "Driver Page",
    [PAGES.TRIP]: "Trip Page",
    [PAGES.PAYMENT]: "Payment Page",
    [PAGES.RATING]: "Rating Page"
  };
  const demoHint = {
    [PAGES.OVERVIEW]: "Explain architecture and the end-to-end demo journey.",
    [PAGES.RIDER]: "Create and update a rider to demonstrate Rider Service CRUD.",
    [PAGES.DRIVER]: "Onboard a driver and toggle active status for assignment readiness.",
    [PAGES.TRIP]: "Create a trip, then accept and complete it to show lifecycle transitions.",
    [PAGES.PAYMENT]: "Charge completed trip payment, then fetch or refund a sample payment.",
    [PAGES.RATING]: "Submit rating only for completed + paid trip to prove business rule."
  };
  const currentPageIndex = pageOrder.indexOf(activePage);
  const nextPage = pageOrder[Math.min(currentPageIndex + 1, pageOrder.length - 1)];
  const prevPage = pageOrder[Math.max(currentPageIndex - 1, 0)];

  const loadDashboard = async () => {
    const requests = await Promise.allSettled([
      getUsers(),
      getAllDrivers(),
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

  useEffect(() => {
    const getSocketServiceUrl = () => {
      return window.location.origin;
    };

    const newSocket = io(getSocketServiceUrl());
    setSocket(newSocket);

    newSocket.on('location-update', (data) => {
      setLiveLocation((prev) => ({ ...prev, [data.tripId]: data.location }));
    });

    return () => newSocket.close();
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

  const onLookupRider = async () => {
    try {
      const res = await getUserById(Number(riderLookupId));
      setRiderLookupData(res.data);
      setMessage(`Fetched rider #${riderLookupId}.`);
    } catch (err) {
      setRiderLookupData(null);
      setMessage(err.response?.data?.error || err.message);
    }
  };

  const onLookupPayment = async () => {
    try {
      const res = await getPaymentById(Number(refundPaymentId));
      setPaymentLookup(res.data);
      setMessage(`Fetched payment #${refundPaymentId}.`);
    } catch (err) {
      setPaymentLookup(null);
      setMessage(err.response?.data?.error || err.message);
    }
  };

  const runFullDemoFlow = async () => {
    try {
      setDemoRunning(true);
      setMessage("Running demo flow: create -> accept -> complete -> rate...");
      const created = await createRide(tripForm);
      const createdTrip = created.data || {};
      const tripId = createdTrip.id;
      if (!tripId) {
        throw new Error("Trip creation did not return an id");
      }

      const accepted = await acceptRide(tripId);
      const acceptedTrip = accepted.data || {};

      const completed = await completeRide(tripId);
      const completedTrip = completed.data?.trip || completed.data || {};
      const riderId = completedTrip.rider_id || acceptedTrip.rider_id || createdTrip.rider_id;
      const driverId = completedTrip.driver_id || acceptedTrip.driver_id;

      await new Promise((resolve) => setTimeout(resolve, 7000));
      if (riderId && driverId) {
        await rateTrip(tripId, { rider_id: riderId, driver_id: driverId, rating, feedback });
      }

      setSelectedTripId(tripId);
      await loadDashboard();
      setMessage(`Demo flow completed for trip #${tripId}.`);
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    } finally {
      setDemoRunning(false);
    }
  };

  if (loading) return <p className="loading">Loading dashboard...</p>;

  return (
    <div className="layout">
      <aside className="sidebar card">
        <h2>Demo Pages</h2>
        <p className="sidebar-subtext">Use this guided flow while recording.</p>
        <div className="tab-nav vertical">
          {pageOrder.map((pageKey, idx) => (
            <button key={pageKey} className={activePage === pageKey ? "tab active" : "tab"} onClick={() => setActivePage(pageKey)}>
              {idx + 1}. {pageLabel[pageKey]}
            </button>
          ))}
        </div>
        <div className="demo-nav">
          <button disabled={currentPageIndex === 0} onClick={() => setActivePage(prevPage)}>Previous Step</button>
          <button disabled={currentPageIndex === pageOrder.length - 1} onClick={() => setActivePage(nextPage)}>Next Step</button>
        </div>
      </aside>

      <div className="dashboard">
      <h1>Ride-Hailing Demo Dashboard</h1>
      <p className="message">{message || "Ready for assignment demo recording."}</p>
      <section className="card presenter-note">
        <strong>Presenter hint:</strong> {demoHint[activePage]}
      </section>
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
        <div className="section-header">
          <h2>Quick Assignment Demo</h2>
          <span className="badge required">Required</span>
        </div>
        <p>Runs create trip, accept, complete, and rating automatically.</p>
        <button disabled={demoRunning} onClick={runFullDemoFlow}>
          {demoRunning ? "Running..." : "Run Full Demo Flow"}
        </button>
      </section>

      {activePage === PAGES.OVERVIEW && (
      <>
      <section className="card">
        <div className="section-header">
          <h2>Demo Journey</h2>
          <span className="badge required">Required</span>
        </div>
        <p>1) Create rider and driver → 2) Create trip → 3) Accept and complete trip → 4) Charge/refund payment → 5) Add rating.</p>
      </section>
      <section className="grid">
        <div className="card">
          <h3>Key Metrics</h3>
          <div className="metric-grid">
            <div className="metric-card">
              <span>Total Riders</span>
              <strong>{users.length}</strong>
            </div>
            <div className="metric-card">
              <span>Total Drivers</span>
              <strong>{drivers.length}</strong>
            </div>
            <div className="metric-card">
              <span>Total Trips</span>
              <strong>{trips.length}</strong>
            </div>
            <div className="metric-card">
              <span>Average Driver Rating</span>
              <strong>{metrics.avg_driver_rating ?? "N/A"}</strong>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Top Riders</h3>
          <ul>
            {users.slice(0, 8).map((u) => (
              <li key={u.id || u.email}>{u.name}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Top Drivers</h3>
          <ul>
            {drivers.slice(0, 8).map((d) => (
              <li key={d.id}>{d.name} ({d.vehicle_plate})</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Recent Trips</h3>
          <ul>
            {trips.slice(0, 8).map((t) => (
              <li key={t.id}>#{t.id} - {t.trip_status} - INR {t.fare_amount || 0}</li>
            ))}
          </ul>
        </div>
      </section>
      </>
      )}

      {activePage === PAGES.RIDER && (
      <section className="card">
        <div className="section-header">
          <h2>Rider Service (`/v1/riders`, `/v1/riders/{"{"}id{"}"}`)</h2>
          <span className="badge required">Required</span>
        </div>
        <div className="grid">
          <div>
            <h3>Create Rider</h3>
            <div className="actions">
              <input placeholder="Name" value={riderForm.name} onChange={(e) => setRiderForm((p) => ({ ...p, name: e.target.value }))} />
              <input placeholder="Email" value={riderForm.email} onChange={(e) => setRiderForm((p) => ({ ...p, email: e.target.value }))} />
              <input placeholder="Phone" value={riderForm.phone} onChange={(e) => setRiderForm((p) => ({ ...p, phone: e.target.value }))} />
              <input placeholder="City" value={riderForm.city} onChange={(e) => setRiderForm((p) => ({ ...p, city: e.target.value }))} />
              <button onClick={() => onAction(() => createUser(riderForm), "Rider created.")}>Create Rider</button>
            </div>
          </div>
          <div>
            <h3>Get Rider By ID</h3>
            <div className="actions">
              <input type="number" placeholder="Rider ID" value={riderLookupId} onChange={(e) => setRiderLookupId(e.target.value)} />
              <button disabled={!riderLookupId} onClick={onLookupRider}>Fetch Rider</button>
            </div>
            {riderLookupData && <pre>{JSON.stringify(riderLookupData, null, 2)}</pre>}
          </div>
          <div>
            <h3>Update Rider</h3>
            <div className="actions">
              <input type="number" placeholder="Rider ID" value={riderUpdate.id} onChange={(e) => setRiderUpdate((p) => ({ ...p, id: e.target.value }))} />
              <input placeholder="Name" value={riderUpdate.name} onChange={(e) => setRiderUpdate((p) => ({ ...p, name: e.target.value }))} />
              <input placeholder="Email" value={riderUpdate.email} onChange={(e) => setRiderUpdate((p) => ({ ...p, email: e.target.value }))} />
              <input placeholder="Phone" value={riderUpdate.phone} onChange={(e) => setRiderUpdate((p) => ({ ...p, phone: e.target.value }))} />
              <input placeholder="City" value={riderUpdate.city} onChange={(e) => setRiderUpdate((p) => ({ ...p, city: e.target.value }))} />
              <button
                disabled={!riderUpdate.id}
                onClick={() =>
                  onAction(
                    () => updateUser(Number(riderUpdate.id), {
                      name: riderUpdate.name || undefined,
                      email: riderUpdate.email || undefined,
                      phone: riderUpdate.phone || undefined,
                      city: riderUpdate.city || undefined
                    }),
                    "Rider updated."
                  )
                }
              >
                Update Rider
              </button>
            </div>
          </div>
        </div>
      </section>
      )}

      {activePage === PAGES.DRIVER && (
      <section className="card">
        <div className="section-header">
          <h2>Driver Service (`/v1/drivers`, `/v1/drivers/{"{"}id{"}"}/status`)</h2>
          <span className="badge required">Required</span>
        </div>
        <div className="grid">
          <div>
            <h3>Create Driver</h3>
            <div className="actions">
              <input type="number" placeholder="Driver ID" value={driverForm.id} onChange={(e) => setDriverForm((p) => ({ ...p, id: e.target.value }))} />
              <input placeholder="Name" value={driverForm.name} onChange={(e) => setDriverForm((p) => ({ ...p, name: e.target.value }))} />
              <input placeholder="Phone" value={driverForm.phone} onChange={(e) => setDriverForm((p) => ({ ...p, phone: e.target.value }))} />
              <input placeholder="Email" value={driverForm.email} onChange={(e) => setDriverForm((p) => ({ ...p, email: e.target.value }))} />
              <input placeholder="Vehicle Type" value={driverForm.vehicle_type} onChange={(e) => setDriverForm((p) => ({ ...p, vehicle_type: e.target.value }))} />
              <input placeholder="Vehicle Plate" value={driverForm.vehicle_plate} onChange={(e) => setDriverForm((p) => ({ ...p, vehicle_plate: e.target.value }))} />
              <select value={String(driverForm.is_active)} onChange={(e) => setDriverForm((p) => ({ ...p, is_active: e.target.value === "true" }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <button
                onClick={() =>
                  onAction(
                    () => createDriver({ ...driverForm, id: Number(driverForm.id) }),
                    "Driver created."
                  )
                }
              >
                Create Driver
              </button>
            </div>
          </div>
          <div>
            <h3>Update Driver Active Status</h3>
            <div className="actions">
              <input type="number" placeholder="Driver ID" value={driverStatusForm.id} onChange={(e) => setDriverStatusForm((p) => ({ ...p, id: e.target.value }))} />
              <select value={String(driverStatusForm.is_active)} onChange={(e) => setDriverStatusForm((p) => ({ ...p, is_active: e.target.value === "true" }))}>
                <option value="true">Set Active</option>
                <option value="false">Set Inactive</option>
              </select>
              <button
                disabled={!driverStatusForm.id}
                onClick={() => onAction(() => updateDriverStatus(Number(driverStatusForm.id), driverStatusForm.is_active), "Driver status updated.")}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      </section>
      )}

      {activePage === PAGES.TRIP && (
      <section className="card">
        <div className="section-header">
          <h2>Trip / Dispatch Service (`/v1/trips`, `/v1/trips/{"{"}id{"}"}/accept`, `/v1/trips/{"{"}id{"}"}/complete`)</h2>
          <span className="badge required">Required</span>
        </div>
        <div className="actions">
          <input type="number" placeholder="Rider ID" value={tripForm.rider_id} onChange={(e) => setTripForm((p) => ({ ...p, rider_id: Number(e.target.value) }))} />
          <input placeholder="Pickup" value={tripForm.pickup_location} onChange={(e) => setTripForm((p) => ({ ...p, pickup_location: e.target.value }))} />
          <input placeholder="Drop" value={tripForm.drop_location} onChange={(e) => setTripForm((p) => ({ ...p, drop_location: e.target.value }))} />
          <input placeholder="City" value={tripForm.city} onChange={(e) => setTripForm((p) => ({ ...p, city: e.target.value }))} />
          <input type="number" step="0.1" placeholder="Distance km" value={tripForm.distance_km} onChange={(e) => setTripForm((p) => ({ ...p, distance_km: Number(e.target.value) }))} />
          <input type="number" step="0.1" placeholder="Surge" value={tripForm.surge_multiplier} onChange={(e) => setTripForm((p) => ({ ...p, surge_multiplier: Number(e.target.value) }))} />
          <button onClick={() => onAction(() => createRide(tripForm), "Trip created.")}>Create Trip</button>
        </div>
        <label htmlFor="trip-select">Select Trip for Lifecycle</label>
        <select id="trip-select" value={selectedTripId ?? ""} onChange={(e) => setSelectedTripId(Number(e.target.value) || null)}>
          <option value="">Choose a trip</option>
          {trips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              #{trip.id} | Rider {trip.rider_id} | {trip.trip_status}
            </option>
          ))}
        </select>
        <div className="actions">
          <button disabled={!selectedTripId} onClick={() => onAction(() => acceptRide(selectedTripId), "Trip accepted.")}>Accept Trip</button>
          <button disabled={!selectedTripId} onClick={() => onAction(() => completeRide(selectedTripId), "Trip completed.")}>Complete Trip</button>
          <button disabled={!selectedTripId} onClick={() => onAction(() => cancelRide(selectedTripId), "Trip cancelled.")}>Cancel Trip</button>
        </div>
        <div className="live-tracking">
          <h3>Live Tracking</h3>
          {selectedTripId && liveLocation[selectedTripId] ? (
            <p>Current Location: {JSON.stringify(liveLocation[selectedTripId])}</p>
          ) : (
            <p>No live location available</p>
          )}
        </div>
      </section>
      )}

      {activePage === PAGES.PAYMENT && (
      <section className="card">
        <div className="section-header">
          <h2>Payment Service (`/v1/payments/charge`, `/v1/payments/{"{"}id{"}"}/refund`)</h2>
          <span className="badge required">Required</span>
        </div>
        <div className="actions">
          <input type="number" placeholder="Trip ID" value={paymentForm.trip_id} onChange={(e) => setPaymentForm((p) => ({ ...p, trip_id: e.target.value }))} />
          <input type="number" step="0.1" placeholder="Amount" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} />
          <input placeholder="Method" value={paymentForm.method} onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))} />
          <input placeholder="Idempotency key (optional)" value={paymentForm.idempotency_key} onChange={(e) => setPaymentForm((p) => ({ ...p, idempotency_key: e.target.value }))} />
          <button
            onClick={() =>
              onAction(
                () =>
                  chargePayment({
                    trip_id: Number(paymentForm.trip_id),
                    amount: Number(paymentForm.amount),
                    method: paymentForm.method,
                    idempotency_key: paymentForm.idempotency_key || undefined
                  }),
                "Payment charged."
              )
            }
          >
            Charge Payment
          </button>
        </div>
        <div className="actions">
          <input type="number" placeholder="Payment ID" value={refundPaymentId} onChange={(e) => setRefundPaymentId(e.target.value)} />
          <button disabled={!refundPaymentId} onClick={onLookupPayment}>Get Payment</button>
          <button disabled={!refundPaymentId} onClick={() => onAction(() => refundPayment(Number(refundPaymentId)), "Payment refunded.")}>Refund Payment</button>
        </div>
        {paymentLookup && <pre>{JSON.stringify(paymentLookup, null, 2)}</pre>}
      </section>
      )}

      {activePage === PAGES.RATING && (
      <section className="card">
        <div className="section-header">
          <h2>Optional Rating Service (`/v1/trips/{"{"}id{"}"}/rating`)</h2>
          <span className="badge optional">Optional</span>
        </div>
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
            Submit Rating (Completed + Paid only)
          </button>
        </div>
        <small>
          Rating is enabled only after trip completion and successful payment (final step).
        </small>
      </section>
      )}

      <section className="card">
        <button onClick={loadDashboard}>Refresh Dashboard</button>
      </section>
      </div>
    </div>
  );
}

export default App;
