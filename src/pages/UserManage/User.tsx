import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import Modal from "../../components/Modal";
import api, { setAuthToken } from "../../api";
import { CircleAlert, Plus, RefreshCcw, Search, SquarePen, Trash2 } from "lucide-react";

interface User {
    id: number;
    name: string;
    email: string;
    role_id: number;
    role: { id: number; role_name: string } | null;
}

interface Role {
    id: number;
    role_name: string;
}

export default function User() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userRoleId, setUserRoleId] = useState<number>(1);
    const [userPassword, setUserPassword] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    const [filterRoleId, setFilterRoleId] = useState<number | "all">("all");

    // Ambil roles
    const fetchRoles = async () => {
        try {
            const res = await api.get("/role/");
            console.log("Roles API full response:", res.data);
            setRoles(res.data.data || []); // <--- sesuaikan dengan API
        } catch (err) {
            console.error(err);
        }
    };

    // Ambil users
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/user/");
            setUsers(res.data.user || []);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) setError("Unauthorized: silakan login terlebih dahulu");
            else setError("Gagal mengambil data user");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthToken(token);
            fetchRoles();
            fetchUsers();
        } else {
            setError("Silakan login terlebih dahulu.");
        }
    }, []);

    // Filter & Pagination
    const filteredUsers = users.filter(u =>
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterRoleId === "all" || u.role_id === filterRoleId)
    );
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    // Modal Open / Close
    const openModal = (user?: User) => {
        setCurrentUser(user || null);
        setUserName(user?.name || "");
        setUserEmail(user?.email || "");
        setUserRoleId(user?.role_id || 1);
        setUserPassword("");
        setModalTitle(user ? "Edit User" : "Tambah User");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
        setUserName("");
        setUserEmail("");
        setUserRoleId(1);
        setUserPassword("");
    };

    // Create / Update
    const handleSave = async () => {
        if (!userName.trim() || !userEmail.trim()) return alert("Nama dan Email tidak boleh kosong");
        try {
            if (currentUser) {
                await api.put(`/user/${currentUser.id}/update`, {
                    name: userName,
                    email: userEmail,
                    role_id: userRoleId
                });
            } else {
                if (!userPassword.trim()) return alert("Password tidak boleh kosong");
                await api.post("/user/create-user", {
                    name: userName,
                    email: userEmail,
                    password: userPassword,
                    role_id: userRoleId
                });
            }
            fetchUsers();
            closeModal();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menyimpan user");
        }
    };

    // Delete
    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus user ini?")) return;
        try {
            await api.delete(`/user/${id}/delete`);
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menghapus user");
        }
    };

    return (
        <AdminLayout title="User">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white rounded-xl shadow-sm p-6 mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kelola User</h1>
                    <p className="text-gray-600">Daftar User yang tersedia di sistem</p>
                    {error && <p className="text-red-500 mt-1">{error}</p>}
                </div>

                <div className="text-gray-700 text-sm lg:text-base flex flex-col text-left lg:text-right">
                    <span className="font-medium text-2xl text-blue-700">{users.length}</span>
                    <span>User tersedia</span>
                </div>
            </div>

            {/* Table & Controls */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center shadow-sm"
                    >
                        <Plus className="mr-2" /> Tambah User
                    </button>
                </div>

                {/* Search */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-2 md:space-y-0 md:space-x-4">
                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Cari User..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                            >
                                <RefreshCcw className="h-5 w-5 text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Filter Role */}
                    <div className="w-full md:w-48 relative">
                        <select
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={filterRoleId}
                            onChange={(e) => {
                                const val = e.target.value === "all" ? "all" : Number(e.target.value);
                                setFilterRoleId(val);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="all">Semua Role</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.role_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Reset Search & Filter */}
                    <button
                        onClick={() => { setSearchTerm(""); setFilterRoleId("all"); setCurrentPage(1); }}
                        className="px-4 py-3 rounded-lg border border-gray-500 hover:bg-gray-300 text-sm font-medium text-blue-700 flex items-center"
                    >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        <span>Reset</span>
                    </button>
                    
                    {/* Info jumlah */}
                    <div className="text-sm text-gray-500 md:ml-auto">
                        Menampilkan {currentItems.length} dari {filteredUsers.length} user
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <CircleAlert className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada user</h3>
                        <p className="mt-1 text-gray-500">
                            {searchTerm ? "Tidak ada user yang sesuai dengan pencarian Anda." : "Mulai dengan menambahkan user pertama Anda."}
                        </p>
                        {!searchTerm && (
                            <div className="mt-6">
                                <button
                                    onClick={() => openModal()}
                                    className="inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="mr-2" /> Tambah User
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentItems.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">#{user.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.role?.role_name ? (
                                                    <span
                                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${user.role.role_name.toLowerCase() === "admin"
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-green-100 text-green-800"
                                                            }`}
                                                    >
                                                        {user.role.role_name}
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => openModal(user)}
                                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md text-sm flex items-center"
                                                    >
                                                        <SquarePen className="w-4 h-4 mr-1" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md text-sm flex items-center"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" /> Hapus
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
                                        {Math.min(indexOfLastItem, filteredUsers.length)}
                                    </span> dari <span className="font-medium">{filteredUsers.length}</span> hasil
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

            {/* Modal */}
            <Modal isOpen={isModalOpen} title={modalTitle} onClose={closeModal}>
                <div className="flex flex-col space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                        <input
                            type="text"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                        />
                    </div>
                    {!currentUser && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={userPassword}
                                onChange={(e) => setUserPassword(e.target.value)}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={userRoleId}
                            onChange={(e) => setUserRoleId(Number(e.target.value))}
                        >
                            {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Batal</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Simpan</button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
