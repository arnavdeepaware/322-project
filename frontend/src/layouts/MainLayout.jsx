import React from "react";
import { Outlet, Link } from "react-router";
import accountCircle from "../assets/account_circle.svg";

function Header() {
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
        </ul>
        <ul className="right-links">
          <li>
            <Link to="/tokens">🪙 490</Link>
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
