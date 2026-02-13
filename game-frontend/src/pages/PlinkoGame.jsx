import { useEffect, useRef, useState, useMemo } from 'react';
import Matter from 'matter-js';
import clsx from 'clsx';

export default function PlinkoGame() {
    const sceneRef = useRef(null);
    const engineRef = useRef(null);
    
    // --- FIX 1: THE SAFETY FLAG ---
    // This Ref tracks if we already found a winner for the current drop.
    const isBallActive = useRef(false);

    const [rows, setRows] = useState(16); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [debugLog, setDebugLog] = useState("Ready...");
    const [actualResult, setActualResult] = useState(null);

    const width = 800;
    const height = 600;
    
    // Math for board sizing
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
        engine.gravity.y = 1.2; 

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

        // 1. Pegs
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

        // 2. SENSORS (Improved)
        const bucketY = height - 20;
        const totalBoardWidth = (rows + 1) * gap;
        const startX_Buckets = (width - totalBoardWidth) / 2 + (gap / 2);

        for (let i = 0; i <= rows; i++) {
            const x = startX_Buckets + (i * gap);
            // Smaller sensor width ensures it doesn't overlap with neighbors
            const sensor = Bodies.rectangle(x, bucketY, gap * 0.5, 20, {
                isStatic: true,
                isSensor: true, 
                label: `bucket-${i}`, 
                render: { fillStyle: 'transparent' } 
            });
            worldObjects.push(sensor);
        }

        // 3. Walls
        const wallLeft = Bodies.rectangle(0, height/2, 10, height, { isStatic: true, render: { visible: false } });
        const wallRight = Bodies.rectangle(width, height/2, 10, height, { isStatic: true, render: { visible: false } });
        worldObjects.push(wallLeft, wallRight);

        Composite.add(engine.world, worldObjects);

        // --- FIX 2: ROBUST COLLISION HANDLING ---
        Events.on(engine, 'collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                const bucketBody = bodyA.label.includes('bucket-') ? bodyA : bodyB.label.includes('bucket-') ? bodyB : null;
                const ballBody = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;

                // ONLY Trigger if:
                // 1. We hit a bucket AND a ball
                // 2. The ball is marked as "Active" (prevent double triggers)
                if (bucketBody && ballBody && isBallActive.current) {
                    
                    // IMMEDIATELY disable the flag so no other sensors can fire
                    isBallActive.current = false;

                    const index = parseInt(bucketBody.label.split('-')[1]);
                    
                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('plinko-win', { detail: { index } }));
                    
                    // Remove ball from world so it doesn't bounce to another bucket
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

    // Listen for Win
    useEffect(() => {
        const handleWin = (e) => {
            const index = e.detail.index;
            // Safety check: Ensure index is valid
            if (index >= 0 && index < multipliers.length) {
                const m = multipliers[index];
                setActualResult({ index, multiplier: m });
                setDebugLog(`Result: Bucket ${index} (${m}x)`);
                setIsProcessing(false);
            }
        };

        window.addEventListener('plinko-win', handleWin);
        return () => window.removeEventListener('plinko-win', handleWin);
    }, [multipliers]);

    const dropBall = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setActualResult(null);
        setDebugLog("Ball Dropped...");

        // Enable the sensor flag
        isBallActive.current = true;
        spawnBall();
    };

    const spawnBall = () => {
        const engine = engineRef.current;
        if (!engine) return;

        const startX = (width / 2) + (Math.random() - 0.5); 

        const ball = Matter.Bodies.circle(startX, 20, 8, { 
            restitution: 0.5, 
            friction: 0.5,    
            frictionAir: 0.04, 
            density: 5,      
            label: 'ball',
            render: { fillStyle: '#39ff14' }
        });
        Matter.Composite.add(engine.world, ball);
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
                
                <div className="w-80 p-6 rounded-2xl bg-gray-800 border border-gray-700 flex flex-col gap-6">
                    <h2 className="text-2xl font-bold">Physics Test</h2>
                    <div className="bg-black/30 p-4 rounded text-xs font-mono text-green-400 h-24 border border-green-900">
                         {debugLog}
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Rows</label>
                        <select 
                            value={rows} onChange={e => setRows(Number(e.target.value))}
                            className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-xl px-4 py-3"
                            disabled={isProcessing}
                        >
                            <option value={8}>8 Rows</option>
                            <option value={16}>16 Rows</option>
                        </select>
                    </div>
                    <button 
                        onClick={dropBall} disabled={isProcessing}
                        className={clsx(
                            "w-full py-4 rounded-xl font-bold text-lg mt-4",
                            isProcessing ? "bg-gray-600" : "bg-green-600 hover:bg-green-500"
                        )}
                    >
                        {isProcessing ? "..." : "DROP BALL"}
                    </button>
                </div>

                <div className="flex-1 bg-[#0b1121] rounded-2xl border border-gray-800 relative overflow-hidden flex flex-col items-center justify-center">
                    <div ref={sceneRef} className="absolute inset-0 z-0" />
                    
                    <div className="absolute bottom-10 flex justify-center gap-1 z-10" style={{ width: totalBoardWidth }}>
                        {multipliers.map((m, i) => (
                            <div key={i} className="flex-1 flex justify-center">
                                <div className={clsx(
                                    "flex items-center justify-center w-full h-8 text-[9px] font-bold rounded transition-all",
                                    getBucketColor(m),
                                    // Only highlight if it matches the single actual result
                                    (actualResult?.index === i) ? "scale-125 border-2 border-white brightness-150 shadow-[0_0_15px_white]" : "opacity-80"
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