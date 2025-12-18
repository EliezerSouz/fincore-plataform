export function DebugOverlay({ data, title }: { data: any, title: string }) {
    if (process.env.NODE_ENV === 'production') return null;

    return (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded text-xs z-[9999] max-w-sm overflow-auto max-h-[300px] font-mono">
            <h3 className="font-bold text-yellow-400 mb-2">{title}</h3>
            <pre>
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    )
}
