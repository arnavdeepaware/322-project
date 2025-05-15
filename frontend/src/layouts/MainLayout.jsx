import React, { useState, useEffect } from "react";
import { Outlet, Link } from "react-router";
import Logo from "../components/Logo";
import accountCircle from "../assets/account_circle.svg";
import { useUser } from "../context/UserContext";
import { supabase } from "../supabaseClient";

function Header() {
  const { tokens } = useUser();
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    async function checkSuperUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsSuperUser(user?.email === 'arshanand2524@gmail.com');
      } catch (error) {
        console.error('Error checking superuser status:', error);
        setIsSuperUser(false);
      }
    }

    checkSuperUser();
  }, []);

  return (
    <header>
      <nav>
        <ul className="left-links">
          <li>
            <Link to="/">
              <Logo />
            </Link>
          </li>
          <li>
            <Link to="/editor">Editor</Link>
          </li>
          <li>
            <Link to="/documents">Documents</Link>
          </li>

          {isSuperUser && (
            <li>
              <Link to="/superuser" className="text-purple-600 hover:text-purple-700">
                Super User Dashboard
              </Link>
            </li>
          )}

          <li>
            <Link to="/complaints">Make a Complaint</Link>
          </li>

        </ul>
        <ul className="right-links">
          <li>
            <Link to="/tokens">🪙 {tokens}</Link>
          </li>
          <li>
            <Link to="/account">
              <img
                src={accountCircle}
                alt="Account"
                width="30px"
                style={{ transform: "translateY(4px)" }}
              />
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

function MainLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

export default MainLayout;
