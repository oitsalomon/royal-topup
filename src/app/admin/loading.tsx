export default function AdminLoading() {
    return (
        <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium animate-pulse">Memuat halaman...</p>
        </div>
    )
}
