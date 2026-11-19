import { Navigate, Outlet } from "react-router-dom";
import { authService } from "../services/authService";

function ProtectedRoute() {
    //check if user is authenticated, if not, mf is banished to the log in page
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return (
        <>
            <Outlet />
        </>
    );
}

export default ProtectedRoute;