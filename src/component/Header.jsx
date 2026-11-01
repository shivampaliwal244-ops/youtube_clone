import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import YoutubeIcon from "../assets/Youtube_Icon.png";
import "./Header.css";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("Name") || "User";
  const email = localStorage.getItem("Email") || "";

  useEffect(() => {
    const currentQuery = new URLSearchParams(location.search).get("q") || "";
    setQuery(currentQuery);
  }, [location.pathname, location.search]);

  function submitSearch(event) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setMenuOpen(false);
  }

  function logout() {
    ["token", "Name", "Email", "userId"].forEach((key) => localStorage.removeItem(key));
    setMenuOpen(false);
    navigate("/");
  }

  return (
    <>
      <header className="app-header">
        <div className="header-brand">
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={!collapsed}
            className="header-icon-button"
            onClick={() => setCollapsed((value) => !value)}
          >
            <MenuIcon />
          </button>
          <Link to="/" className="brand-link" aria-label="YouTube home">
            <img src={YoutubeIcon} alt="" />
            <span>YouTube</span>
          </Link>
        </div>

        <form className="header-search" role="search" onSubmit={submitSearch}>
          <input
            aria-label="Search videos"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            type="search"
          />
          <button type="submit" aria-label="Search">
            <SearchIcon />
          </button>
        </form>

        <div className="header-account">
          {token ? (
            <>
              <button
                className="header-icon-button more-button"
                aria-label="Account options"
                onClick={() => setMenuOpen((value) => !value)}
              >
                <MoreVertIcon />
              </button>
              <button
                className="avatar-button"
                aria-label={`Account menu for ${name}`}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((value) => !value)}
              >
                {name.charAt(0).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="account-menu">
                  <div className="account-summary">
                    <span className="account-avatar">{name.charAt(0).toUpperCase()}</span>
                    <div>
                      <strong>{name}</strong>
                      <span>{email}</span>
                      <Link to="/channelDetails" onClick={() => setMenuOpen(false)}>Your channel</Link>
                    </div>
                  </div>
                  <button type="button" onClick={logout}><LogoutIcon fontSize="small" /> Sign out</button>
                </div>
              )}
            </>
          ) : (
            <Link className="sign-in-link" to="/SignIn"><PersonIcon /> <span>Sign in</span></Link>
          )}
        </div>
      </header>
      <Outlet context={{ flag: collapsed, titleName: query }} />
    </>
  );
}

export default Header;
