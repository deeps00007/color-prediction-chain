import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function Dashboard({ isDarkMode }) {
    const games = [
        {
            id: 'color-prediction',
            name: 'Color Prediction',
            description: 'Predict the next color and win up to 5x your bet!',
            path: '/color-prediction',
            color: 'bg-indigo-600',
            icon: '🎨'
        },
        {
            id: 'plinko',
            name: 'Plinko',
            description: 'Drop the ball through the pegs and hit the multipliers!',
            path: '/plinko',
            color: 'bg-pink-600',
            icon: '📉'
        }
    ];

    return (
        <div className={clsx("flex-1 p-8 overflow-y-auto", isDarkMode ? "bg-gray-900" : "bg-gray-50")}>
            <div className="max-w-4xl mx-auto">
                <h2 className={clsx("text-3xl font-bold mb-8", isDarkMode ? "text-white" : "text-gray-900")}>
                    Choose Your Game
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {games.map((game) => (
                        <Link key={game.id} to={game.path}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={clsx(
                                    "p-8 rounded-2xl shadow-lg border transition-all cursor-pointer h-full flex flex-col items-start",
                                    isDarkMode ? "bg-gray-800 border-gray-700 hover:bg-gray-750" : "bg-white border-gray-200 hover:shadow-xl"
                                )}
                            >
                                <div className={clsx("w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4", game.color, "text-white shadow-md")}>
                                    {game.icon}
                                </div>
                                <h3 className={clsx("text-2xl font-bold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>
                                    {game.name}
                                </h3>
                                <p className={clsx("text-base mb-6 flex-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                                    {game.description}
                                </p>
                                <span className={clsx("px-6 py-2 rounded-lg font-semibold text-sm", isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900")}>
                                    Play Now →
                                </span>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
