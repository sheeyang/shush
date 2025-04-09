import TikTokButton from "@/components/TikTokButton";

export default function TikTokPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)]">
            <h1 className="text-2xl font-bold mb-8">TikTok Utility</h1>
            <TikTokButton />
        </div>
    );
}