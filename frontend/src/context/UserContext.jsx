import { createContext, useContext, useEffect, useState } from "react";
import { supabase, incrementTokens } from "../supabaseClient";
import { getUsernameById } from "../supabaseClient";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(0);
  const [guest, setGuest] = useState(
    localStorage.getItem("isGuest") === "true"
  );

  function handleTokenChange(k) {
    if (tokens + k < 0) {
      alert("Insufficient tokens! Please purchase more tokens to continue.");
      window.location.href = "/tokens";
      return;
    }
    setTokens((prev) => prev + k);
    incrementTokens(k);
  }

  function signInAsGuest() {
    // check if guest is blocked
    const blockedUntil = parseInt(localStorage.getItem("guestBlockedUntil") || '0');
    if (blockedUntil && Date.now() < blockedUntil) {
      alert("You are locked out for 3 minutes.");
      return;
    }
    // clear block on new guest login
    localStorage.removeItem("guestBlockedUntil");
    localStorage.setItem("isGuest", "true");
    setGuest(true);
    setUser(null);
    setLoading(false);
    setTokens(0);
  }

  function signOutGuest() {
    setGuest(false);
    localStorage.removeItem("isGuest");
  }

  const fetchTokenBalance = async (userId) => {
    const { data, error } = await supabase
      .from("users")
      .select("tokens")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching token balance:", error.message);
    } else {
      setTokens(data?.tokens || 0); // Set the token balance
    }
  };

  useEffect(() => {
    // Get current session/user on mount
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);

      // if logged in via OAuth, clear guest state
      if (session?.user) signOutGuest();

      if (session?.user) {
        fetchTokenBalance(session.user.id);
        getUsernameById(session.user.id).then((uname) => setUsername(uname));
      }
    };

    getUser();

    // Subscribe to auth changes (login, logout, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          // clear guest on real login
          signOutGuest();
          fetchTokenBalance(session.user.id);
          getUsernameById(session.user.id).then((uname) => setUsername(uname));
        } else {
          setTokens(0);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [tokens]);

  return (
    <UserContext.Provider
      value={{
        user,
        username,
        loading,
        tokens,
        guest,
        handleTokenChange,
        signInAsGuest,
        signOutGuest,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
