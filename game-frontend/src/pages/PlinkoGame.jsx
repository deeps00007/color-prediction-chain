import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import clsx from 'clsx';
import { ethers } from 'ethers';
import { PLINKO_ADDRESS, PLINKO_ABI } from '../config';

export default function PlinkoGame({ isDarkMode, showMessage, account, balance, setBalance, signer, tokenContract }) {
    // Refs
    const sceneRef = useRef(null);
    const engineRef = useRef(null);
    const renderRef = useRef(null);

    // State
    const [betAmount, setBetAmount] = useState('10');
    const [rows, setRows] = useState(16);
    const [plinkoContract, setPlinkoContract] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Plinko Config
    const width = 800;
    const height = 600;
    const margin = 50;
    const padding = width / (rows + 4) / 2;

    const getMultipliers = (rowCount) => {
        const count = rowCount + 1;
        const mid = Math.floor(count / 2);
        return Array.from({ length: count }, (_, i) => {
            const dist = Math.abs(i - mid);
            const val = 0.2 + (Math.pow(dist, 2.5) / 10);
            return parseFloat(val.toFixed(1));
        });
    };

    const [multipliers, setMultipliers] = useState(getMultipliers(rows));

    // Initialize Contract
    useEffect(() => {
        console.log("PlinkoGame: Signer changed:", signer);
        if (signer) {
            try {
                const contract = new ethers.Contract(PLINKO_ADDRESS, PLINKO_ABI, signer);
                console.log("PlinkoGame: Contract initialized:", contract);
                setPlinkoContract(contract);
            } catch (e) {
                console.error("PlinkoGame: Failed to init contract", e);
            }
        } else {
            console.log("PlinkoGame: No signer available");
        }
    }, [signer]);

    // Update multipliers on row change
    useEffect(() => {
        setMultipliers(getMultipliers(rows));
    }, [rows]);

    // Matter.js Engine
    useEffect(() => {
        if (!sceneRef.current) return;

        const MatterModule = Matter.default || Matter;
        const Engine = MatterModule.Engine,
            Render = MatterModule.Render,
            Runner = MatterModule.Runner,
            Bodies = MatterModule.Bodies,
            Composite = MatterModule.Composite,
            Events = MatterModule.Events;

        const engine = Engine.create();
        engine.gravity.y = 1.2;

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: width,
                height: height,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio
            }
        });

        const runner = Runner.create();

        // Walls
        const wallLeft = Bodies.rectangle(0, height / 2, 10, height, { isStatic: true, render: { visible: false } });
        const wallRight = Bodies.rectangle(width, height / 2, 10, height, { isStatic: true, render: { visible: false } });

        // Buckets (Physical Partitions)
        const bucketWalls = [];
        const bucketFloors = [];
        const gap = width / (rows + 5);
        const totalWidth = (rows + 1) * gap;
        const startX = (width - totalWidth) / 2;
        const bucketHeight = 60; // Height of the bucket walls

        for (let i = 0; i <= rows + 1; i++) {
            // Divider Wall
            const x = startX + (i * gap);
            const y = height - bucketHeight / 2;
            const wall = Bodies.rectangle(x, y, 5, bucketHeight, {
                isStatic: true,
                render: { fillStyle: '#334155' }, // Slate-700
                label: 'bucket-wall'
            });
            bucketWalls.push(wall);

            // Floor segment (between walls)
            if (i <= rows) {
                const floorX = startX + (i * gap) + (gap / 2);
                const floorY = height + 10;
                const floor = Bodies.rectangle(floorX, floorY, gap, 20, {
                    isStatic: true,
                    render: { visible: false },
                    label: 'ground'
                });
                bucketFloors.push(floor);
            }
        }

        // Pegs
        const pegs = [];
        const pegStartY = 80;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= r + 2; c++) {
                const x = (width / 2) - ((r + 2) * gap / 2) + (c * gap);
                const y = pegStartY + r * gap;
                const peg = Bodies.circle(x, y, 4, {
                    isStatic: true,
                    render: { fillStyle: '#d946ef' }, // Fuchsia-500
                    label: 'peg',
                    restitution: 0.5
                });
                pegs.push(peg);
            }
        }

        Composite.add(engine.world, [wallLeft, wallRight, ...bucketWalls, ...bucketFloors, ...pegs]);

        // Removed auto-cleanup so ball stays in bucket

        Runner.run(runner, engine);
        Render.run(render);

        engineRef.current = engine;
        renderRef.current = render;

        return () => {
            Render.stop(render);
            Runner.stop(runner);
            Composite.clear(engine.world);
            Engine.clear(engine);
            render.canvas.remove();
            engineRef.current = null;
        };
    }, [rows, isDarkMode]);

    // Blockchain Play Logic
    const dropBall = async () => {
        console.log("dropBall: Called. Account:", account, "Contract:", plinkoContract);

        if (!account) return showMessage("Connect wallet to play!", "error");
        if (!plinkoContract) {
            console.error("Plinko Contract not initialized yet.");
            return showMessage("Game not ready. Reconnect wallet?", "error");
        }
        if (isProcessing) return;

        try {
            setIsProcessing(true);
            const amountWei = ethers.parseEther(betAmount);

            // 1. Approve Token
            showMessage("Checking allowance...", "info");

            if (tokenContract) {
                const allowance = await tokenContract.allowance(account, PLINKO_ADDRESS);
                console.log("Current Allowance:", ethers.formatEther(allowance));

                if (allowance < amountWei) {
                    showMessage("Approving tokens... Please confirm in wallet.", "info");

                    if (!signer) return showMessage("No signer available", "error");
                    const tokenWithSigner = tokenContract.connect(signer);
                    const tx = await tokenWithSigner.approve(PLINKO_ADDRESS, ethers.MaxUint256);
                    await tx.wait();
                    showMessage("Approval confirmed!", "success");
                }
            }

            // 2. Play on Chain
            showMessage("Confirming transaction...", "info");
            // Manual gas limit to prevent estimation errors with pseudo-randomness
            const tx = await plinkoContract.play(amountWei, { gasLimit: 500000 });
            showMessage("Processing game on-chain...", "info");

            const receipt = await tx.wait();
            console.log("Transaction Receipt:", receipt);

            // 3. Update Balance
            if (tokenContract) {
                const newBal = await tokenContract.balanceOf(account);
                setBalance(parseFloat(ethers.formatEther(newBal)).toFixed(2));
            }

            // 4. Parse Event
            let gameResult = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = plinkoContract.interface.parseLog(log);
                    if (parsed && parsed.name === 'GameResult') {
                        gameResult = parsed.args;
                        break;
                    }
                } catch (e) { }
            }

            if (gameResult) {
                const multiplier = Number(gameResult.multiplier) / 10;
                const payout = ethers.formatEther(gameResult.payout);

                const bucketIndex = Number(gameResult.bucketIndex);

                // Visual Drop
                spawnVisualBall(bucketIndex);

                showMessage(`Result: ${multiplier}x! Payout: ${payout} CGT`, multiplier >= 1 ? 'success' : 'error');
            }

        } catch (error) {
            console.error("Plinko Transaction Error:", error);
            // Extract meaningful error message
            let msg = "Transaction failed";
            if (error.reason) msg += ": " + error.reason;
            else if (error.message) msg += ": " + error.message.slice(0, 50) + "...";

            showMessage(msg, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const getBucketColor = (multiplier) => {
        if (multiplier >= 10) return "bg-[#ff003f] shadow-[0_4px_0_#990026]"; // Red
        if (multiplier >= 5) return "bg-[#ff4d00] shadow-[0_4px_0_#992e00]"; // Orange-Red
        if (multiplier >= 2) return "bg-[#ff9900] shadow-[0_4px_0_#995c00]"; // Orange
        return "bg-[#ffcc00] shadow-[0_4px_0_#997a00]"; // Yellow (Low multiplier)
    };

    const spawnVisualBall = (bucketIndex) => {
        const engine = engineRef.current;
        if (!engine) return;

        const MatterModule = Matter.default || Matter;
        const Bodies = MatterModule.Bodies;
        const Composite = MatterModule.Composite;
        const Body = MatterModule.Body;

        // Calculate target X based on bucketIndex
        // 16 rows = 17 buckets (0..16)
        // Map bucketIndex to x-coordinate
        // Approx gap width calculated previously
        const gap = width / (rows + 5);
        const totalWidth = (rows + 1) * gap;
        const startX = (width - totalWidth) / 2 + (gap / 2); // Center of first bucket
        const targetX = startX + (bucketIndex * gap);

        // Heuristic: Spawn ball slightly offset towards target to bias fall
        // This is not perfect physics but helps visual correlation
        // Center is width/2. 
        // If target is Left (index < 8), offset Left.

        const centerIndex = rows / 2;
        const offset = (bucketIndex - centerIndex) * 2; // Pixel offset per index deviation
        const startPos = width / 2 + offset;

        const ball = Bodies.circle(startPos, 20, 6, {
            restitution: 0.5,
            friction: 0.005,
            render: { fillStyle: '#39ff14' },
            label: `ball-${Date.now()}`,
            collisionFilter: { group: -1 },
            plugin: { targetX: targetX }
        });

        // Add initial force towards target if it's an edge case?
        // Matter.js is chaotic. A small x-velocity helps.
        const forceX = (bucketIndex - centerIndex) * 0.0005;
        Body.applyForce(ball, ball.position, { x: forceX, y: 0 });

        Composite.add(engine.world, ball);
    };

    // Physics Loop for Guidance
    useEffect(() => {
        if (!engineRef.current) return;

        const MatterModule = Matter.default || Matter;
        const Events = MatterModule.Events;
        const Body = MatterModule.Body;

        const onBeforeUpdate = () => {
            const engine = engineRef.current;
            if (!engine) return;

            engine.world.bodies.forEach(body => {
                if (body.label.startsWith('ball-') && body.plugin && body.plugin.targetX !== undefined) {
                    const targetX = body.plugin.targetX;
                    const currentX = body.position.x;
                    const currentY = body.position.y;

                    if (currentY > height + 50) return;

                    const dx = targetX - currentX;
                    const forceX = dx * 0.00005; // Gentle guidance

                    Body.applyForce(body, body.position, { x: forceX, y: 0 });
                }
            });
        };

        Events.on(engineRef.current, 'beforeUpdate', onBeforeUpdate);

        return () => {
            if (engineRef.current) {
                Events.off(engineRef.current, 'beforeUpdate', onBeforeUpdate);
            }
        };
    }, [engineRef.current]);

    return (
        <div className={clsx("flex-1 p-6 flex flex-col items-center overflow-hidden bg-[#0f172a]")}>
            <div className="flex w-full max-w-6xl gap-6 h-full">

                {/* Sidebar Controls */}
                <div className="w-80 p-6 rounded-xl border border-gray-700 bg-gray-800/50 flex flex-col gap-6 h-fit backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-white">Plinko</h2>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-300">Bet Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={e => setBetAmount(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-900 text-white focus:ring-2 focus:ring-pink-500 outline-none font-mono"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">CGT</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-300">Risk / Rows</label>
                        <select
                            value={rows}
                            onChange={e => setRows(parseInt(e.target.value))}
                            className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-900 text-white focus:ring-2 focus:ring-pink-500 outline-none"
                        >
                            <option value={8}>Low (8 Rows)</option>
                            <option value={12}>Medium (12 Rows)</option>
                            <option value={16}>High (16 Rows)</option>
                        </select>
                    </div>

                    <button
                        onClick={dropBall}
                        disabled={isProcessing || !account}
                        className={clsx(
                            "w-full py-4 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all text-lg uppercase tracking-wide",
                            isProcessing ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-pink-900/20"
                        )}
                    >
                        {isProcessing ? 'Processing...' : 'Drop Ball'}
                    </button>

                    <div className="mt-4 text-xs text-gray-500 text-center">
                        Pro Tip: Higher risk = Higher multiplier!
                    </div>
                </div>

                {/* Game Canvas */}
                <div className="flex-1 rounded-xl overflow-hidden relative border border-gray-800 bg-[#0b1121] flex flex-col items-center shadow-2xl">
                    <div ref={sceneRef} className="absolute inset-0 flex justify-center" />

                    {/* Multiplier Overlay */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1 px-4 items-end h-16">
                        {multipliers.map((m, i) => {
                            return (
                                <div key={i} className={clsx(
                                    "flex-1 rounded-md flex items-center justify-center text-[10px] md:text-xs font-bold text-gray-900 transition-transform hover:-translate-y-1 duration-200 select-none",
                                    "h-8 md:h-10", // Height
                                    getBucketColor(m)
                                )}>
                                    {m}x
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
