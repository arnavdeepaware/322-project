import { createContext, useContext, useEffect, useState } from "react";
import { supabase, incrementTokens } from "../supabaseClient";
import { getUsernameById } from "../supabaseClient";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(0);
  const [guest, setGuest] = useState(false);

  function handleTokenChange(k) {
    setTokens((prev) => prev + k);
    incrementTokens(k);
  }

  function signInAsGuest() {
    const now = Date.now();
    const last = parseInt(localStorage.getItem("lastGuestLogin"));
    // enforce 3-minute cooldown
    // if (last && now - last < 3 * 60 * 1000) {
    //   alert("Please wait a few minutes before signing in as guest again.");
    //   return;
    // }
    localStorage.setItem("lastGuestLogin", now.toString());
    setGuest(true);
    setUser(null);
    setLoading(false);
    setTokens(0);
  }

  function signOutGuest() {
    setGuest(false);
    localStorage.removeItem("lastGuestLogin");
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
