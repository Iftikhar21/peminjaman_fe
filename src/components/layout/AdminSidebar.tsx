// components/layout/AdminSidebar.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, ChevronDown, Database, LayoutDashboard, User, ChevronRight } from 'lucide-react';

interface MenuItem {
    route?: string;
    label: string;
    icon: React.ElementType;
    children?: MenuItem[];
}

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
    const { user } = useAuth();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

    const menus: MenuItem[] = [
        {
            route: '/admin/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
        },
        {
            label: 'Master Data',
            icon: Database,
            children: [
                { route: '/admin/jurusan', label: 'Jurusan', icon: Database },
                { route: '/admin/kelas', label: 'Kelas', icon: Database },
                { route: '/admin/status-peminjam', label: 'Status Peminjam', icon: Database },
                { route: '/admin/lokasi', label: 'Lokasi', icon: Database },
                { route: '/admin/categories', label: 'Kategori', icon: Database },
            ],
        },
        {
            label: 'Pengguna',
            icon: User,
            children: [
                { route: '/admin/user', label: 'User', icon: User },
                { route: '/admin/role', label: 'Role', icon: User },
            ],
        },
        {
            label: 'Aset',
            icon: Box,
            children: [
                { route: '/admin/product', label: 'Produk', icon: Box },
                { route: '/admin/peminjaman', label: 'Peminjaman', icon: Box },
            ],
        },
        {
            route: '/admin/profil',
            label: 'Profil',
            icon: User,
        },
    ];

    // Auto buka menu parent jika child aktif
    useEffect(() => {
        const newOpenMenus: { [key: string]: boolean } = {};

        menus.forEach(menu => {
            if (menu.children) {
                const isChildActive = menu.children.some(child =>
                    isActive(child.route!)
                );
                if (isChildActive) {
                    newOpenMenus[menu.label] = true;
                }
            }
        });

        setOpenMenus(prev => ({ ...prev, ...newOpenMenus }));
    }, [location.pathname]);

    const toggleMenu = (label: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const isActive = (route: string) => {
        if (route === '/admin/dashboard') {
            return location.pathname === route;
        }
        return location.pathname === route || location.pathname.startsWith(route + '/');
    };

    const isParentActive = (menu: MenuItem) => {
        if (menu.route) return isActive(menu.route);
        if (menu.children) {
            return menu.children.some(child => isActive(child.route!));
        }
        return false;
    };

    return (
        <>
            <aside
                className={`fixed top-0 left-0 h-screen w-80 bg-slate-900 text-white z-40 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-slate-800 flex-shrink-0">
                    <div className="w-40 h-40 mx-auto flex items-center justify-center">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                            <span className="text-slate-900 text-2xl font-bold">Admin</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Container dengan Scroll */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <nav className="p-4 flex-1 overflow-y-auto">
                        <ul className="space-y-2">
                            {menus.map((menu, index) => (
                                <li key={index} className="relative">
                                    {menu.children ? (
                                        // Dropdown Menu
                                        <div>
                                            <button
                                                onClick={() => toggleMenu(menu.label)}
                                                className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer group ${isParentActive(menu)
                                                        ? 'bg-blue-800 text-white shadow-lg'
                                                        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <menu.icon className={`w-5 h-5 flex-shrink-0 ${isParentActive(menu) ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                                        }`} />
                                                    <span className="font-medium text-sm">{menu.label}</span>
                                                </div>
                                                <ChevronDown
                                                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${openMenus[menu.label] ? 'rotate-180' : ''
                                                        } ${isParentActive(menu) ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                                        }`}
                                                />
                                            </button>

                                            {/* Dropdown Content */}
                                            {openMenus[menu.label] && (
                                                <div className="ml-4 mt-2 space-y-1 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                                                    {menu.children.map((child, childIndex) => {
                                                        const active = isActive(child.route!);
                                                        return (
                                                            <div key={childIndex} className="relative">
                                                                <Link
                                                                    to={child.route!}
                                                                    onClick={onClose}
                                                                    className={`block px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group ${active
                                                                            ? 'bg-blue-500 text-white shadow-md border-l-2 border-blue-300'
                                                                            : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center">
                                                                        <div className={`w-1.5 h-1.5 rounded-full mr-3 flex-shrink-0 transition-colors ${active ? 'bg-white' : 'bg-gray-500 group-hover:bg-gray-300'
                                                                            }`}></div>
                                                                        <span className="truncate">{child.label}</span>
                                                                        {active && (
                                                                            <ChevronRight className="w-3 h-3 ml-auto text-blue-200" />
                                                                        )}
                                                                    </div>
                                                                </Link>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Single Menu
                                        <Link
                                            to={menu.route!}
                                            onClick={onClose}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer group ${isActive(menu.route!)
                                                    ? 'bg-blue-800 text-white shadow-lg border-r-2 border-blue-400'
                                                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                                                }`}
                                        >
                                            <menu.icon className={`w-5 h-5 flex-shrink-0 ${isActive(menu.route!) ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                                }`} />
                                            <span className="font-medium text-sm">{menu.label}</span>
                                            {isActive(menu.route!) && (
                                                <ChevronRight className="w-4 h-4 ml-auto text-blue-200" />
                                            )}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User Info */}
                    <div className="p-4 border-t border-slate-800 flex-shrink-0">
                        <div className="flex items-center gap-3 px-2 py-2 text-gray-300 rounded-lg transition-colors duration-200 ">
                            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-gray-400 truncate">Administrator</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;