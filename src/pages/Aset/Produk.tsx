import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import Modal from "../../components/Modal";
import api, { setAuthToken } from "../../api";
import { CircleAlert, Plus, RefreshCcw, Search, SquarePen, Trash2 } from "lucide-react";

interface Category {
    id: number;
    category_name: string;
}

interface Product {
    id: number;
    product_name: string;
    category_id: number;
    qty: number;
    category: Category | null;
}

export default function Produk() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [productName, setProductName] = useState("");
    const [productQty, setProductQty] = useState(0);
    const [productCategoryId, setProductCategoryId] = useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [filterCategoryId, setFilterCategoryId] = useState<number | "">("");

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const res = await api.get("/categories");
            setCategories(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    // Fetch products
    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/product");
            setProducts(res.data.data || []);
        } catch (err: any) {
            console.error(err);
            setError("Gagal mengambil data produk");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthToken(token);
            fetchCategories();
            fetchProducts();
        } else {
            setError("Silakan login terlebih dahulu.");
        }
    }, []);

    // Filter & Pagination
    const filteredProducts = products.filter(
        p =>
            p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (filterCategoryId === "" || p.category_id === filterCategoryId)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Modal
    const openModal = (product?: Product) => {
        setCurrentProduct(product || null);
        setProductName(product?.product_name || "");
        setProductQty(product?.qty || 0);
        setProductCategoryId(product?.category_id || (categories[0]?.id ?? null));
        setModalTitle(product ? "Edit Produk" : "Tambah Produk");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
        setProductName("");
        setProductQty(0);
        setProductCategoryId(null);
    };

    // Create / Update
    const handleSave = async () => {
        if (!productName.trim() || !productCategoryId) return alert("Nama dan kategori produk wajib diisi");
        try {
            if (currentProduct) {
                await api.put(`/product/${currentProduct.id}/update`, {
                    product_name: productName,
                    qty: productQty,
                    category_id: productCategoryId,
                });
            } else {
                await api.post("/product/create", {
                    product_name: productName,
                    qty: productQty,
                    category_id: productCategoryId,
                });
            }
            fetchProducts();
            closeModal();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menyimpan produk");
        }
    };

    // Delete
    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus produk ini?")) return;
        try {
            await api.delete(`/product/${id}/delete`);
            fetchProducts();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal menghapus produk");
        }
    };

    return (
        <AdminLayout title="Produk">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="mb-4 lg:mb-0">
                    <h1 className="text-2xl font-bold text-gray-800">Kelola Produk</h1>
                    <p className="text-gray-600">Daftar produk yang tersedia di sistem</p>
                    {error && <p className="text-red-500 mt-1">{error}</p>}
                </div>
                <div className="text-gray-700 text-right text-sm lg:text-base flex flex-col">
                    <span className="font-medium text-2xl text-blue-700">{products.length}</span>
                    <span>Produk tersedia</span>
                </div>
            </div>

            {/* Kontrol */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center shadow-sm"
                    >
                        <Plus className="mr-2" /> Tambah Produk
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-3 md:space-y-0">
                    <div className="flex space-x-3 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative w-full md:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Cari produk..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                            {searchTerm && (
                                <button onClick={() => { setSearchTerm(""); setCurrentPage(1); }} className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                                    <RefreshCcw className="h-5 w-5 text-gray-400" />
                                </button>
                            )}
                        </div>

                        {/* Filter kategori */}
                        <div>
                            <select
                                className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={filterCategoryId}
                                onChange={(e) => { setFilterCategoryId(Number(e.target.value)); setCurrentPage(1); }}
                            >
                                <option value="">Semua Kategori</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                            </select>
                        </div>

                        {/* Tombol Reset */}
                        <button
                            onClick={() => { setSearchTerm(""); setFilterCategoryId(""); setCurrentPage(1); }}
                            className="px-4 py-3 rounded-lg border border-gray-500 hover:bg-gray-300 text-sm font-medium text-blue-700 flex items-center"
                        >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            <span>Reset</span>
                        </button>
                    </div>

                    <div className="text-sm text-gray-500">
                        Menampilkan {currentProducts.length} dari {filteredProducts.length} produk
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <CircleAlert className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada produk</h3>
                        <p className="mt-1 text-gray-500">
                            {searchTerm ? "Tidak ada produk yang sesuai dengan pencarian Anda." : "Mulai dengan menambahkan produk pertama Anda."}
                        </p>
                        {!searchTerm && (
                            <div className="mt-6">
                                <button onClick={() => openModal()} className="inline-flex items-center px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                    <Plus className="mr-2" /> Tambah Produk
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Produk</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentProducts.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">#{p.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.product_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.category?.category_name || "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{p.qty}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button onClick={() => openModal(p)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md text-sm flex items-center">
                                                        <SquarePen className="w-4 h-4 mr-1" /> Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md text-sm flex items-center">
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
                                    Menampilkan <span className="font-medium">{indexOfFirstItem + 1}</span> sampai <span className="font-medium">{Math.min(indexOfLastItem, filteredProducts.length)}</span> dari <span className="font-medium">{filteredProducts.length}</span> hasil
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`px-3 py-1.5 rounded-md text-sm font-medium ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}>
                                        Sebelumnya
                                    </button>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={`px-3 py-1.5 rounded-md text-sm font-medium ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                        <input
                            type="text"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                        <input
                            type="number"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={productQty}
                            onChange={(e) => setProductQty(Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={productCategoryId ?? ""}
                            onChange={(e) => setProductCategoryId(Number(e.target.value))}
                        >
                            {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
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