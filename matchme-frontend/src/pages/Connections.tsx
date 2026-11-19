import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { authService } from "../services/authService";
import AlienBackground from "../components/alien-background";
import "../styles/crt-effect.css";
import type { UserBasicDto } from "../types/types.ts";
import { userService } from "../api/userService";

function Connections() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"connected" | "incoming" | "outgoing">("connected");
    const [connectedUsers, setConnectedUsers] = useState<UserBasicDto[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<UserBasicDto[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<UserBasicDto[]>([]);
    const [loading, setLoading] = useState(true);

    // Helper to resolve images
    const getDisplayImage = (pic: string | null) => {
        if (!pic) return "/default-alien-avatar.png";
        if (pic.startsWith("http")) return pic;
        return `${API_BASE_URL}/user-photos/${pic}`;
    };

    const fetchList = async (endpoint: string, setter: (users: UserBasicDto[]) => void) => {
        const token = localStorage.getItem("authToken");
        try {
            const response = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const ids: number[] = await response.json();
                const fullProfiles = await Promise.all(
                    ids.map(async (id) => {
                        try {
                            return await userService.getUserBasic(id);
                        } catch (e) {
                            return null;
                        }
                    })
                );
                setter(fullProfiles.filter(p => p !== null) as UserBasicDto[]);
            }
        } catch (err) {
            console.error(`Failed to fetch ${endpoint}`, err);
        }
    };

    const refreshAll = async () => {
        setLoading(true);
        await Promise.all([
            fetchList(`${API_BASE_URL}/api/connections`, setConnectedUsers),
            fetchList(`${API_BASE_URL}/api/connections/requests`, setIncomingRequests),
            fetchList(`${API_BASE_URL}/api/connections/outgoing`, setOutgoingRequests)
        ]);
        setLoading(false);
    };

    useEffect(() => {
        refreshAll();
    }, []);

    const handleDisconnect = async (id: number) => {
        if (!confirm("Are you sure you want to sever this link?")) return;
        const token = localStorage.getItem("authToken");
        await fetch(`${API_BASE_URL}/api/connections/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        refreshAll();
    };

    const handleAccept = async (id: number) => {
        const token = localStorage.getItem("authToken");
        await fetch(`${API_BASE_URL}/api/connections/accept/${id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });
        refreshAll();
    };

    const handleReject = async (id: number) => {
        const token = localStorage.getItem("authToken");
        await fetch(`${API_BASE_URL}/api/connections/reject/${id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });
        refreshAll();
    };

    return (
        <>
            <AlienBackground />
            <div className="min-h-screen p-4 md:p-8 relative z-20 aesthetic-effect-crt overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Header with Navigation */}
                    <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
                        <button
                            onClick={() => navigate("/MainPage")}
                            className="border-4 border-green-500 bg-green-900/50 hover:bg-green-700 px-6 py-2 text-green-300 hover:text-white text-lg md:text-xl font-bold alien-glow transition-all font-sevastopol"
                        >
                            BACK
                        </button>
                        <h1
                            className="text-3xl md:text-5xl text-green-400 alien-glow font-sevastopol uppercase hidden sm:block"
                        >
                            Connection Status
                        </h1>
                        <button
                            onClick={async () => {
                                await (window as any).disconnectSocket?.();
                                authService.logout();
                                navigate("/login");
                            }}
                            className="border-4 border-red-500 bg-red-900/50 hover:bg-red-700 px-6 py-2 text-red-400 hover:text-white text-lg md:text-xl font-bold alien-glow-red transition-all font-sevastopol"
                        >
                            LOGOUT
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center gap-2 md:gap-4 mb-8 flex-wrap">
                        {[
                            { id: "connected", label: "ACTIVE" },
                            { id: "incoming", label: "INCOMING" },
                            { id: "outgoing", label: "OUTGOING" }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`border-2 md:border-4 px-3 md:px-6 py-1 md:py-2 text-lg md:text-xl font-bold transition-all ${activeTab === tab.id
                                    ? "border-green-500 bg-green-600 text-black alien-glow"
                                    : "border-green-900 bg-black/50 text-green-700 hover:border-green-500 hover:text-green-400"
                                    }`}
                                style={{ fontFamily: "Sevastopol Interface" }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center mt-20">
                            <p className="text-4xl text-green-400 alien-glow animate-pulse font-sevastopol">
                                ESTABLISHING UPLINK...
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">

                            {activeTab === "connected" && connectedUsers.map(user => (
                                <div key={user.id} className="border-2 border-green-500 bg-black/80 p-4 flex items-center gap-4 relative overflow-hidden">
                                    <div className="w-16 h-16 flex-shrink-0">
                                        <img src={getDisplayImage(user.profilePictureUrl)} alt={user.name} className="w-full h-full object-cover border border-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg md:text-xl text-green-300 font-bold font-sevastopol truncate">{user.name}</p>
                                        <p className="text-[10px] md:text-xs text-green-500">LINK STABLE</p>
                                    </div>
                                    <button onClick={() => handleDisconnect(user.id)} className="text-red-500 hover:text-red-300 font-bold border border-red-500 px-2 py-1 text-xs md:text-sm bg-red-900/20 whitespace-nowrap">
                                        SEVER
                                    </button>
                                </div>
                            ))}

                            {activeTab === "incoming" && incomingRequests.map(user => (
                                <div key={user.id} className="border-2 border-yellow-500 bg-black/80 p-4 flex flex-col gap-4 relative overflow-hidden">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 flex-shrink-0">
                                            <img src={getDisplayImage(user.profilePictureUrl)} alt={user.name} className="w-full h-full object-cover border border-yellow-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base md:text-lg text-yellow-300 font-bold font-sevastopol truncate">{user.name}</p>
                                            <p className="text-[10px] md:text-xs text-yellow-500 animate-pulse">INCOMING SIGNAL</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <button onClick={() => handleAccept(user.id)} className="flex-1 bg-green-600 text-black font-bold py-1 hover:bg-green-500 text-sm md:text-base">ACCEPT</button>
                                        <button onClick={() => handleReject(user.id)} className="flex-1 bg-red-600 text-black font-bold py-1 hover:bg-red-500 text-sm md:text-base">DENY</button>
                                    </div>
                                </div>
                            ))}

                            {activeTab === "outgoing" && outgoingRequests.map(user => (
                                <div key={user.id} className="border-2 border-orange-500 bg-black/80 p-4 flex items-center gap-4 relative overflow-hidden">
                                    <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0">
                                        <img src={getDisplayImage(user.profilePictureUrl)} alt={user.name} className="w-full h-full object-cover border border-orange-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base md:text-xl text-orange-300 font-bold font-sevastopol truncate">{user.name}</p>
                                        <p className="text-[10px] md:text-sm text-orange-500 animate-pulse mt-1">PENDING...</p>
                                    </div>
                                </div>
                            ))}

                            {/* Empty States */}
                            {activeTab === "connected" && connectedUsers.length === 0 && <p className="col-span-full text-center text-green-700 font-sevastopol uppercase">No Active Links Detected.</p>}
                            {activeTab === "incoming" && incomingRequests.length === 0 && <p className="col-span-full text-center text-yellow-700 font-sevastopol uppercase">No Incoming Signals.</p>}
                            {activeTab === "outgoing" && outgoingRequests.length === 0 && <p className="col-span-full text-center text-orange-700 font-sevastopol uppercase">No Pending Transmissions.</p>}

                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Connections;
