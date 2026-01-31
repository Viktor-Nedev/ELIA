"use client";

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard } from '@react-three/drei';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Recycle, Trash2, Leaf, Battery, TreePine, XCircle, CheckCircle, Clock, Trophy, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';


interface CarbonSortGameProps {
  onScoreUpdate?: (score: number) => void;
}


type WasteType = 'plastic' | 'paper' | 'glass' | 'organic' | 'metal' | 'electronics';
type BinType = 'recycling' | 'compost' | 'landfill' | 'hazardous';

interface WasteItem {
  id: number;
  type: WasteType;
  name: string;
  model: 'box' | 'sphere' | 'cylinder' | 'cone';
  color: string;
  position: [number, number, number];
  velocity: [number, number, number];
  inBin?: boolean;
  placedIn?: BinType;
  isCorrect?: boolean;
}

interface Bin {
  type: BinType;
  position: [number, number, number];
  color: string;
  acceptedTypes: WasteType[];
  label: string;
  description: string;
}


const WASTE_ITEMS_CONFIG = [
  { type: 'plastic' as const, name: 'Plastic Bottle', model: 'cylinder' as const, color: '#3b82f6' },
  { type: 'paper' as const, name: 'Newspaper', model: 'box' as const, color: '#f59e0b' },
  { type: 'glass' as const, name: 'Glass Jar', model: 'cylinder' as const, color: '#10b981' },
  { type: 'organic' as const, name: 'Apple Core', model: 'sphere' as const, color: '#ef4444' },
  { type: 'metal' as const, name: 'Soda Can', model: 'cylinder' as const, color: '#94a3b8' },
  { type: 'electronics' as const, name: 'Battery', model: 'box' as const, color: '#8b5cf6' },
  { type: 'plastic' as const, name: 'Plastic Bag', model: 'box' as const, color: '#3b82f6' },
  { type: 'paper' as const, name: 'Cardboard Box', model: 'box' as const, color: '#f59e0b' },
  { type: 'glass' as const, name: 'Wine Bottle', model: 'cylinder' as const, color: '#10b981' },
  { type: 'organic' as const, name: 'Banana Peel', model: 'sphere' as const, color: '#ef4444' },
  { type: 'metal' as const, name: 'Food Can', model: 'cylinder' as const, color: '#94a3b8' },
  { type: 'electronics' as const, name: 'Phone Charger', model: 'box' as const, color: '#8b5cf6' },
];


const getRandomPosition = () => {
  const x = Math.random() * 14 - 7;
  const z = Math.random() * 14 - 7;
  const y = 2 + Math.random() * 3;
  return [x, y, z] as [number, number, number];
};


const WasteObject = ({ 
  item, 
  onClick 
}: { 
  item: WasteItem; 
  onClick: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && !item.inBin) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
      
      
      meshRef.current.position.y = item.position[1] + Math.sin(state.clock.elapsedTime + item.id) * 0.3;
    }
  });

  const getGeometry = () => {
    switch (item.model) {
      case 'sphere': return <sphereGeometry args={[0.6, 32, 32]} />;
      case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1.2, 32]} />;
      case 'cone': return <coneGeometry args={[0.6, 1.2, 32]} />;
      default: return <boxGeometry args={[1.2, 1.2, 1.2]} />;
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={item.position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
    >
      {getGeometry()}
      <meshStandardMaterial 
        color={hovered ? '#4ade80' : item.color} 
        metalness={0.5}
        roughness={0.5}
        emissive={item.inBin ? (item.isCorrect ? '#10b981' : '#ef4444') : '#000000'}
        emissiveIntensity={item.inBin ? 0.3 : 0}
      />
      {hovered && !item.inBin && (
        <Billboard position={[0, 2, 0]}>
          <Text fontSize={0.4} color="white">
            {item.name}
          </Text>
        </Billboard>
      )}
      {item.inBin && (
        <Billboard position={[0, 2, 0]}>
          <Text fontSize={0.3} color={item.isCorrect ? '#10b981' : '#ef4444'}>
            {item.isCorrect ? '✓' : '✗'}
          </Text>
        </Billboard>
      )}
    </mesh>
  );
};


