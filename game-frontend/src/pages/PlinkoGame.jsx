import { useEffect, useRef, useState, useMemo } from 'react';
import Matter from 'matter-js';
import clsx from 'clsx';
import { ethers } from 'ethers';
import { PLINKO_ADDRESS, PLINKO_ABI } from '../config';

export default function PlinkoGame({ isDarkMode, showMessage, account, balance, setBalance, signer, tokenContract }) {
    // --- Refs ---
    const sceneRef = useRef(null);
    const engineRef = useRef(null);
    
    // --- State ---
    const [betAmount, setBetAmount] = useState('10');
    const [rows, setRows] = useState(16);
    const [plinkoContract, setPlinkoContract] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastMulti, setLastMulti] = useState(null);

    // --- Configuration & Math ---
    const width = 800;
    const height = 600;
    
    // Memoize board dimensions so UI and Physics always match
    const { gap, bucketWidth, totalBoardWidth, startX } = useMemo(() => {
        // Gap = space between pegs.
        const gap = width / (rows + 5); 
        const totalBoardWidth = (rows + 1) * gap;
        const startX = (width - totalBoardWidth) / 2;
        return { gap, bucketWidth: gap, totalBoardWidth, startX };
    }, [rows]);

    const getMultipliers = (rowCount) => {
        if (rowCount === 8) return [29, 15, 8, 2, 0.5, 2, 8, 15, 29];
        if (rowCount === 12) return [110, 25, 10, 5, 2, 1, 0.5, 1, 2, 5, 10, 25, 110];
        return [1000, 100, 20, 10, 5, 2, 0.5, 0.2, 0.2, 0.2, 0.5, 2, 5, 10, 20, 100, 1000];
    };

    const multipliers = useMemo(() => getMultipliers(rows), [rows]);

    // --- Contract Initialization ---
    useEffect(() => {
        if (signer) {
            try {
                const validAddress = ethers.getAddress(PLINKO_ADDRESS);
                const contract = new ethers.Contract(validAddress, PLINKO_ABI, signer);
                setPlinkoContract(contract);
            } catch (e) {
                console.error("Contract Error", e);
                showMessage("Invalid Contract Address", "error");
            }
        }
    }, [signer]);

    // --- Physics Engine Setup ---
    useEffect(() => {
        if (!sceneRef.current) return;

        // Cleanup existing canvas if React strict mode double-fired
        sceneRef.current.innerHTML = '';

        const Engine = Matter.Engine,
            Render = Matter.Render,
            Runner = Matter.Runner,
            Bodies = Matter.Bodies,
            Composite = Matter.Composite;

        const engine = Engine.create();
        // Slightly higher gravity for better "drop" feel
        engine.gravity.y = 1.5; 

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: width,
                height: height,
                wireframes: false, // Set to true to debug physics bodies
                background: 'transparent',
                pixelRatio: window.devicePixelRatio || 1
            }
        });

        // 1. Buckets & Dividers
        const bucketHeight = 80;
        const bucketWalls = [];
        
        for (let i = 0; i <= rows + 1; i++) {
            const x = startX + (i * gap);
            const y = height - bucketHeight / 2;
            
            // Divider wall
            const wall = Bodies.rectangle(x, y, 4, bucketHeight, {
                isStatic: true,
                render: { fillStyle: 'rgba(255, 255, 255, 0.3)' },
                label: 'bucket-wall'
            });
            bucketWalls.push(wall);
        }

        // 2. Pegs (The Pyramid)
        const pegs = [];
        const pegStartY = 80;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= r + 2; c++) {
                const x = (width / 2) - ((r + 2) * gap / 2) + (c * gap);
                const y = pegStartY + r * gap;
                
                const peg = Bodies.circle(x, y, 4, {
                    isStatic: true,
                    render: { fillStyle: '#d946ef' }, // Fuchsia
                    label: 'peg',
                    restitution: 0.5 // Bounciness
                });
                pegs.push(peg);
            }
        }

        // 3. Invisible Boundary Walls (Keep ball in frame)
        const wallLeft = Bodies.rectangle(0, height / 2, 10, height, { isStatic: true, render: { visible: false } });
        const wallRight = Bodies.rectangle(width, height / 2, 10, height, { isStatic: true, render: { visible: false } });

        Composite.add(engine.world, [wallLeft, wallRight, ...bucketWalls, ...pegs]);

        const runner = Runner.create();
        Runner.run(runner, engine);
        Render.run(render);

        engineRef.current = engine;

        // Cleanup function
        return () => {
            Render.stop(render);
            Runner.stop(runner);
            if(engineRef.current) {
                Composite.clear(engine.world);
                Engine.clear(engine);
            }
            if(render.canvas) render.canvas.remove();
            engineRef.current = null;
        };
    }, [rows, gap, startX]); // Re-run if rows/math changes

    // --- Gameplay Logic ---
    const dropBall = async () => {
        if (!account || !plinkoContract || isProcessing) return;

        try {
            setIsProcessing(true);
            setLastMulti(null);
            const amountWei = ethers.parseEther(betAmount);

            // 1. Check Allowance
            const allowance = await tokenContract.allowance(account, PLINKO_ADDRESS);
            if (allowance < amountWei) {
                showMessage("Approving tokens...", "info");
                const tx = await tokenContract.connect(signer).approve(PLINKO_ADDRESS, ethers.MaxUint256);
                await tx.wait();
            }

            // 2. Execute Play Transaction
            showMessage("Signing transaction...", "info");
            // Gas limit manual override is often needed for RNG/complex contracts
            const tx = await plinkoContract.play(amountWei, rows, { gasLimit: 500000 });
            showMessage("Processing on blockchain...", "info");
            
            const receipt = await tx.wait();

            // 3. Parse Event for Result
            let gameResult = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = plinkoContract.interface.parseLog(log);
                    if (parsed && parsed.name === 'GameResult') {
                        gameResult = parsed.args;
                        break;
                    }
                } catch (e) {}
            }

            if (gameResult) {
                // Update Balance (Optimistic or fetched)
                if (tokenContract) {
                    tokenContract.balanceOf(account).then(b => 
                        setBalance(parseFloat(ethers.formatEther(b)).toFixed(2))
                    );
                }

                const multiplier = Number(gameResult.multiplier) / 10;
                const bucketIndex = Number(gameResult.bucketIndex);
                
                // 4. Trigger Visual Ball Drop
                spawnVisualBall(bucketIndex, multiplier, () => {
                    setLastMulti(multiplier);
                    const payout = ethers.formatEther(gameResult.payout);
                    
                    if(multiplier >= 1) {
                        showMessage(`WON ${payout} CGT (${multiplier}x)!`, 'success');
                    } else {
                        showMessage(`Result: ${multiplier}x`, 'info');
                    }
                    setIsProcessing(false);
                });
            } else {
                throw new Error("Game result event not found in logs");
            }

        } catch (error) {
            console.error("Game Error:", error);
            // Nicer error message handling
            let msg = "Transaction failed";
            if(error.reason) msg = error.reason;
            if(error.message && error.message.includes("user rejected")) msg = "Transaction rejected";
            
            showMessage(msg, "error");
            setIsProcessing(false);
        }
    };

    // --- Visual Ball Logic ---
    const spawnVisualBall = (bucketIndex, multiplier, onComplete) => {
        const engine = engineRef.current;
        if (!engine) return;

        // Calculate Target X strictly based on the Gap math used in useEffect
        // bucketIndex 0 is the far left bucket
        const targetX = startX + (bucketIndex * gap) + (gap / 2);

        // Add slight randomness to spawn X so it doesn't look robotic
        const randomOffset = (Math.random() - 0.5) * 10;
        
        const ball = Matter.Bodies.circle(width / 2 + randomOffset, 20, 7, {
            restitution: 0.8,
            friction: 0.005,
            density: 1.0,
            render: { fillStyle: '#39ff14' }, // Neon Green
            label: 'player-ball',
            collisionFilter: {
                group: -1 // Don't collide with other balls if we add multi-ball later
            }
        });

        Matter.Composite.add(engine.world, ball);

        // "Smart Gravity" - Gently guide ball to the correct bucket
        const checkBall = () => {
            if (!ball || !engineRef.current) return;

            // Apply guidance only when ball is in the top 75% of the board
            // This lets it tumble naturally into the bucket at the end
            if (ball.position.y < height * 0.75) {
                const xDiff = targetX - ball.position.x;
                
                // Dynamic force: Stronger if far away, weaker if close
                // We use a very small number because physics updates run 60x/sec
                const forceX = xDiff * 0.000015; 
                
                Matter.Body.applyForce(ball, ball.position, { x: forceX, y: 0 });
            }

            // Cleanup when ball falls off screen
            if (ball.position.y > height + 50) {
                Matter.Events.off(engine, 'beforeUpdate', checkBall);
                // Optional: Leave ball for a moment or remove immediately
                Matter.Composite.remove(engine.world, ball);
                onComplete();
            }
        };

        Matter.Events.on(engine, 'beforeUpdate', checkBall);
    };

    const getBucketColor = (m) => {
        if (m >= 10) return "bg-[#ff003f] shadow-[0_4px_0_#990026] text-white"; 
        if (m >= 2) return "bg-[#ff9900] shadow-[0_4px_0_#995c00] text-gray-900";
        return "bg-[#ffcc00] shadow-[0_4px_0_#997a00] text-gray-900"; 
    };

    return (
        <div className="flex-1 p-6 flex flex-col items-center overflow-hidden bg-[#0f172a]">
            <div className="flex w-full max-w-6xl gap-6 h-full">
                
                {/* --- Sidebar Controls --- */}
                <div className="w-80 p-6 rounded-xl border border-gray-700 bg-gray-800/50 flex flex-col gap-6 h-fit backdrop-blur-sm shadow-xl">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-pink-500">⚡</span> Plinko
                    </h2>

                    {/* Bet Amount */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-300">Bet Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={e => setBetAmount(e.target.value)}
                                disabled={isProcessing}
                                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-900 text-white focus:ring-2 focus:ring-pink-500 outline-none font-mono"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">CGT</span>
                        </div>
                    </div>

                    {/* Row Selection */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-300">Risk / Rows</label>
                        <select
                            value={rows}
                            onChange={e => setRows(parseInt(e.target.value))}
                            disabled={isProcessing} // Lock during play to prevent crashes
                            className={clsx(
                                "w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-900 text-white focus:ring-2 focus:ring-pink-500 outline-none",
                                isProcessing && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <option value={8}>Low (8 Rows)</option>
                            <option value={12}>Medium (12 Rows)</option>
                            <option value={16}>High (16 Rows)</option>
                        </select>
                    </div>

                    {/* Play Button */}
                    <button
                        onClick={dropBall}
                        disabled={isProcessing || !account}
                        className={clsx(
                            "w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all text-lg uppercase tracking-wide",
                            isProcessing 
                                ? "bg-gray-600 cursor-not-allowed" 
                                : "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 hover:shadow-pink-500/25 active:scale-95"
                        )}
                    >
                        {isProcessing ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                Processing...
                            </div>
                        ) : 'Drop Ball'}
                    </button>

                    <div className="mt-2 text-xs text-gray-500 text-center">
                       Balance: <span className="text-gray-300 font-mono">{balance} CGT</span>
                    </div>
                </div>

                {/* --- Game Canvas --- */}
                <div className="flex-1 rounded-xl overflow-hidden relative border border-gray-800 bg-[#0b1121] flex flex-col items-center shadow-2xl">
                    {/* Physics Canvas */}
                    <div ref={sceneRef} className="absolute inset-0 flex justify-center" />
                    
                    {/* Multipliers Overlay - Perfectly aligned via inline width */}
                    <div 
                        className="absolute bottom-4 flex justify-between items-end"
                        style={{ 
                            width: `${totalBoardWidth}px`, // Exact match to physics world
                            height: '40px'
                        }} 
                    >
                        {multipliers.map((m, i) => (
                            <div key={i} className="flex-1 px-[1px] flex justify-center">
                                <div className={clsx(
                                    "w-full h-full rounded-sm flex items-center justify-center text-[10px] md:text-xs font-bold transition-all duration-300",
                                    getBucketColor(m),
                                    // Highlight logic (optional visual flair)
                                    lastMulti === m ? "scale-110 brightness-125 z-10" : ""
                                )}>
                                    {m}x
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}