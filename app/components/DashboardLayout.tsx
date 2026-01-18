import { useState } from "react";
import { LayoutDashboard, Video, History, Settings, LogOut, Menu, Bell, Sparkles } from "lucide-react";

interface DashboardLayoutProps {
    children: React.ReactNode;
    history?: any[];
    onHistorySelect?: (item: any) => void;
}

export default function DashboardLayout({ children, history = [], onHistorySelect }: DashboardLayoutProps) {
    const [showHistory, setShowHistory] = useState(false);

    return (
        <div className="flex h-screen w-full bg-zinc-950 text-gray-100 font-sans selection:bg-blue-500/30">
            {/* Sidebar */}
            <aside className="hidden w-64 flex-col border-r border-white/10 bg-black/40 p-6 backdrop-blur-xl md:flex">
                {/* Logo */}
                <div className="mb-10 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl">
                        <img src="https://cdn-icons-png.freepik.com/256/5783/5783868.png?semt=ais_white_label" alt="Logo" className="h-6 w-6 object-contain" style={{ transform: "scaleX(-1)" }} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">Streamline</span>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 space-y-2">
                    <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={!showHistory} onClick={() => setShowHistory(false)} />
                    {/* <NavItem icon={<Video size={20} />} label="Videos" /> Removed as per instruction */}
                    <NavItem icon={<History size={20} />} label="History" active={showHistory} onClick={() => setShowHistory(true)} />

                    {showHistory && (
                        <div className="mt-4 space-y-2 overflow-y-auto max-h-[300px] pr-2">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Videos</h4>
                            {history.length === 0 && <p className="text-xs text-gray-600 italic">No history yet</p>}
                            {history.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (onHistorySelect) onHistorySelect(item);
                                        setShowHistory(false); // Close history mode or stay? Let's switch back to dash view with loaded data
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-white/5 text-left group"
                                >
                                    <div className="h-8 w-12 shrink-0 overflow-hidden rounded bg-gray-800">
                                        <img src={item.thumbnail} alt="" className="h-full w-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <span className="truncate text-xs font-medium text-gray-400 group-hover:text-white transition-colors">{item.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="pt-4 mt-auto">
                        <NavItem icon={<Settings size={20} />} label="Settings" />
                    </div>
                </nav>

                {/* User / Logout */}
                <div className="border-t border-white/10 pt-6">
                    <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white">
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex flex-1 flex-col overflow-hidden relative">
                {/* Background Gradients */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-500/5 via-transparent to-transparent" />

                {/* Top Bar */}
                <header className="flex h-16 items-center justify-between border-b border-white/5 bg-black/20 px-6 backdrop-blur-md">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="md:hidden"><Menu /></span>
                        <span>Dashboard</span>
                        <span>/</span>
                        <span className="text-white">New Project</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative rounded-full p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                            <Bell size={20} />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                        </button>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 ring-2 ring-white/10" />
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 md:p-6">
                    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${active
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}
