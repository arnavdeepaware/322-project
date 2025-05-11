import React, { useEffect } from "react";
import { useUser } from "../context/UserContext";
import { submitBlacklistRequest } from "../supabaseClient";

function HomePage() {
  const { user, loading } = useUser();

  function handleBlacklistRequest(e) {
    e.preventDefault();
    console.log("submitting to blacklist")
    submitBlacklistRequest(e.target.word.value);
    e.target.word.value = "";
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="home-page">
      <main>
        <div className="panel blacklist-form">
          <h2 className="title">Suggest a Blacklist Word</h2>
          <form onSubmit={handleBlacklistRequest}>
            <input type="text" name="word" />
            <button type="submit">Submit</button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
