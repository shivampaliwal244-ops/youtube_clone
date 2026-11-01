import { Link, useOutletContext } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import HistoryIcon from "@mui/icons-material/History";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import CodeIcon from "@mui/icons-material/Code";
import "./SideBar.css";

const exploreItems = [
  ["Music", MusicNoteIcon],
  ["Gaming", SportsEsportsIcon],
  ["Technology", CodeIcon],
  ["News", NewspaperIcon],
];

function Sidebar() {
  const { flag: collapsed = false } = useOutletContext() || {};
  const links = [
    ["Home", "/", HomeIcon],
    ["Subscriptions", "/search?q=subscriptions", SubscriptionsIcon],
    ["Library", "/channelDetails", VideoLibraryIcon],
    ["History", "/search?q=history", HistoryIcon],
  ];

  return (
    <aside className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`} aria-label="Main navigation">
      <nav>
        {links.map(([label, href, Icon]) => (
          <Link className="sidebar-link" key={label} to={href} title={collapsed ? label : undefined}>
            <Icon />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>
      {!collapsed && (
        <div className="sidebar-explore">
          <h2>Explore</h2>
          {exploreItems.map(([label, Icon]) => (
            <Link className="sidebar-link" key={label} to={`/search?q=${label.toLowerCase()}`}>
              <Icon />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