const BinObject = ({ 
  bin, 
  onDrop 
}: { 
  bin: Bin; 
  onDrop: (binType: BinType) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <group position={bin.position}>
  
      <mesh 
        ref={meshRef}
        position={[0, 1, 0]}
        onClick={() => onDrop(bin.type)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        receiveShadow
      >
        <cylinderGeometry args={[1.8, 1.5, 3.5, 32]} />
        <meshStandardMaterial 
          color={hovered ? '#22c55e' : bin.color} 
          transparent
          opacity={0.8}
        />
      </mesh>
      
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[2, 1.8, 0.2, 32]} />
        <meshStandardMaterial color={bin.color} />
      </mesh>
      
      
      <Billboard position={[0, 3.5, 0]}>
        <Text fontSize={0.5} color="white">
          {bin.label}
        </Text>
      </Billboard>

 
      <Billboard position={[0, 4, 0]}>
        <Text fontSize={0.25} color="#94a3b8">
          {bin.description}
        </Text>
      </Billboard>
    </group>
  );
};


const CarbonSortGameScene = ({ 
  onScoreUpdate,
  onGameComplete 
}: { 
  onScoreUpdate?: (score: number) => void;
  onGameComplete: (totalScore: number) => void;
}) => {
  const router = useRouter();
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WasteItem | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(true);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [lastMessage, setLastMessage] = useState<{text: string, isCorrect: boolean} | null>(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalIncorrect, setTotalIncorrect] = useState(0);
  const [itemsGenerated, setItemsGenerated] = useState(0);

  const bins: Bin[] = [
    { 
      type: 'recycling', 
      position: [-6, 0, -6], 
      color: '#3b82f6', 
      acceptedTypes: ['plastic', 'paper', 'glass', 'metal'],
      label: 'RECYCLE',
      description: 'Plastic, Paper, Glass, Metal'
    },
    { 
      type: 'compost', 
      position: [0, 0, -6], 
      color: '#10b981', 
      acceptedTypes: ['organic'],
      label: 'COMPOST',
      description: 'Food Waste'
    },
    { 
      type: 'hazardous', 
      position: [6, 0, -6], 
      color: '#ef4444', 
      acceptedTypes: ['electronics'],
      label: 'HAZARDOUS',
      description: 'Batteries, Electronics'
    },
    { 
      type: 'landfill', 
      position: [0, 0, 6], 
      color: '#64748b', 
      acceptedTypes: [],
      label: 'LANDFILL',
      description: 'Non-recyclable'
    },
  ];


  useEffect(() => {
    generateNewWasteItems(8); 
  }, []);

  
  const generateNewWasteItems = useCallback((count: number) => {
    const newItems: WasteItem[] = [];
    for (let i = 0; i < count; i++) {
      const config = WASTE_ITEMS_CONFIG[Math.floor(Math.random() * WASTE_ITEMS_CONFIG.length)];
      newItems.push({
        id: itemsGenerated + i + 1,
        type: config.type,
        name: config.name,
        model: config.model,
        color: config.color,
        position: getRandomPosition(),
        velocity: [0, 0, 0]
      });
    }
    setItemsGenerated(prev => prev + count);
    setWasteItems(prev => [...prev, ...newItems]);
  }, [itemsGenerated]);

  
  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameActive(false);
      setGameCompleted(true);
      onGameComplete(score);
    }
  }, [gameActive, timeLeft]);

  
  useEffect(() => {
    if (!gameActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      const itemsInPlay = wasteItems.filter(item => !item.inBin).length;
      if (itemsInPlay < 10) { 
        generateNewWasteItems(2);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [gameActive, timeLeft, wasteItems, generateNewWasteItems]);

  const handleItemClick = (item: WasteItem) => {
    if (!gameActive || item.inBin) return;
    setSelectedItem(item);
  };

  const handleBinDrop = (binType: BinType) => {
    if (!selectedItem || !gameActive) return;

    const bin = bins.find(b => b.type === binType);
    if (!bin) return;

    const isCorrect = bin.acceptedTypes.includes(selectedItem.type);
    const points = isCorrect ? 100 : 0;


    const updatedItem: WasteItem = {
      ...selectedItem,
      inBin: true,
      placedIn: binType,
      isCorrect,
      position: [
        bin.position[0],
        1,
        bin.position[2]
      ]
    };

    setWasteItems(prev => prev.map(item => 
      item.id === selectedItem.id ? updatedItem : item
    ));

    
    const newScore = score + points;
    setScore(newScore);
    
    if (isCorrect) {
      setTotalCorrect(prev => prev + 1);
      setLastMessage({ text: `Correct! +100 points`, isCorrect: true });
    } else {
      setTotalIncorrect(prev => prev + 1);
      setLastMessage({ text: `Wrong! ${selectedItem.name} doesn't go in ${bin.label}`, isCorrect: false });
    }


    setTimeout(() => setLastMessage(null), 2000);

    
    if (onScoreUpdate) {
      onScoreUpdate(newScore);
    }

    
    setTimeout(() => {
      generateNewWasteItems(1);
    }, 500);

    setSelectedItem(null);
  };

  const handleRestart = () => {
    setWasteItems([]);
    setScore(0);
    setTimeLeft(60);
    setGameActive(true);
    setGameCompleted(false);
    setTotalCorrect(0);
    setTotalIncorrect(0);
    setItemsGenerated(0);
    setLastMessage(null);
    setSelectedItem(null);
    generateNewWasteItems(8);
  };

  const handleBackToStudy = () => {
    router.push('/study');
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-zinc-900 to-black overflow-hidden">

      <div className="absolute inset-0">
        <Canvas shadows camera={{ position: [0, 12, 18], fov: 65 }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[15, 20, 15]} intensity={1.5} castShadow />
          <pointLight position={[-15, 20, -15]} intensity={1} color="#3b82f6" />
          <pointLight position={[0, 25, 0]} intensity={0.8} color="#ffffff" />
          

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
            <planeGeometry args={[40, 40]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>


          {bins.map(bin => (
            <BinObject key={bin.type} bin={bin} onDrop={handleBinDrop} />
          ))}


          {wasteItems.map(item => (
            <WasteObject key={item.id} item={item} onClick={() => handleItemClick(item)} />
          ))}


          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minDistance={5}
            maxDistance={35}
          />

        
          {selectedItem && (
            <Billboard position={[0, 15, 0]}>
              <Text fontSize={0.7} color="white">
                Selected: {selectedItem.name}
              </Text>
              <Text fontSize={0.5} color="yellow">
                Click on a bin to sort!
              </Text>
            </Billboard>
          )}
        </Canvas>
      </div>


      <div className="absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-black/90 to-transparent z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                  <Recycle className="w-7 h-7 text-emerald-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Carbon Sort Challenge</h1>
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Sort Fast • Earn Points • Save the Planet</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="bg-black/80 backdrop-blur-sm border border-emerald-500/30 px-6 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Clock className={`w-6 h-6 ${timeLeft < 10 ? 'text-red-400' : 'text-emerald-400'}`} />
                    <div>
                      <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">Time</p>
                      <p className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {timeLeft}s
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/80 backdrop-blur-sm border border-emerald-500/30 px-6 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">Score</p>
                      <p className="text-2xl font-black text-white">{score}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/80 backdrop-blur-sm border border-emerald-500/30 px-6 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">Correct</p>
                      <p className="text-2xl font-black text-white">{totalCorrect}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <div className="flex flex-col gap-3">
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl text-sm font-black uppercase hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw className="w-4 h-4" /> Restart Game
              </button>
              
              <button
                onClick={handleBackToStudy}
                className="px-6 py-3 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-300 rounded-xl text-sm font-black uppercase transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Study
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-8 z-10">
        <div className="bg-black/80 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-black text-white">How to Play</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-emerald-400 font-bold text-sm">1</span>
              </div>
              <p className="text-zinc-300 text-base">Click on a waste item to select it</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-emerald-400 font-bold text-sm">2</span>
              </div>
              <p className="text-zinc-300 text-base">Click on the correct recycling bin</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-emerald-400 font-bold text-sm">3</span>
              </div>
              <p className="text-zinc-300 text-base">New items appear constantly - keep sorting!</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-emerald-400 font-bold text-sm">4</span>
              </div>
              <p className="text-zinc-300 text-base">Only correct sorts earn points (+100 each)</p>
            </div>
          </div>
        </div>
      </div>


      <div className="absolute bottom-8 right-8 z-10">
        <div className="bg-black/80 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6">
          <h3 className="text-xl font-black text-white mb-4">Bin Legend</h3>
          <div className="grid grid-cols-2 gap-4">
            {bins.map(bin => (
              <div key={bin.type} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: bin.color }} />
                <div>
                  <p className="text-white font-bold">{bin.label}</p>
                  <p className="text-xs text-zinc-400">{bin.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {lastMessage && (
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 p-8 rounded-2xl backdrop-blur-sm border-2 ${
          lastMessage.isCorrect 
            ? 'bg-emerald-500/30 border-emerald-500/50 shadow-2xl shadow-emerald-500/30' 
            : 'bg-red-500/30 border-red-500/50 shadow-2xl shadow-red-500/30'
        }`}>
          <div className="flex items-center gap-4">
            {lastMessage.isCorrect ? (
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            ) : (
              <XCircle className="w-10 h-10 text-red-400" />
            )}
            <p className={`text-2xl font-black ${lastMessage.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
              {lastMessage.text}
            </p>
          </div>
        </div>
      )}


      {gameCompleted && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-black border-2 border-emerald-500/30 rounded-[2.5rem] p-10 max-w-2xl w-full text-center shadow-2xl shadow-emerald-500/20">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-8">
              <Trophy className="w-24 h-24 text-yellow-400" />
            </div>
            
            <h2 className="text-5xl font-black text-white mb-6">Game Over!</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-zinc-900/50 rounded-2xl">
                <p className="text-sm text-zinc-400 uppercase tracking-widest mb-2">Final Score</p>
                <p className="text-4xl font-black text-emerald-400">{score} Points</p>
              </div>
              
              <div className="p-6 bg-zinc-900/50 rounded-2xl">
                <p className="text-sm text-zinc-400 uppercase tracking-widest mb-2">Correct Sorts</p>
                <p className="text-4xl font-black text-white">{totalCorrect}</p>
              </div>
            </div>
            
            <div className="mb-10">
              <p className="text-lg text-zinc-400 mb-2">
                Accuracy: <span className="text-white font-bold">
                  {totalCorrect + totalIncorrect > 0 
                    ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) 
                    : 0}%
                </span>
              </p>
              <p className="text-sm text-zinc-500">
                You sorted {totalCorrect} items correctly in 60 seconds!
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRestart}
                className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform text-lg flex items-center justify-center gap-3"
              >
                <RefreshCw className="w-5 h-5" /> Play Again
              </button>
              
              <button
                onClick={handleBackToStudy}
                className="px-10 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-2xl font-black uppercase tracking-widest transition-colors text-lg flex items-center justify-center gap-3"
              >
                <ArrowLeft className="w-5 h-5" /> Back to Study Hub
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <p className="text-sm text-zinc-500">
                Want to improve your score? Pay attention to the bin descriptions!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default function CarbonSortGame({ onScoreUpdate }: CarbonSortGameProps) {
  const [gameStarted, setGameStarted] = useState(true); 
  const [gameScore, setGameScore] = useState(0);

  const handleScoreUpdate = (score: number) => {
    setGameScore(score);
    
   
    if (onScoreUpdate) {
      onScoreUpdate(score);
    }
  };

  const handleGameComplete = (finalScore: number) => {
    setGameScore(finalScore);
    
   
    if (onScoreUpdate) {
      onScoreUpdate(finalScore);
    }
  };

  
  return (
    <div className="relative min-h-screen">
      <CarbonSortGameScene 
        onScoreUpdate={handleScoreUpdate}
        onGameComplete={handleGameComplete}
      />
    </div>
  );
}