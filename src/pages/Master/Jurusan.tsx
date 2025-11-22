import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import Modal from "../../components/Modal";
import api, { setAuthToken } from "../../api";
import { CircleAlert, Plus, RefreshCcw, Search, SquarePen, Trash2 } from "lucide-react";

interface Major {
    id: number;
    major_name: string;
}

export default function Jurusan() {
    const [majors, setMajors] = useState<Major[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [currentMajor, setCurrentMajor] = useState<Major | null>(null);
    const [majorName, setMajorName] = useState("");

    // State untuk pencarian dan pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    // Ambil data jurusan
    const fetchMajors = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/major/");
            setMajors(res.data.data || []);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                setError("Unauthorized: silakan login terlebih dahulu");
            } else {
                setError("Gagal mengambil data jurusan");
            }
            setMajors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthToken(token); // pasang token
            fetchMajors();
        } else {
            setError("Silakan login terlebih dahulu.");
        }
    }, []);

    // Filter data berdasarkan pencarian
    const filteredMajors = majors.filter(major =>
        major.major_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMajors = filteredMajors.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredMajors.length / itemsPerPage);

    // Create / Update
    const handleSave = async () => {
        if (!majorName.trim()) return alert("Nama jurusan tidak boleh kosong");
        try {
            if (currentMajor) {
                await api.put(`/major/${currentMajor.id}/update`, { major_name: majorName });
            } else {
                await api.post("/major/create", { major_name: majorName });
            }
            fetchMajors();
            closeModal();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menyimpan jurusan");
        }
    };

    // Delete
    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus jurusan ini?")) return;
        try {
            await api.delete(`/major/${id}/delete`);
            fetchMajors();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menghapus jurusan");
        }
    };

    const openModal = (major?: Major) => {
        setCurrentMajor(major || null);
        setMajorName(major?.major_name || "");
        setModalTitle(major ? "Edit Jurusan" : "Tambah Jurusan");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentMajor(null);
        setMajorName("");
    };

    // Reset pencarian
    const handleSearchReset = () => {
        setSearchTerm("");
        setCurrentPage(1);
    };

    return (
        <AdminLayout title="Jurusan">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white rounded-xl shadow-sm p-6 mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kelola Jurusan</h1>
                    <p className="text-gray-600">Daftar jurusan yang tersedia di sistem</p>
                    {error && <p className="text-red-500 mt-1">{error}</p>}
                </div>

                <div className="text-gray-700 text-sm lg:text-base flex flex-col text-left lg:text-right">
                    <span className="font-medium text-2xl text-blue-700">{majors.length}</span>
                    <span>Jurusan tersedia</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center shadow-sm cursor-pointer"
                    >
                        <Plus className="mr-2" />
                        Tambah Jurusan
                    </button>
                </div>
                {/* Search and Stats Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div className="relative w-full md:w-64 mb-4 md:mb-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Cari jurusan..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={handleSearchReset}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                            >
                                <RefreshCcw className="h-5 w-5 text-gray-400" />
                            </button>
                        )}
                    </div>
                    <div className="text-sm text-gray-500">
                        Menampilkan {currentMajors.length} dari {filteredMajors.length} jurusan
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredMajors.length === 0 ? (
                    <div className="text-center py-12">
                        <CircleAlert className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada jurusan</h3>
                        <p className="mt-1 text-gray-500">
                            {searchTerm ? "Tidak ada jurusan yang sesuai dengan pencarian Anda." : "Mulai dengan menambahkan jurusan pertama Anda."}
                        </p>
                        {!searchTerm && (
                            <div className="mt-6">
                                <button
                                    onClick={() => openModal()}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <Plus className="mr-2" />
                                    Tambah Jurusan
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nama Jurusan
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentMajors.map((major) => (
                                        <tr key={major.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">#{major.id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{major.major_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => openModal(major)}
                                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer"
                                                    >
                                                        <SquarePen className="w-4 h-4 mr-1" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(major.id)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
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
                                        {Math.min(indexOfLastItem, filteredMajors.length)}
                                    </span> dari <span className="font-medium">{filteredMajors.length}</span> hasil
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

            <Modal isOpen={isModalOpen} title={modalTitle} onClose={closeModal}>
                <div className="flex flex-col space-y-4">
                    <div>
                        <label htmlFor="majorName" className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Jurusan
                        </label>
                        <input
                            id="majorName"
                            type="text"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Masukkan nama jurusan"
                            value={majorName}
                            onChange={(e) => setMajorName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}