import { Link, useOutletContext } from "react-router-dom";
import Sidebar from "./SideBar.jsx";
import "./ChannelDetails.css";

function ChannelDetails() {
  const { flag: collapsed = false } = useOutletContext() || {};
  const name = localStorage.getItem("Name");
  const email = localStorage.getItem("Email");

  return (
    <>
      <Sidebar />
      <main className={`channel-page ${collapsed ? "channel-collapsed" : ""}`}>
        {name ? (
          <section className="channel-card">
            <span className="channel-large-avatar">{name.charAt(0).toUpperCase()}</span>
            <div>
              <h1>{name}</h1>
              <p>{email}</p>
              <p className="channel-description">Your account and saved video library.</p>
            </div>
          </section>
        ) : (
          <section className="channel-signin">
            <h1>Your channel</h1>
            <p>Sign in to view your account and manage saved videos.</p>
            <Link to="/SignIn">Sign in</Link>
          </section>
        )}
      </main>
    </>
  );
}

export default ChannelDetails;
