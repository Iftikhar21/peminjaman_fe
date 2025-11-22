import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api, { setAuthToken } from "../../api";
import { CircleAlert, FileText, Plus, RefreshCcw, Search, SquarePen, Trash2 } from "lucide-react";
import { utils, writeFile } from 'xlsx';

interface Product { id: number; product_name: string; }
interface Location { id: number; location_name: string; }
interface Peminjaman {
    id: number;
    user: { name: string };
    product: Product;
    location: Location;
    qty: number;
    start_date: string;
    end_date: string;
    status: string;
    note: string;
}

export default function PeminjamanAdmin() {
    const [peminjaman, setPeminjaman] = useState<Peminjaman[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    // Filters
    const [search, setSearch] = useState("");
    const [productId, setProductId] = useState<number | "">("");
    const [locationId, setLocationId] = useState<number | "">("");
    const [status, setStatus] = useState<string | "">("");
    const [date, setDate] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    // Fetch peminjaman
    const fetchPeminjaman = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (token) setAuthToken(token);

            const res = await api.get("/peminjaman/all");
            setPeminjaman(res.data.data);

        } catch (err: any) {
            console.error(err);
            setError("Gagal mengambil data peminjaman");
            setPeminjaman([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch produk & lokasi untuk filter
    const fetchProductsAndLocations = async () => {
        try {
            const token = localStorage.getItem("token");
            if (token) setAuthToken(token);

            const [prodRes, locRes] = await Promise.all([
                api.get("/product"),
                api.get("/location"),
            ]);

            setProducts(prodRes.data.data);
            setLocations(locRes.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProductsAndLocations();
        fetchPeminjaman();
    }, []);

    // Tambahkan fungsi ini sebelum return statement
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleExport = () => {
        if (filteredPeminjaman.length === 0) {
            alert('Tidak ada data untuk diexport');
            return;
        }

        // Buat data dengan header tambahan
        const dataWithHeader = [
            // Header informasi
            ['LAPORAN DATA PEMINJAMAN'],
            [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
            [`Total Data: ${filteredPeminjaman.length} peminjaman`],
            [], // baris kosong
            // Header tabel
            ['No', 'ID', 'User', 'Produk', 'Lokasi', 'Qty', 'Tanggal Mulai', 'Tanggal Selesai', 'Status', 'Catatan'],
            // Data
            ...filteredPeminjaman.map((p, index) => [
                index + 1,
                p.id,
                p.user.name,
                p.product.product_name,
                p.location.location_name,
                p.qty,
                formatDate(p.start_date),
                formatDate(p.end_date),
                p.status === 'dipinjam' ? 'Dipinjam' : 'Dikembalikan',
                p.note || '-'
            ])
        ];

        // Buat worksheet
        const worksheet = utils.aoa_to_sheet(dataWithHeader);

        // Merge cells untuk header
        if (!worksheet['!merges']) worksheet['!merges'] = [];
        worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }); // Judul
        worksheet['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }); // Tanggal
        worksheet['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 9 } }); // Total Data

        // Definisikan style untuk border
        const borderStyle = {
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            }
        };

        // Definisikan style untuk header tabel
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2E86AB" } },
            alignment: { horizontal: "center" },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            }
        };

        // Definisikan style untuk data
        const dataStyle = {
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            }
        };

        // Terapkan border ke semua cell yang berisi data
        const range = utils.decode_range(worksheet['!ref'] || 'A1:A1');

        for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = utils.encode_cell({ r: row, c: col });

                if (!worksheet[cellAddress]) {
                    worksheet[cellAddress] = { t: 's', v: '' };
                }

                if (!worksheet[cellAddress].s) {
                    worksheet[cellAddress].s = {};
                }

                // Terapkan style berdasarkan tipe cell
                if (row === 4) { // Header tabel (baris ke-5)
                    Object.assign(worksheet[cellAddress].s, headerStyle);
                } else if (row >= 5) { // Data (baris ke-6 dan seterusnya)
                    Object.assign(worksheet[cellAddress].s, dataStyle);
                } else { // Header informasi (baris 1-3)
                    Object.assign(worksheet[cellAddress].s, {
                        ...borderStyle,
                        alignment: { horizontal: "center" },
                        font: { bold: true }
                    });
                }
            }
        }

        // Atur lebar kolom
        worksheet['!cols'] = [
            { wch: 5 },  // No
            { wch: 8 },  // ID
            { wch: 20 }, // User
            { wch: 25 }, // Produk
            { wch: 15 }, // Lokasi
            { wch: 8 },  // Qty
            { wch: 15 }, // Tanggal Mulai
            { wch: 15 }, // Tanggal Selesai
            { wch: 12 }, // Status
            { wch: 30 }, // Catatan
        ];

        // Atur tinggi baris untuk header informasi
        if (!worksheet['!rows']) worksheet['!rows'] = [];
        for (let i = 0; i < 5; i++) {
            worksheet['!rows'][i] = { hpt: 25 }; // Tinggi baris 25 point
        }

        // Buat workbook dan export
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Peminjaman');
        writeFile(workbook, `Laporan_Peminjaman_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Filter & Pagination
    // Filter & Pagination (frontend only)
    const filteredPeminjaman = peminjaman.filter(p => {
        const matchSearch =
            p.user.name.toLowerCase().includes(search.toLowerCase()) ||
            p.product.product_name.toLowerCase().includes(search.toLowerCase());

        const matchProduct = productId ? p.product.id === productId : true;
        const matchLocation = locationId ? p.location.id === locationId : true;
        const matchStatus = status ? p.status === status : true;
        const matchDate = date
            ? new Date(p.start_date) <= new Date(date) && new Date(p.end_date) >= new Date(date)
            : true;

        return matchSearch && matchProduct && matchLocation && matchStatus && matchDate;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPeminjaman.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPeminjaman.length / itemsPerPage);

    return (
        <AdminLayout title="Peminjaman">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white rounded-xl shadow-sm p-6 mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kelola Peminjaman</h1>
                    <p className="text-gray-600">Daftar semua peminjaman di sistem</p>
                    {error && <p className="text-red-500 mt-1">{error}</p>}
                </div>

                <div className="text-gray-700 text-sm lg:text-base flex flex-col text-left lg:text-right">
                    <span className="font-medium text-2xl text-blue-700">{peminjaman.length}</span>
                    <span>Peminjaman tersedia</span>
                </div>
            </div>

            {/* Table & Controls */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between mb-4">
                    <div className="flex space-x-2">
                        <button
                            onClick={handleExport}
                            className="flex items-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        >
                            <FileText className="mr-2 w-4 h-4" />
                            Export Excel
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">

                    {/* Search */}
                    <div className="w-full md:w-64 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Cari user/produk..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        />
                        {search && (
                            <button
                                onClick={() => { setSearch(""); setCurrentPage(1); }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                <RefreshCcw className="h-5 w-5 text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua status</option>
                            <option value="dipinjam">Dipinjam</option>
                            <option value="dikembalikan">Dikembalikan</option>
                        </select>

                        <select
                            value={productId}
                            onChange={(e) => setProductId(Number(e.target.value))}
                            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua produk</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.product_name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={locationId}
                            onChange={(e) => setLocationId(Number(e.target.value))}
                            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua lokasi</option>
                            {locations.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.location_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reset Button */}
                    <div className="flex md:block">
                        <button
                            onClick={() => {
                                setSearch("");
                                setDate("");
                                setStatus("");
                                setProductId("");
                                setLocationId("");
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 rounded-lg border border-gray-500 hover:bg-gray-200 text-sm font-medium text-blue-700 flex items-center justify-center w-full md:w-auto"
                        >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Reset
                        </button>
                    </div>

                    {/* Info jumlah */}
                    <div className="text-sm text-gray-500 md:ml-auto md:text-right">
                        Menampilkan {currentItems.length} dari {filteredPeminjaman.length} peminjaman
                    </div>

                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredPeminjaman.length === 0 ? (
                    <div className="text-center py-12">
                        <CircleAlert className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada peminjaman</h3>
                        <p className="mt-1 text-gray-500">
                            {search ? "Tidak ada peminjaman yang sesuai dengan pencarian Anda." : "Tidak ada peminjaman."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Mulai</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Selesai</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentItems.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">#{p.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.product.product_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.location.location_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.qty}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.start_date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.end_date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${p.status === "dipinjam"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"
                                                        }`}
                                                >
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate">{p.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-gray-700">
                                    Menampilkan <span className="font-medium">{indexOfFirstItem + 1}</span> sampai <span className="font-medium">
                                        {Math.min(indexOfLastItem, filteredPeminjaman.length)}
                                    </span> dari <span className="font-medium">{filteredPeminjaman.length}</span> hasil
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}