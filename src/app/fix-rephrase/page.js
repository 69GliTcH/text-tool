"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function FixRephrasePage() {
    const router = useRouter();
    const [text, setText] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState("");

    const handleGenerate = async (mode) => {
        if (!text.trim()) {
            setError("Please enter some text");
            return;
        }

        setLoading(mode);
        setResults([]);
        setError("");

        try {
            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    mode: mode,
                    text: text.trim()
                }),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data && data.result) {
                // Remove double quotes from results
                const cleanResults = data.result.map(line =>
                    line.replace(/^"|"$/g, '').trim()
                );
                const limitedResults = cleanResults.slice(0, 5);
                setResults(limitedResults);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (err) {
            console.error("Error fetching API:", err);
            setError("Failed to generate results. Please try again.");
        } finally {
            setLoading(null);
        }
    };

    const copyToClipboard = async (line) => {
        try {
            await navigator.clipboard.writeText(line);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const clearAll = () => {
        setText("");
        setResults([]);
        setError("");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
            {/* Navigation Bar */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">R</span>
                            </div>
                            <span className="text-xl font-semibold text-slate-800">Rephrasely</span>
                        </div>
                        <button
                            onClick={() => router.push("/")}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </nav>

            <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-4xl font-bold text-slate-800 mb-3">
                            Text Refinement
                        </h1>
                        <p className="text-slate-600 text-lg">Improve and rephrase your text with AI assistance</p>
                    </motion.div>

                    {/* Text Area */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8"
                    >
                        <div className="relative">
                            <textarea
                                className="w-full h-40 bg-white border border-slate-300 rounded-xl p-4 text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm transition-all duration-200"
                                placeholder="Enter your text here to fix grammar or rephrase..."
                                value={text}
                                onChange={(e) => {
                                    setText(e.target.value);
                                    setError("");
                                }}
                            />
                            {text && (
                                <button
                                    onClick={clearAll}
                                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <div className="flex justify-between items-center mt-3 text-sm text-slate-500">
                            <span>{text.length} characters</span>
                            <span>Maximum 5 variations</span>
                        </div>
                    </motion.div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4 mb-8"
                    >
                        <motion.button
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleGenerate("fix")}
                            disabled={loading}
                            className={`flex-1 py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 ${loading === 'fix'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-slate-300 text-slate-700 hover:border-blue-400 hover:shadow-md'
                                }`}
                        >
                            {loading === 'fix' ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span className="text-blue-500">✓</span>
                                    Fix Grammar & Spelling
                                </>
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleGenerate("rephrase")}
                            disabled={loading}
                            className={`flex-1 py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 ${loading === 'rephrase'
                                ? 'bg-green-600 text-white'
                                : 'bg-white border border-slate-300 text-slate-700 hover:border-green-400 hover:shadow-md'
                                }`}
                        >
                            {loading === 'rephrase' ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span className="text-green-500">↻</span>
                                    Rephrase Text
                                </>
                            )}
                        </motion.button>
                    </motion.div>

                    {/* Results */}
                    <AnimatePresence>
                        {results.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 mb-8"
                            >
                                <h3 className="text-xl font-semibold text-slate-800 mb-4">
                                    Results ({results.length})
                                </h3>
                                {results.map((line, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex justify-between items-center bg-white border border-slate-300 rounded-xl p-4 group hover:border-blue-400 hover:shadow-md transition-all duration-200"
                                    >
                                        <span className="text-slate-700 flex-1 pr-4 text-sm leading-relaxed">{line}</span>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => copyToClipboard(line)}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                        >
                                            Copy
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer */}
            <motion.footer
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center text-slate-600 py-8 relative z-10"
            >
                <div className="flex items-center justify-center gap-2 text-sm">
                    <span>Crafted by</span>
                    <a
                        href="https://discord.com/users/glitch6900"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors group"
                    >
                        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 group-hover:border-white/40 transition-colors shadow-sm">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z" />
                            </svg>
                            <span className="text-xs font-medium">GliTcH</span>
                        </div>
                    </a>
                </div>
            </motion.footer>
        </div>
    );
}