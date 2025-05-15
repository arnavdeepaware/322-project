import { createContext, useContext, useEffect, useState } from "react";
import { supabase, incrementTokens } from "../supabaseClient";
import { getUsernameById } from "../supabaseClient";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [statistics, setStatistics] = useState({
    editedTexts: 42,     // Fake data for testing
    usedTokens: 156,     // Fake data for testing
    availableTokens: 344, // Fake data for testing
    corrections: 78      // Fake data for testing
  });

  function handleTokenChange(k) {
    setTokens((prev) => prev + k);
    incrementTokens(k);
  }

  const updateStatistics = async (type, value = 1) => {
    try {
      if (!user?.id || !isPaid) return;

      const columnName = type === 'editedTexts' ? 'edited_texts' : 
                        type === 'usedTokens' ? 'used_tokens' :
                        'corrections';

      // Update database
      const { data, error } = await supabase
        .from('user_statistics')
        .upsert({
          user_id: user.id,
          [columnName]: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          returning: true
        });

      if (error) throw error;

      // Update local state
      setStatistics(prev => ({
        ...prev,
        [type]: (prev[type] || 0) + value
      }));

    } catch (error) {
      console.error('Error updating statistics:', error.message);
    }
  };

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
    try {
      // First fetch user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("tokens, is_paid")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      // Then fetch or create statistics
      const { data: statsData, error: statsError } = await supabase
        .from("user_statistics")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (statsError) {
        if (statsError.code === 'PGRST116') {
          // Statistics don't exist, create them
          const { data: newStats, error: insertError } = await supabase
            .from("user_statistics")
            .insert([{
              user_id: userId,
              edited_texts: 0,
              used_tokens: 0,
              available_tokens: userData.tokens || 0,
              corrections: 0
            }])
            .select()
            .single();

          if (insertError) throw insertError;
          
          setStatistics({
            editedTexts: 0,
            usedTokens: 0,
            availableTokens: userData.tokens || 0,
            corrections: 0
          });
        } else {
          throw statsError;
        }
      } else {
        setStatistics({
          editedTexts: statsData.edited_texts,
          usedTokens: statsData.used_tokens,
          availableTokens: statsData.available_tokens,
          corrections: statsData.corrections
        });
      }

      setTokens(userData.tokens || 0);
      setIsPaid(userData.is_paid || false);

    } catch (error) {
      console.error("Error fetching user data:", error.message);
      setTokens(0);
      setIsPaid(false);
      setStatistics({
        editedTexts: 0,
        usedTokens: 0,
        availableTokens: 0,
        corrections: 0
      });
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
  }, []);

  useEffect(() => {
    if (user) {
      fetchTokenBalance(user.id);
    }
  }, [user]);

  useEffect(() => {
    async function fetchStatistics() {
      if (!user?.id || !isPaid) return;

      try {
        const { data, error } = await supabase
          .from('user_statistics')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setStatistics({
            editedTexts: data.edited_texts || 0,
            usedTokens: data.used_tokens || 0,
            corrections: data.corrections || 0
          });
        }
      } catch (error) {
        console.error('Error fetching statistics:', error.message);
      }
    }

    fetchStatistics();
  }, [user, isPaid]);

  const value = {
    user,
    username,
    loading,
    tokens,
    handleTokenChange,
    statistics,
    updateStatistics,
    isPaid,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
