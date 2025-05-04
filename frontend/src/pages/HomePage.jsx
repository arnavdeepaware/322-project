import React, { useEffect } from "react";
import { useUser } from "../context/UserContext";

function HomePage() {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>; // Display loading message while user data is being fetched
  }

  return <div>Welcome to HomePage, {user ? user.email : "Guest"}</div>;
}

export default HomePage;
