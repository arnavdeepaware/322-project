import React from "react";
import { Outlet, Link } from "react-router";
import Logo from "../components/Logo";
import accountCircle from "../assets/account_circle.svg";
import { useUser } from "../context/UserContext";

function Header() {
  const { tokens } = useUser();

  return (
    <header>
      <nav>
        <ul className="left-links">
          <li>
            <Link to="/">EditFlow</Link>
          </li>
          <li>
            <Link to="/editor">Editor</Link>
          </li>
          <li>
            <Link to="/documents">Documents</Link>
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
