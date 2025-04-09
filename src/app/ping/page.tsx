import PingButton from "@/components/PingButton";

export default function PingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)]">
            <h1 className="text-2xl font-bold mb-8">Ping Utility</h1>
            <PingButton />
        </div>
    );
}