import { useState } from "react";
import { Link } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import YoutubeIcon from "../assets/Youtube_Icon.png";
import { apiRequest } from "../utils/api.js";
import "./SignIn.css";

function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2 || !email.trim() || password.length < 8) {
      setError("Enter your name and email, and use a password with at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ userName: name, userEmail: email, userPassword: password }),
      });
      setSuccess(true);
      setName("");
      setEmail("");
      setPassword("");
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
          <h1>Create account</h1>
          <Link aria-label="Home" to="/"><HomeIcon /></Link>
        </div>
        <p className="auth-subtitle">Join the YouTube clone community</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {success && <p className="auth-success" role="status">Account created. <Link to="/SignIn">Sign in now</Link>.</p>}
          <label>Name<input autoComplete="name" onChange={(event) => setName(event.target.value)} required value={name} /></label>
          <label>Email<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
          <label>Password<input autoComplete="new-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
          <button disabled={submitting} type="submit">{submitting ? "Creating account…" : "Create account"}</button>
        </form>
        <p className="auth-footer">Already registered? <Link to="/SignIn">Sign in</Link></p>
      </section>
    </main>
  );
}

export default SignUp;
