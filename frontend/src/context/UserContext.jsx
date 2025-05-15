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
    editedTexts: 0,
    usedTokens: 0,
    corrections: 0
  });

  function handleTokenChange(k) {
    setTokens((prev) => prev + k);
    incrementTokens(k);
  }

  const updateStatistics = async (type, value = 1) => {
    try {
      if (!user?.id) return;

      // Update local state immediately for responsive UI
      setStatistics(prev => ({
        ...prev,
        [type]: prev[type] + value
      }));

      // Then update database
      const { error } = await supabase.rpc('update_user_stats', {
        p_user_id: user.id,
        p_used_tokens: type === 'usedTokens' ? value : 0,
        p_edited_texts: type === 'editedTexts' ? value : 0,
        p_corrections: type === 'corrections' ? value : 0
      });

      if (error) throw error;

    } catch (error) {
      console.error('Error updating statistics:', error);
      // Revert local state if update fails
      setStatistics(prev => ({
        ...prev,
        [type]: prev[type] - value
      }));
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
    const fetchUserData = async () => {
      try {
        if (!user?.id) return;

        const { data: userData, error } = await supabase
          .from('users')
          .select('tokens, edited_texts, corrections, used_tokens, is_paid')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setTokens(userData.tokens || 0);
        setIsPaid(userData.is_paid || false);
        setStatistics({
          editedTexts: userData.edited_texts || 0,
          usedTokens: userData.used_tokens || 0,
          corrections: userData.corrections || 0
        });

      } catch (error) {
        console.error('Error fetching user data:', error);
        setTokens(0);
        setIsPaid(false);
        setStatistics({
          editedTexts: 0,
          usedTokens: 0,
          corrections: 0
        });
      }
    };

    fetchUserData();
  }, [user]);

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
