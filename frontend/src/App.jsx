import { useEffect, useState } from "react";
import { getUsers, createRide } from "./api";

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers().then((res) => setUsers(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading users...</p>;
  return (
    <div>
      <h1>🚀 Ride Dashboard</h1>

      <button onClick={createRide}>Book Ride</button>

      <h2>Users</h2>
      <ul>
        {users.map((u, i) => (
          <li key={i}>{u.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
