"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path;
    };

    return (
        <div className="w-64 border-r border-black/[.08] dark:border-white/[.145] h-screen p-4">
            <div className="text-2xl font-bold mb-8 pl-2">Shush</div>
            <nav>
                <ul className="space-y-2">
                    <li>
                        <Link
                            href="/ping"
                            className={`block p-2 rounded-md ${isActive("/ping")
                                ? "bg-[#f2f2f2] dark:bg-[#1a1a1a] border border-black/[.08] dark:border-white/[.145]"
                                : "hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] border border-transparent hover:border-black/[.08] dark:hover:border-white/[.145]"
                                }`}
                        >
                            Ping Utility
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/tiktok"
                            className={`block p-2 rounded-md ${isActive("/tiktok")
                                ? "bg-[#f2f2f2] dark:bg-[#1a1a1a] border border-black/[.08] dark:border-white/[.145]"
                                : "hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] border border-transparent hover:border-black/[.08] dark:hover:border-white/[.145]"
                                }`}
                        >
                            TikTok Utility
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}