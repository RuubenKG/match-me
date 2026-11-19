import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import AlienBackground from "../components/alien-background";
import "../styles/crt-effect.css";
import axios from "axios";

interface LoginProps {
  initialMode?: boolean;
}

function Login({ initialMode = true }: LoginProps) {
  const [isLogin, setIsLogin] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (authService.getToken()) {
      console.log("Redirecting to MainPage: Session exists.");
      navigate("/MainPage", { replace: true });
    }
  }, [navigate]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError("Passwords don't match!");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    }

    setLoading(true);

    try {
      if (!isLogin) {
        await authService.register({
          email,
          username,
          password,
          firstName,
          lastName,
          dateOfBirth,
        });
      }

      const response = await authService.login({ email, password });
      authService.setToken(response.token);
      localStorage.setItem("user", JSON.stringify(response.userId));

      // Reconnect socket with new token
      (window as any).reconnectSocket?.();

      navigate(isLogin ? "/MainPage" : "/ProfileSetup");
    } catch (err: unknown) {
      let errorMessage = "SYSTEM ERROR: ACTION FAILED";

      if (axios.isAxiosError(err)) {
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        }
        else if (typeof err.response?.data === 'string') {
          errorMessage = err.response.data;
        }
        else {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlienBackground />

      <div className="min-h-screen flex items-center justify-end p-8 relative z-10">
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg shadow-2xl p-8 border-2 border-green-500/30">
            <h2
              className="text-5xl font-bold text-white mb-1 alien-glow vhs-distortion"
              style={{ fontFamily: "Sevastopol Interface" }}
            >
              {isLogin ? "Login" : "Sign Up"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-2xl block font-medium text-green-300 mb-2" style={{ fontFamily: "Sevastopol Interface" }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="text-2xl w-full px-4 py-3 bg-black/50 border border-green-500/50 rounded text-green-300"
                    placeholder="your_username"
                  />
                </div>
              )}

              <div>
                <label className="text-2xl block font-medium text-green-300 mb-2" style={{ fontFamily: "Sevastopol Interface" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-2xl w-full px-4 py-3 bg-black/50 border border-green-500/50 rounded text-green-300"
                  placeholder="email@example.com"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-2xl block font-medium text-green-300 mb-2" style={{ fontFamily: "Sevastopol Interface" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-green-500/50 rounded text-green-300 text-lg"
                    placeholder="••••••••"
                  />
                </div>

                {!isLogin && (
                  <div className="flex-1">
                    <label className="text-2xl block font-medium text-green-300 mb-2" style={{ fontFamily: "Sevastopol Interface" }}>
                      Confirm
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-green-500/50 rounded text-green-300 text-lg"
                      placeholder="••••••••"
                    />
                  </div>
                )}
              </div>

              {!isLogin && (
                <>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-2xl block font-medium text-green-300 mb-2" style={{ fontFamily: "Sevastopol Interface" }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="text-2xl w-full px-4 py-3 bg-black/50 border border-green-500/50 rounded text-green-300"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-2xl block font-medium text-green-300 mb-2" style={{ fontFamily: "Sevastopol Interface" }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="text-2xl w-full px-4 py-3 bg-black/50 border border-green-500/50 rounded text-green-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-2xl block font-medium text-green-300 mb-2" style={{ fontFamily: "Sevastopol Interface" }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      className="text-2xl w-full px-4 py-3 bg-black/50 border border-green-500/50 rounded text-green-300"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded alien-glow text-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 text-3xl w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-black font-bold py-3 rounded transition duration-200 transform hover:scale-105 disabled:scale-100 alien-glow"
                style={{ fontFamily: "Sevastopol Interface" }}
              >
                {loading
                  ? "Loading..."
                  : isLogin
                    ? "Login"
                    : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={toggleMode}
                className="text-2xl text-green-300 hover:text-green-200 font-semibold alien-glow underline"
                style={{ fontFamily: "Sevastopol Interface" }}
              >
                {isLogin
                  ? "New user? Sign Up"
                  : "Already registered? Login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;