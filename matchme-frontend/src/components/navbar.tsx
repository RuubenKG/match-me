import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

function Navbar() {

  const navigation = useNavigate();


  const handleLogout = async () => {
    await (window as any).disconnectSocket?.();
    authService.logout();
    navigation("/login");
  };

  return (
    <nav className="bg-black border-b-4 border-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link
          to="/MainPage"
          className="text-white text-2xl font-bold"
        >
          MATCH-ME
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/MainPage" className="text-white hover:underline">
            Matching
          </Link>
          <button
            onClick={handleLogout}
            className="border-2 border-white text-white px-4 py-2 hover:bg-white hover:text-black transition-colors"
          >
            LOGOUT
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

