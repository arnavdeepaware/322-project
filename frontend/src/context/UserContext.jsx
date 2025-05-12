import { createContext, useContext, useEffect, useState } from "react";
import { supabase, incrementTokens } from "../supabaseClient";
import { getUsernameById } from "../supabaseClient";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(0);

  function handleTokenChange(k) {
    setTokens((prev) => prev + k);
    incrementTokens(k);
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
    <UserContext.Provider value={{ user, username, loading, tokens, handleTokenChange }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
