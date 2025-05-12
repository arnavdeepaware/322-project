import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { getUsernameById, submitBlacklistRequest } from "../supabaseClient";

function HomePage() {
  const { user, loading } = useUser();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    getUsernameById(user.id).then((uname) => setUsername(uname));
  }, []);

  function handleBlacklistRequest(e) {
    e.preventDefault();
    console.log("submitting to blacklist");
    submitBlacklistRequest(e.target.word.value);
    e.target.word.value = "";
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="home-page">
      <main>
        <div>Welcome, {username}</div>
        <div className="panel blacklist-form">
          <h2 className="title">Suggest a Blacklist Word</h2>
          <form onSubmit={handleBlacklistRequest}>
            <input type="text" name="word" />
            <button type="submit">Submit</button>
          </form>
        </div>
        <div className="panel">
          <h2 className="title">Disputes</h2>
        </div>
        <div className="panel">
          <h2 className="title">Invites</h2>
        </div>
        <div className="panel">
          <h2 className="title">Respond to Disputes</h2>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
