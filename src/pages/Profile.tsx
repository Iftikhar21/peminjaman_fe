import AdminLayout from "../components/layout/AdminLayout";

export default function Profile() {

    return (
        <AdminLayout title="Profile">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="mb-4 md:mb-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                        Kelola Profile
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Selamat datang di kelola Profile
                    </p>
                </div>
                <div className="text-left md:text-right">
                    {/* <p className="font-medium text-2xl sm:text-3xl text-blue-700">{formattedTime}</p>
                <p className="text-xs sm:text-sm text-gray-700">{formattedDate}</p> */}
                </div>
            </div>
        </AdminLayout>
    );
}