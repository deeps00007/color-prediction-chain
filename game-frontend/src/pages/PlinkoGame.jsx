import { useEffect, useRef, useState, useMemo } from 'react';
import Matter from 'matter-js';
import clsx from 'clsx';
import { ethers } from 'ethers';
import { PLINKO_ADDRESS, PLINKO_ABI } from '../config';

export default function PlinkoGame({ showMessage, account, balance, setBalance, signer, tokenContract }) {
    const sceneRef = useRef(null);
    const engineRef = useRef(null);
    const isBallActive = useRef(false);

    const [betAmount, setBetAmount] = useState('10');
    const [rows, setRows] = useState(16);
    const [plinkoContract, setPlinkoContract] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastMulti, setLastMulti] = useState(null);
    const [houseBalance, setHouseBalance] = useState('0');
    const [debugLog, setDebugLog] = useState("Connect Wallet...");

    const width = 800;
    const height = 600;

    // 1. BOARD MATH
    const { gap } = useMemo(() => {
        const gap = width / (rows + 8);
        return { gap };
    }, [rows]);

    const getMultipliers = (r) => {
        if (r === 8) return [29, 15, 8, 2, 0.5, 2, 8, 15, 29];
        if (r === 12) return [110, 25, 10, 5, 2, 1, 0.5, 1, 2, 5, 10, 25, 110];
        return [1000, 100, 20, 10, 5, 2, 0.5, 0.2, 0.2, 0.2, 0.5, 2, 5, 10, 20, 100, 1000];
    };
    const multipliers = useMemo(() => getMultipliers(rows), [rows]);

    // 2. INIT CONTRACT
    useEffect(() => {
        if (signer) {
            try {
                const contract = new ethers.Contract(PLINKO_ADDRESS, PLINKO_ABI, signer);
                setPlinkoContract(contract);
                setDebugLog("Ready");
                if (tokenContract) {
                    tokenContract.balanceOf(PLINKO_ADDRESS).then(b => setHouseBalance(ethers.formatEther(b)));
                }
            } catch (e) { console.error(e); }
        }
    }, [signer, tokenContract]);

    // 3. INIT PHYSICS
    useEffect(() => {
        if (!sceneRef.current) return;
        sceneRef.current.innerHTML = '';

        const Engine = Matter.Engine,
            Render = Matter.Render,
            Runner = Matter.Runner,
            Bodies = Matter.Bodies,
            Composite = Matter.Composite,
            Events = Matter.Events;

        const engine = Engine.create();
        engine.gravity.y = 1.0; // Standard Gravity
        engine.gravity.x = 0;

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width, height,
                wireframes: false,
                background: '#0b1121',
                pixelRatio: window.devicePixelRatio || 1
            }
        });

        const worldObjects = [];

        // Pegs
        const pegStartY = 50;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= r; c++) {
                const x = width / 2 + (c * gap) - (r * gap / 2);
                const y = pegStartY + r * gap;
                const peg = Bodies.circle(x, y, 4, {
                    isStatic: true,
                    label: 'peg',
                    restitution: 0.5,
                    render: { fillStyle: '#d946ef' }
                });
                worldObjects.push(peg);
            }
        }

        // Walls
        const wallLeft = Bodies.rectangle(0, height / 2, 10, height, { isStatic: true, render: { visible: false } });
        const wallRight = Bodies.rectangle(width, height / 2, 10, height, { isStatic: true, render: { visible: false } });
        worldObjects.push(wallLeft, wallRight);

        // Sensors
        const bucketY = height - 20;
        const totalBoardWidth = (rows + 1) * gap;
        const startX_Buckets = (width - totalBoardWidth) / 2 + (gap / 2);

        for (let i = 0; i <= rows; i++) {
            const x = startX_Buckets + (i * gap);
            const sensor = Bodies.rectangle(x, bucketY, gap * 0.5, 20, {
                isStatic: true,
                isSensor: true,
                label: `bucket-${i}`,
                render: { fillStyle: 'transparent' }
            });
            worldObjects.push(sensor);
        }

        Composite.add(engine.world, worldObjects);

        // Collision Logic
        Events.on(engine, 'collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                const bucketBody = bodyA.label.includes('bucket-') ? bodyA : bodyB.label.includes('bucket-') ? bodyB : null;
                const ballBody = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;

                if (bucketBody && ballBody && isBallActive.current) {
                    isBallActive.current = false;
                    const index = parseInt(bucketBody.label.split('-')[1]);
                    window.dispatchEvent(new CustomEvent('plinko-finish', { detail: { index } }));
                    Composite.remove(engine.world, ballBody);
                }
            });
        });

        const runner = Runner.create();
        Runner.run(runner, engine);
        Render.run(render);

        engineRef.current = engine;

        return () => {
            Render.stop(render);
            Runner.stop(runner);
            Engine.clear(engine);
            render.canvas.remove();
        };
    }, [rows, gap]);

    // 4. HANDLE WIN
    useEffect(() => {
        const handleFinish = (e) => {
            const index = e.detail.index;
            setIsProcessing(false);
            if (index >= 0 && index < multipliers.length) {
                const m = multipliers[index];
                if (m >= 1) showMessage(`WON! ${m}x`, 'success');
                else showMessage(`Result: ${m}x`, 'info');
            }
        };
        window.addEventListener('plinko-finish', handleFinish);
        return () => window.removeEventListener('plinko-finish', handleFinish);
    }, [multipliers]);

    // 5. PLAY FUNCTION
    const dropBall = async () => {
        if (!account || !plinkoContract || isProcessing) return;

        try {
            setIsProcessing(true);
            setLastMulti(null);
            setDebugLog("Initializing...");

            const amountWei = ethers.parseEther(betAmount);

            // House Check
            if (parseFloat(houseBalance) < parseFloat(betAmount) * 2) {
                showMessage("House Funds Low", "error");
            }

            // Approve
            const allowance = await tokenContract.allowance(account, PLINKO_ADDRESS);
            if (allowance < amountWei) {
                setDebugLog("Approving...");
                const tx = await tokenContract.connect(signer).approve(PLINKO_ADDRESS, ethers.MaxUint256);
                await tx.wait();
            }

            // Play
            setDebugLog("Signing...");
            const tx = await plinkoContract.play(amountWei, rows, { gasLimit: 500000 });
            setDebugLog("Mining...");
            const receipt = await tx.wait();

            let gameResult = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = plinkoContract.interface.parseLog(log);
                    if (parsed && parsed.name === 'GameResult') gameResult = parsed.args;
                } catch (e) { }
            }

            if (gameResult) {
                tokenContract.balanceOf(account).then(b => setBalance(parseFloat(ethers.formatEther(b)).toFixed(2)));
                tokenContract.balanceOf(PLINKO_ADDRESS).then(b => setHouseBalance(ethers.formatEther(b)));

                const bucketIndex = Number(gameResult.bucketIndex);
                const multiplier = Number(gameResult.multiplier) / 10;
                setDebugLog(`Result: ${multiplier}x`);
                setLastMulti(multiplier);

                // Start Ball
                isBallActive.current = true;
                spawnControlledBall(bucketIndex);
            }

        } catch (error) {
            console.error(error);
            setDebugLog("Failed");
            showMessage("Transaction Failed", "error");
            setIsProcessing(false);
        }
    };

    // 6. CONTROLLED BALL (THE FIX)
    const spawnControlledBall = (targetBucketIndex) => {
        const engine = engineRef.current;
        if (!engine) return;

        const startX = width / 2;

        const ball = Matter.Bodies.circle(startX, 20, 7, {
            restitution: 0.5,
            friction: 0.6,    // High friction to grip pegs
            frictionAir: 0.04,// Drag to stop acceleration
            density: 1,
            label: 'ball',
            render: { fillStyle: '#39ff14' },
            collisionFilter: { group: -1 }
        });
        Matter.Composite.add(engine.world, ball);

        // Calculate Moves
        const moves = [];
        for (let i = 0; i < rows; i++) {
            if (i < targetBucketIndex) moves.push(1);
            else moves.push(-1);
        }
        moves.sort(() => Math.random() - 0.5);

        const pegStartY = 50;

        const updateBall = () => {
            if (!ball) return;
            const currentRow = Math.floor((ball.position.y - pegStartY) / gap);

            if (currentRow >= 0 && currentRow < moves.length) {
                const direction = moves[currentRow];

                // --- THE CRITICAL FIX: VELOCITY CLAMP ---
                // Instead of applyForce (which accelerates infinitely), 
                // we check speed and gently correct it.

                const currentVel = ball.velocity.x;
                const desiredVel = direction * 1.5; // Target horizontal speed

                // If moving wrong way OR moving too slow, push it
                if ((direction === 1 && currentVel < 1.5) || (direction === -1 && currentVel > -1.5)) {
                    // Gentle push
                    Matter.Body.applyForce(ball, ball.position, { x: direction * 0.0005, y: 0 });
                }

                // If moving TOO FAST, slow it down (Brakes)
                if (Math.abs(currentVel) > 2.5) {
                    Matter.Body.setVelocity(ball, {
                        x: currentVel * 0.9, // Reduce speed by 10%
                        y: ball.velocity.y
                    });
                }
            }

            if (ball.position.y > height + 100) {
                Matter.Events.off(engine, 'beforeUpdate', updateBall);
                Matter.Composite.remove(engine.world, ball);
                setIsProcessing(false);
            }
        };

        Matter.Events.on(engine, 'beforeUpdate', updateBall);
    };

    const getBucketColor = (m) => {
        if (m >= 10) return "bg-rose-600 shadow-rose-900";
        if (m >= 2) return "bg-orange-500 shadow-orange-800";
        return "bg-yellow-500 shadow-yellow-800";
    };

    const totalBoardWidth = (rows + 1) * gap;

    return (
        <div className="flex-1 p-6 flex flex-col items-center bg-[#0f172a] text-white select-none">
            <div className="flex w-full max-w-6xl gap-6 h-[700px]">

                <div className="w-80 p-6 rounded-2xl bg-gray-800 border border-gray-700 flex flex-col gap-6 shadow-xl">
                    <h2 className="text-2xl font-bold text-pink-500">⚡ Plinko</h2>
                    <div className="bg-black/30 p-3 rounded text-xs font-mono text-green-400 h-16 flex items-center">
                        {debugLog}
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 font-bold ml-1">Bet</label>
                        <input
                            type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)}
                            className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 font-mono outline-none"
                            disabled={isProcessing}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 font-bold ml-1">Rows</label>
                        <select
                            value={rows} onChange={e => setRows(Number(e.target.value))}
                            className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 outline-none"
                            disabled={isProcessing}
                        />
                    </div>

                    <button
                        onClick={dropBall} disabled={isProcessing || !account}
                        className={clsx(
                            "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all mt-4",
                            isProcessing ? "bg-gray-600 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-500"
                        )}
                    >
                        {isProcessing ? "Playing..." : "DROP BALL"}
                    </button>

                    <div className="mt-auto text-xs flex justify-between text-gray-400">
                        <span>Bal: {balance}</span>
                        <span>House: {parseFloat(houseBalance).toFixed(0)}</span>
                    </div>
                </div>

                <div className="flex-1 bg-[#0b1121] rounded-2xl border border-gray-800 relative overflow-hidden flex flex-col items-center justify-center">
                    <div ref={sceneRef} className="absolute inset-0 z-0" />

                    <div className="absolute bottom-10 flex justify-center gap-1 z-10" style={{ width: totalBoardWidth }}>
                        {multipliers.map((m, i) => (
                            <div key={i} className="flex-1 flex justify-center">
                                <div className={clsx(
                                    "flex items-center justify-center w-full h-8 text-[9px] font-bold rounded transition-all",
                                    getBucketColor(m),
                                    lastMulti === m ? "scale-125 border-2 border-white brightness-150" : "opacity-80"
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