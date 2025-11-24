import { useState, useEffect } from "react";
import { Package, ClipboardCheck, Clock, Users, AlertTriangle, Calendar, Plus, FileText } from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";
import { useAuth } from "../context/AuthContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api, { setAuthToken } from "../api";

interface DashboardStats {
    totalProducts: number;
    borrowedItems: number;
    overdueItems: number;
    totalUsers: number;
}

interface RecentBorrowing {
    id: number;
    user_name: string;
    product_name: string;
    start_date: string;
    status: string;
}

interface MonthlyData {
    month: string;
    total: number;
}

export default function DashboardAdmin() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        borrowedItems: 0,
        overdueItems: 0,
        totalUsers: 0
    });
    const [recentBorrowings, setRecentBorrowings] = useState<RecentBorrowing[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (token) setAuthToken(token);

            // Fetch data secara parallel
            const [productsRes, usersRes, borrowingsRes] = await Promise.all([
                api.get("/product/"),
                api.get("/user/"),
                api.get("/peminjaman/all")
            ]);

            const products = productsRes.data.data || [];
            const users = usersRes.data.user || [];
            const borrowings = borrowingsRes.data.data || [];

            // Hitung statistik
            const currentBorrowings = borrowings.filter((b: any) => b.status === "dipinjam");
            const overdueBorrowings = borrowings.filter((b: any) => {
                const endDate = new Date(b.end_date);
                const today = new Date();
                return b.status === "dipinjam" && endDate < today;
            });

            // Data untuk chart (contoh sederhana - bisa disesuaikan dengan data aktual)
            const monthlyStats = generateMonthlyData(borrowings);

            // Data peminjaman terbaru
            const recentData = borrowings
                .slice(0, 5)
                .map((b: any) => ({
                    id: b.id,
                    user_name: b.user?.name || "Unknown",
                    product_name: b.product?.product_name || "Unknown",
                    start_date: formatDate(b.start_date),
                    status: b.status
                }));

            setStats({
                totalProducts: products.length,
                borrowedItems: currentBorrowings.length,
                overdueItems: overdueBorrowings.length,
                totalUsers: users.length
            });

            setMonthlyData(monthlyStats);
            setRecentBorrowings(recentData);

        } catch (err: any) {
            console.error(err);
            setError("Gagal mengambil data dashboard");
        } finally {
            setLoading(false);
        }
    };

    const generateMonthlyData = (borrowings: any[]): MonthlyData[] => {
        // Contoh data bulanan - bisa disesuaikan dengan data aktual dari API
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

        // Hitung peminjaman per bulan (contoh sederhana)
        const monthlyCounts = months.map((month, index) => {
            const monthBorrowings = borrowings.filter((b: any) => {
                const borrowDate = new Date(b.start_date);
                return borrowDate.getMonth() === index;
            });
            return {
                month,
                total: monthBorrowings.length
            };
        });

        return monthlyCounts.slice(0, 12); // Ambil 5 bulan pertama untuk contoh
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const formattedTime = currentTime.toLocaleTimeString();
    const formattedDate = currentTime.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    if (loading) {
        return (
            <AdminLayout title="Dashboard">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Dashboard">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="mb-4 md:mb-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Selamat Datang, {user?.name || "Admin"}!</h1>
                    <p className="text-gray-600 text-sm sm:text-base">Selamat datang di dashboard Peminjaman Barang</p>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                <div className="text-left md:text-right">
                    <p className="font-medium text-2xl sm:text-3xl text-blue-700">{formattedTime}</p>
                    <p className="text-xs sm:text-sm text-gray-700">{formattedDate}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Barang"
                    value={stats.totalProducts.toString()}
                    icon={<Package />}
                />
                <StatCard
                    title="Dipinjam"
                    value={stats.borrowedItems.toString()}
                    icon={<ClipboardCheck />}
                />
                <StatCard
                    title="Belum Dikembalikan"
                    value={stats.overdueItems.toString()}
                    icon={<Clock />}
                />
                <StatCard
                    title="Total User"
                    value={stats.totalUsers.toString()}
                    icon={<Users />}
                />
            </div>

            {/* Chart & Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="col-span-2 bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold mb-3">Grafik Peminjaman (Bulanan)</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold mb-3">Notifikasi</h2>
                    <ul className="text-sm space-y-3">
                        {stats.overdueItems > 0 && (
                            <li className="flex items-start gap-2 text-red-600">
                                <AlertTriangle size={18} />
                                Ada {stats.overdueItems} peminjaman lewat batas waktu!
                            </li>
                        )}
                        <li className="flex items-start gap-2 text-yellow-600">
                            <Calendar size={18} />
                            {stats.borrowedItems} barang sedang dipinjam.
                        </li>
                        {stats.totalProducts < 10 && (
                            <li className="flex items-start gap-2 text-blue-600">
                                <Package size={18} />
                                Total barang tersedia: {stats.totalProducts}
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Recent Borrowings */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold">Peminjaman Terbaru</h2>
                    <button
                        className="text-blue-600 hover:underline text-sm"
                        onClick={() => window.location.href = '/admin/peminjaman'}
                    >
                        Lihat Semua
                    </button>
                </div>

                {recentBorrowings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Tidak ada data peminjaman
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="py-2">Nama</th>
                                <th>Barang</th>
                                <th>Tanggal</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentBorrowings.map((borrowing) => (
                                <tr key={borrowing.id} className="border-b hover:bg-gray-50">
                                    <td className="py-2">{borrowing.user_name}</td>
                                    <td>{borrowing.product_name}</td>
                                    <td>{borrowing.start_date}</td>
                                    <td>
                                        <span className={`font-medium ${borrowing.status === 'dipinjam'
                                                ? 'text-orange-600'
                                                : 'text-green-600'
                                            }`}>
                                            {borrowing.status === 'dipinjam' ? 'Dipinjam' : 'Dikembalikan'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => window.location.href = '/admin/produk'}
                >
                    <Plus size={18} /> Tambah Barang
                </button>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    onClick={() => window.location.href = '/admin/peminjaman'}
                >
                    <ClipboardCheck size={18} /> Kelola Peminjaman
                </button>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    onClick={() => window.location.href = '/admin/user'}
                >
                    <Users size={18} /> Kelola User
                </button>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    onClick={() => window.location.href = '/admin/peminjaman'}
                >
                    <FileText size={18} /> Generate Laporan
                </button>
            </div>
        </AdminLayout>
    );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="text-blue-600">{icon}</div>
            <div>
                <p className="text-sm text-gray-600">{title}</p>
                <p className="text-xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
}