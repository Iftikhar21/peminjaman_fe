import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import CSS
import './index.css';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Auth/Login';
import DashboardAdmin from './pages/DashboardAdmin';
import AdminRoute from './routes/AdminRoute';
import Jurusan from './pages/Master/Jurusan';
import Kelas from './pages/Master/Kelas';
import StatusPeminjam from './pages/Master/StatusPeminjam';
import Lokasi from './pages/Master/Lokasi';
import Kategori from './pages/Master/Kategori';
import User from './pages/UserManage/User';
import ProdukPage from './pages/Aset/Produk';
import Peminjaman from './pages/Aset/Peminjaman';
import Profile from './pages/Profile';
import RolePage from './pages/UserManage/Role';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <DashboardAdmin />
                </AdminRoute>
              }
            />

            {/* Master Data Routes */}
            <Route
              path="/admin/jurusan"
              element={
                <AdminRoute>
                  <Jurusan />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/kelas"
              element={
                <AdminRoute>
                  <Kelas />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/status-peminjam"
              element={
                <AdminRoute>
                  <StatusPeminjam />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/lokasi"
              element={
                <AdminRoute>
                  <Lokasi />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminRoute>
                  <Kategori />
                </AdminRoute>
              }
            />

            {/* Pengguna Routes */}
            <Route
              path="/admin/user"
              element={
                <AdminRoute>
                  <User />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/role"
              element={
                <AdminRoute>
                  <RolePage />
                </AdminRoute>
              }
            />

            {/* Aset Routes */}
            <Route
              path="/admin/product"
              element={
                <AdminRoute>
                  <ProdukPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/peminjaman"
              element={
                <AdminRoute>
                  <Peminjaman />
                </AdminRoute>
              }
            />

            {/* Profil Route */}
            <Route
              path="/admin/profil"
              element={
                <AdminRoute>
                  <Profile />
                </AdminRoute>
              }
            />

            {/* Redirect Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Navigate to="/admin/dashboard" replace />
                </AdminRoute>
              }
            />

            {/* Default route redirect ke dashboard admin jika sudah login, atau login jika belum */}
            <Route
              path="/"
              element={
                <AdminRoute>
                  <Navigate to="/admin/dashboard" replace />
                </AdminRoute>
              }
            />

            {/* 404 Not Found Route */}
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Halaman tidak ditemukan</p>
                    <a
                      href="/admin/dashboard"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                    >
                      Kembali ke Dashboard
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;