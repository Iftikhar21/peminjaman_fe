import { useEffect, useState, type ChangeEvent } from "react";
import { User, Mail, Phone, Lock, Save, CheckCircleIcon, CircleAlert } from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";
import api from "../api";
import { useAuth } from "../context/AuthContext";

interface ProfileData {
    id: number;
    email: string;
    user_name: string;
    role: string;
    phone: string;
}

interface ProfileForm {
    name: string;
    email: string;
    password: string;
    phone: string;
}

export default function Profile() {
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [msg, setMsg] = useState<string>("");
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    const [form, setForm] = useState<ProfileForm>({
        name: "",
        email: "",
        password: "",
        phone: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/");
            const d = res.data.data as ProfileData;

            setData(d);
            setForm({
                name: d.user_name ?? "",
                email: d.email ?? "",
                phone: d.phone ?? "",
                password: "",
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        setMsg("");
        setIsUpdating(true);

        const payload: Partial<ProfileForm> = {};

        if (form.name.trim()) payload.name = form.name;
        if (form.email.trim()) payload.email = form.email;
        if (form.password.trim()) payload.password = form.password;
        if (form.phone.trim()) payload.phone = form.phone;

        try {
            const response = await api.put("/admin/update", payload);

            setMsg("Berhasil update data!");
            setForm(prev => ({ ...prev, password: "" }));
            fetchProfile();
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error(err);
                setMsg("Gagal update data");
            }
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <AdminLayout title="Profile">
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <div className="flex items-center space-x-3">
                                <User className="w-5 h-5 text-white" />
                                <h2 className="text-xl font-semibold text-white">Informasi Pribadi</h2>
                            </div>
                            <p className="text-blue-100 text-sm mt-1 ml-8">
                                Perbarui informasi profil dan kontak Anda
                            </p>
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <>
                                    {/* Message Alert */}
                                    {msg && (
                                        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${msg.includes("Berhasil")
                                            ? "bg-green-50 text-green-800 border border-green-200"
                                            : "bg-red-50 text-red-800 border border-red-200"
                                            }`}>
                                            <div className={`flex-shrink-0 w-5 h-5 ${msg.includes("Berhasil") ? "text-green-500" : "text-red-500"
                                                }`}>
                                                {msg.includes("Berhasil") ? (
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                ) : (
                                                    <CircleAlert className="w-5 h-5" />
                                                )}
                                            </div>
                                            <span className="font-medium">{msg}</span>
                                        </div>
                                    )}

                                    {/* Form Grid */}
                                    <div className="space-y-6">
                                        {/* Name Field */}
                                        <div className="space-y-2">
                                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                                                <User className="w-4 h-4 text-gray-500" />
                                                <span>Nama Lengkap</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    name="name"
                                                    type="text"
                                                    value={form.name}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                                    placeholder="Masukkan nama lengkap"
                                                />
                                            </div>
                                        </div>

                                        {/* Email Field */}
                                        <div className="space-y-2">
                                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                                                <Mail className="w-4 h-4 text-gray-500" />
                                                <span>Alamat Email</span>
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    name="email"
                                                    type="email"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                                    placeholder="Masukkan alamat email"
                                                />
                                            </div>
                                        </div>

                                        {/* Phone Field */}
                                        <div className="space-y-2">
                                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                                                <Phone className="w-4 h-4 text-gray-500" />
                                                <span>Nomor Telepon</span>
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    name="phone"
                                                    type="text"
                                                    value={form.phone}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                                    placeholder="Masukkan nomor telepon"
                                                />
                                            </div>
                                        </div>

                                        {/* Password Field */}
                                        <div className="space-y-2">
                                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                                                <Lock className="w-4 h-4 text-gray-500" />
                                                <span>Password Baru</span>
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    name="password"
                                                    type="password"
                                                    value={form.password}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                                    placeholder="Masukkan password baru (opsional)"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 flex items-center space-x-1">
                                                <Lock className="w-3 h-3" />
                                                <span>Biarkan kosong jika tidak ingin mengubah password</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={handleUpdate}
                                            disabled={isUpdating}
                                            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm disabled:cursor-not-allowed"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>
                                                {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
                                            </span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500 flex items-center justify-center space-x-1">
                            <Lock className="w-3 h-3" />
                            <span>Data Anda aman dan terlindungi</span>
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}