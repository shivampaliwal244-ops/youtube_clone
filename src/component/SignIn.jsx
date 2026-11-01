import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import YoutubeIcon from "../assets/Youtube_Icon.png";
import { apiRequest } from "../utils/api.js";
import "./SignIn.css";

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ userEmail: email, userPassword: password }),
      });
      localStorage.setItem("token", data.tokenNumber);
      localStorage.setItem("Name", data.user.Name);
      localStorage.setItem("Email", data.user.email);
      if (data.user.id) localStorage.setItem("userId", data.user.id);
      navigate("/");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-heading">
          <img src={YoutubeIcon} alt="" />
          <h1>Sign in</h1>
          <Link aria-label="Home" to="/"><HomeIcon /></Link>
        </div>
        <p className="auth-subtitle">Continue to your YouTube clone account</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <label>Email<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
          <label>Password<input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
          <button disabled={submitting} type="submit">{submitting ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="auth-footer">New here? <Link to="/SignUp">Create an account</Link></p>
      </section>
    </main>
  );
}

export default SignIn;
