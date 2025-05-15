import React from "react";
import Logo from "../components/Logo";
import { signInWithGoogle } from "../supabaseClient";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router";

function LoginPage() {
  const navigate = useNavigate();
  const { signInAsGuest } = useUser();

  function handleGoogleSignIn() {
    signInWithGoogle().catch((error) => {
      console.error("Error during sign-in:", error);
    });
  }

  function handleGuestSignIn() {
    signInAsGuest();
    navigate("/");
  }

  return (
    <div className="login-page">
      <main>
        <Logo />
        <form>
          <input type="text" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button>Sign in</button>
          <hr />
          <button
            className="google-sign-in-btn"
            onClick={handleGoogleSignIn}
            type="button"
          >
            Sign in with Google
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png"
              alt="Google Logo"
              width="10%"
            />
          </button>
          <button
            type="button"
            className="guest-sign-in-btn"
            onClick={handleGuestSignIn}
          >
            Sign in as guest
          </button>
        </form>
      </main>
    </div>
  );
}

export default LoginPage;
