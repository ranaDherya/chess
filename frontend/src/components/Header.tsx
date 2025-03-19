import logo from "/knight-white.png";
import "./Header.css";

function Header() {
  return (
    <div className="nav-bar">
      <div className="logo-container">
        {/* Logo */}
        <img src={logo} className="logo" />
        <span>Chess</span>
      </div>

      <div className="account-section">
        <span>Login</span>
      </div>
    </div>
  );
}

export default Header;
