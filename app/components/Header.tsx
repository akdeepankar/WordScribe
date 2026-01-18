

export default function Header() {
    return (
        <header className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl">
                <img src="https://cdn-icons-png.freepik.com/256/5783/5783868.png?semt=ais_white_label" alt="Logo" className="h-10 w-10 object-contain" style={{ transform: "scaleX(-1)" }} />
            </div>
            <div className="space-y-2">
                <h1 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-white dark:to-gray-400 sm:text-5xl">
                    WordScribe
                </h1>
                <p className="max-w-[40ch] text-lg text-gray-500 dark:text-gray-400">
                    Auto-generate YouTube chapters from any video using AI
                </p>
            </div>
        </header>
    );
}
