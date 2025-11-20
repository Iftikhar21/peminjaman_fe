import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }: any) => {
    const user = localStorage.getItem("user");
    if (!user) return <Navigate to="/login" replace />;

    const parsed = JSON.parse(user);

    return parsed.role_id === 1 ? children : <Navigate to="/user" replace />;
};

export default AdminRoute;
