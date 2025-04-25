import React, { useState } from "react";
import { supabase } from "../../../supabaseClient";
import { redirect, useNavigate } from "react-router-dom";
import "./Account.css";

export default function Account() {

    const signInWithGoogle = async () => {
        const {error } = await supabase.auth.signInWithOAuth({
            provider: 'google',

        });
        if (error) console.log("Error signing in:", error);
        else console.log("User signed in:", user);
        redirect("/editor")
    }

  return (
    <div className="account-page">
      <button className="sign-in-button" onClick={signInWithGoogle}>
        Sign in with Google
        </button>
    </div>
  );
}