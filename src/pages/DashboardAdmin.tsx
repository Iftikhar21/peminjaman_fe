import { useState, useEffect } from "react";
import { Package, ClipboardCheck, Clock, Users, AlertTriangle, Calendar, Plus, FileText, CheckCircle, User2, ChevronRight, CircleAlert, Calendar1 } from "lucide-react";
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
    end_date: string;
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
                    end_date: formatDate(b.end_date),
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

        return monthlyCounts.slice(6, 12); // Ambil 6 bulan pertama
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
            {/* Header Section - Mobile Optimized */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
                <div className="mb-3 md:mb-0 w-full md:w-auto">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-1 md:mb-2">
                        Selamat Datang, {user?.name || "Admin"}!
                    </h1>
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base">
                        Selamat datang di dashboard Peminjaman Barang
                    </p>
                    {error && (
                        <p className="text-red-500 text-xs md:text-sm mt-1 md:mt-2">{error}</p>
                    )}
                </div>
                <div className="text-left md:text-right w-full md:w-auto">
                    <p className="font-medium text-xl sm:text-2xl md:text-3xl text-blue-700">
                        {formattedTime}
                    </p>
                    <p className="text-xs text-gray-700 mt-1">{formattedDate}</p>
                </div>
            </div>

            {/* Stats Cards - Mobile Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                <StatCard
                    title="Total Barang"
                    value={stats.totalProducts.toString()}
                    icon={<Package className="w-4 h-4 md:w-5 md:h-5" />}
                />
                <StatCard
                    title="Dipinjam"
                    value={stats.borrowedItems.toString()}
                    icon={<ClipboardCheck className="w-4 h-4 md:w-5 md:h-5" />}
                />
                <StatCard
                    title="Belum Kembali"
                    value={stats.overdueItems.toString()}
                    icon={<Clock className="w-4 h-4 md:w-5 md:h-5" />}
                />
                <StatCard
                    title="Total User"
                    value={stats.totalUsers.toString()}
                    icon={<Users className="w-4 h-4 md:w-5 md:h-5" />}
                />
            </div>

            {/* Chart & Notifications - Mobile Stack */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                <div className="lg:col-span-2 bg-white p-3 md:p-4 rounded-lg shadow-sm">
                    <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
                        Grafik Peminjaman (Bulanan)
                    </h2>
                    <div className="h-48 md:h-64 lg:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="month"
                                    fontSize={12}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis
                                    fontSize={12}
                                    tick={{ fontSize: 10 }}
                                />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm">
                    <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-3">Notifikasi</h2>
                    <ul className="text-xs md:text-sm space-y-2 md:space-y-3">
                        {stats.overdueItems > 0 && (
                            <li className="flex items-start gap-2 text-red-600">
                                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                <span>Ada {stats.overdueItems} peminjaman lewat batas waktu!</span>
                            </li>
                        )}
                        <li className="flex items-start gap-2 text-yellow-600">
                            <Calendar size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{stats.borrowedItems} barang sedang dipinjam.</span>
                        </li>
                        {stats.totalProducts < 10 && (
                            <li className="flex items-start gap-2 text-blue-600">
                                <Package size={16} className="mt-0.5 flex-shrink-0" />
                                <span>Total barang tersedia: {stats.totalProducts}</span>
                            </li>
                        )}
                        {stats.totalProducts >= 10 && (
                            <li className="flex items-start gap-2 text-green-600">
                                <Package size={16} className="mt-0.5 flex-shrink-0" />
                                <span>Stok barang mencukupi ({stats.totalProducts} item)</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Recent Borrowings - Mobile Scroll */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-800">Peminjaman Terbaru</h2>
                        <p className="text-gray-500 text-sm mt-1">Daftar peminjaman barang terbaru</p>
                    </div>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                        onClick={() => window.location.href = '/admin/peminjaman'}
                    >
                        <span>Lihat Semua</span>
                        <ChevronRight size={16} className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                {recentBorrowings.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <CircleAlert size={32}/>
                        </div>
                        <h3 className="text-gray-600 font-medium mb-2">Tidak ada data peminjaman</h3>
                        <p className="text-gray-400 text-sm">Belum ada peminjaman barang saat ini</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-3">
                            {recentBorrowings.map((borrowing) => (
                                <div key={borrowing.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 truncate">{borrowing.user_name}</h3>
                                            <p className="text-gray-600 text-sm truncate">{borrowing.product_name}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${borrowing.status === 'dipinjam'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-green-100 text-green-700'
                                            }`}>
                                            {borrowing.status === 'dipinjam' ? 'Dipinjam' : 'Kembali'}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-500 text-sm">
                                        <Calendar1 size={16} className="me-2" />
                                        {borrowing.start_date}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <User2 className="w-4 h-4" />
                                                <span>Nama Peminjam</span>
                                            </div>
                                        </th>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4" />
                                                <span>Barang</span>
                                            </div>
                                        </th>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>Tanggal</span>
                                            </div>
                                        </th>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {recentBorrowings.map((borrowing) => (
                                        <tr key={borrowing.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User2 className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-800">{borrowing.user_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                        <Package className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <span className="text-gray-700">{borrowing.product_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    {borrowing.start_date} - {borrowing.end_date}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${borrowing.status === 'dipinjam'
                                                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                                    : 'bg-green-50 text-green-700 border border-green-200'
                                                    }`}>
                                                    {borrowing.status === 'dipinjam' ? (
                                                        <>
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            Dipinjam
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Dikembalikan
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons - Mobile Wrap */}
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center sm:justify-start">
                <button
                    className="flex items-center gap-1 md:gap-2 px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm flex-1 sm:flex-none min-w-[140px] justify-center"
                    onClick={() => window.location.href = '/admin/produk'}
                >
                    <Plus size={14} className="md:w-4 md:h-4" />
                    <span>Tambah Barang</span>
                </button>
                <button
                    className="flex items-center gap-1 md:gap-2 px-3 py-2 md:px-4 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs md:text-sm flex-1 sm:flex-none min-w-[140px] justify-center"
                    onClick={() => window.location.href = '/admin/peminjaman'}
                >
                    <ClipboardCheck size={14} className="md:w-4 md:h-4" />
                    <span>Kelola Peminjaman</span>
                </button>
                <button
                    className="flex items-center gap-1 md:gap-2 px-3 py-2 md:px-4 md:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs md:text-sm flex-1 sm:flex-none min-w-[140px] justify-center"
                    onClick={() => window.location.href = '/admin/user'}
                >
                    <Users size={14} className="md:w-4 md:h-4" />
                    <span>Kelola User</span>
                </button>
            </div>
        </AdminLayout>
    );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm flex items-center gap-2 md:gap-3 hover:shadow-md transition-shadow">
            <div className="text-blue-600 flex-shrink-0">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">{title}</p>
                <p className="text-lg md:text-xl font-bold text-gray-800 truncate">{value}</p>
            </div>
        </div>
    );
}