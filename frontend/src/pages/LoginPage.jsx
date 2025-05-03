import React from "react";
import Logo from "../components/Logo";
import { signInWithGoogle } from "../supabaseClient";
import { useNavigate } from "react-router";

function LoginPage() {
  const navigate = useNavigate();

  function handleGoogleSignIn() {
    signInWithGoogle()
      .then((data) => {
        console.log(data);
        // navigate("/");
      })
      .catch((error) => {
        console.error("Error during sign-in:", error);
      });
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
          <p>Sign in as guest</p>
        </form>
      </main>
    </div>
  );
}

export default LoginPage;
