"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, useGLTF } from '@react-three/drei';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import * as THREE from 'three';
import { Recycle, XCircle, CheckCircle, Clock, Trophy, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
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
  modelName: string;
  position: [number, number, number];
  inBin?: boolean;
  placedIn?: BinType;
  isCorrect?: boolean;
  rotation: number;
  useAlternate?: boolean;
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
  { 
    type: 'plastic' as const, 
    name: 'Plastic Bottle', 
    modelNames: ['plastic_water_bottle.glb']
  },
  { 
    type: 'paper' as const, 
    name: 'Newspaper', 
    modelNames: ['folded_newspaper.glb']
  },
  { 
    type: 'paper' as const, 
    name: 'Paper', 
    modelNames: ['paper_low.glb']
  },
  { 
    type: 'glass' as const, 
    name: 'Glass Jar', 
    modelNames: ['jar.glb']
  },
  { 
    type: 'metal' as const, 
    name: 'Coca Cola Can', 
    modelNames: ['coca_cola_soda_can.glb']
  },
  { 
    type: 'metal' as const, 
    name: 'Soda Can', 
    modelNames: ['soda_can.glb']
  },
  { 
    type: 'organic' as const, 
    name: 'Apple', 
    modelNames: ['apple.glb']
  },
  { 
    type: 'electronics' as const, 
    name: 'Battery', 
    modelNames: ['battery_-_batarya.glb']
  },
];

const MODELS_BASE_PATH = '/models/';

const Model = ({ 
  modelName, 
  position, 
  rotation = 0,
  onClick,
  isSelected = false,
  inBin = false,
  isCorrect = false
}: { 
  modelName: string;
  position: [number, number, number];
  rotation?: number;
  onClick?: () => void;
  isSelected?: boolean;
  inBin?: boolean;
  isCorrect?: boolean;
}) => {
  const { scene } = useGLTF(`${MODELS_BASE_PATH}${modelName}`);
  const meshRef = useRef<THREE.Group>(null);
  const boxRef = useRef<THREE.Box3>(new THREE.Box3());
  const centerRef = useRef<THREE.Vector3>(new THREE.Vector3());

  useFrame((state) => {
    if (meshRef.current && !inBin) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  useEffect(() => {
    if (scene && meshRef.current) {
      boxRef.current.setFromObject(scene);
      const size = new THREE.Vector3();
      boxRef.current.getSize(size);
      
      const maxSize = Math.max(size.x, size.y, size.z);
      const targetSize = 0.8;
      const scale = targetSize / maxSize;
      
      meshRef.current.scale.setScalar(scale * 0.6);
      
      boxRef.current.setFromObject(scene);
      boxRef.current.getCenter(centerRef.current);
      centerRef.current.multiplyScalar(-scale * 0.6);
      scene.position.copy(centerRef.current);
      
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={[0, rotation, 0]}
      onClick={onClick}
      castShadow
    >
      <primitive object={scene} />
      
      {isSelected && (
        <mesh position={[0, 0.6, 0]}>
          <ringGeometry args={[0.4, 0.45, 32]} />
          <meshBasicMaterial color="#22d3ee" side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};

const WasteObject = ({ 
  item, 
  onClick,
  isSelected
}: { 
  item: WasteItem; 
  onClick: () => void;
  isSelected: boolean;
}) => {
  const getModelName = () => {
    const config = WASTE_ITEMS_CONFIG.find(c => 
      c.name === item.name || c.modelNames.includes(item.modelName)
    );
    
    if (config && config.modelNames.length > 1) {
      return config.modelNames[item.useAlternate ? 1 : 0];
    }
    
    return item.modelName;
  };

  const modelName = getModelName();

  return (
    <Suspense fallback={null}>
      <Model
        modelName={modelName}
        position={item.position}
        rotation={item.rotation}
        onClick={onClick}
        isSelected={isSelected}
        inBin={item.inBin}
        isCorrect={item.isCorrect}
      />
      
      {!item.inBin && (
        <Billboard position={[item.position[0], item.position[1] + 1, item.position[2]]}>
          <Text 
            fontSize={0.25} 
            color={isSelected ? "#fbbf24" : "white"} 
            outlineWidth={0.05} 
            outlineColor="black"
          >
            {item.name}
          </Text>
        </Billboard>
      )}
    </Suspense>
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
        position={[0, 0.8, 0]}
        onClick={() => onDrop(bin.type)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        receiveShadow
      >
        <cylinderGeometry args={[1.2, 1, 2.5, 24]} />
        <meshStandardMaterial 
          color={hovered ? '#22c55e' : bin.color} 
          transparent
          opacity={0.8}
        />
      </mesh>
      
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[1.3, 1.2, 0.2, 24]} />
        <meshStandardMaterial color={bin.color} />
      </mesh>
      
      <Billboard position={[0, 2.6, 0]}>
        <Text fontSize={0.3} color="white" outlineWidth={0.05} outlineColor="black">
          {bin.label}
        </Text>
      </Billboard>
    </group>
  );
};

const preloadModels = () => {
  const uniqueModels = new Set<string>();
  
  WASTE_ITEMS_CONFIG.forEach(config => {
    config.modelNames.forEach(modelName => {
      uniqueModels.add(modelName);
    });
  });
  
  uniqueModels.forEach(modelName => {
    useGLTF.preload(`${MODELS_BASE_PATH}${modelName}`);
  });
};

preloadModels();

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
  const [lastWasteType, setLastWasteType] = useState<WasteType | null>(null);

  const bins: Bin[] = [
    { 
      type: 'recycling', 
      position: [-4, 0, -4], 
      color: '#3b82f6', 
      acceptedTypes: ['plastic', 'paper', 'glass', 'metal'],
      label: 'RECYCLE',
      description: 'Plastic, Paper, Glass, Metal'
    },
    { 
      type: 'compost', 
      position: [0, 0, -4], 
      color: '#10b981', 
      acceptedTypes: ['organic'],
      label: 'COMPOST',
      description: 'Food Waste'
    },
    { 
      type: 'hazardous', 
      position: [4, 0, -4], 
      color: '#ef4444', 
      acceptedTypes: ['electronics'],
      label: 'HAZARDOUS',
      description: 'Batteries, Electronics'
    },
    { 
      type: 'landfill', 
      position: [0, 0, 4], 
      color: '#64748b', 
      acceptedTypes: [],
      label: 'LANDFILL',
      description: 'Non-recyclable'
    },
  ];

  const FIXED_POSITION: [number, number, number] = [0, 1.5, 0];

  useEffect(() => {
    if (gameActive && !gameCompleted) {
      generateNextWasteItem();
    }
  }, [gameActive, gameCompleted]);

  const generateNextWasteItem = useCallback(() => {
    if (!gameActive || gameCompleted) return;

    const availableConfigs = WASTE_ITEMS_CONFIG.filter(config => 
      config.type !== lastWasteType
    );

    const configsToUse = availableConfigs.length > 0 ? availableConfigs : WASTE_ITEMS_CONFIG;
    
    const config = configsToUse[Math.floor(Math.random() * configsToUse.length)];
    const modelNames = config.modelNames;
    
    const useAlternate = modelNames.length > 1 ? (Math.random() > 0.5) : false;
    
    const newItem: WasteItem = {
      id: itemsGenerated + 1,
      type: config.type,
      name: config.name,
      modelName: modelNames[useAlternate ? 1 : 0],
      position: FIXED_POSITION,
      rotation: 0,
      useAlternate: useAlternate
    };

    setItemsGenerated(prev => prev + 1);
    setWasteItems([newItem]);
    setSelectedItem(null);
    setLastWasteType(config.type);
    
  }, [itemsGenerated, gameActive, gameCompleted, lastWasteType]);

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
        0.5,
        bin.position[2]
      ]
    };

    setWasteItems([updatedItem]);

    const newScore = score + points;
    setScore(newScore);
    
    if (isCorrect) {
      setTotalCorrect(prev => prev + 1);
      setLastMessage({ text: `+100`, isCorrect: true });
    } else {
      setTotalIncorrect(prev => prev + 1);
      setLastMessage({ text: `Wrong`, isCorrect: false });
    }

    setTimeout(() => setLastMessage(null), 1500);

    if (onScoreUpdate) {
      onScoreUpdate(newScore);
    }

    generateNextWasteItem();

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
    setLastWasteType(null);
    
    setTimeout(() => {
      generateNextWasteItem();
    }, 100);
  };

  const handleBackToStudy = () => {
    router.push('/study');
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-zinc-900 to-black overflow-hidden">
      <div className="absolute inset-0">
        <Canvas shadows camera={{ position: [0, 8, 12], fov: 60 }}>
          <ambientLight intensity={0.8} color="#ffffff" />
          <directionalLight 
            position={[5, 15, 5]} 
            intensity={1.2} 
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight 
            position={[-5, 10, -5]} 
            intensity={0.6} 
            color="#60a5fa"
          />
          <hemisphereLight 
            intensity={0.5}
            groundColor="#1e293b"
          />
          
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#374151" roughness={0.7} />
          </mesh>

          {bins.map(bin => (
            <BinObject key={bin.type} bin={bin} onDrop={handleBinDrop} />
          ))}

          {wasteItems.map(item => (
            <WasteObject 
              key={item.id} 
              item={item} 
              onClick={() => handleItemClick(item)}
              isSelected={selectedItem?.id === item.id}
            />
          ))}

          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minDistance={5}
            maxDistance={25}
          />
        </Canvas>
      </div>

      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
              <Recycle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Recycling Game</h1>
              <p className="text-xs text-zinc-500">Sort waste correctly!</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${timeLeft < 10 ? 'text-red-400' : 'text-emerald-400'}`} />
                <div>
                  <p className="text-[10px] text-zinc-400">Time</p>
                  <p className={`text-lg font-black ${timeLeft < 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {timeLeft}s
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-[10px] text-zinc-400">Score</p>
                  <p className="text-lg font-black text-white">{score}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-[10px] text-zinc-400">Correct</p>
                  <p className="text-lg font-black text-white">{totalCorrect}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg text-xs font-black uppercase hover:scale-105 transition-transform flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" /> New Game
            </button>
            
            <button
              onClick={handleBackToStudy}
              className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-black uppercase transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
          </div>
        </div>
      </div>

      {lastMessage && (
        <div className={`absolute top-20 right-4 z-20 p-3 rounded-xl backdrop-blur-sm border ${
          lastMessage.isCorrect 
            ? 'bg-emerald-500/20 border-emerald-500/30' 
            : 'bg-red-500/20 border-red-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {lastMessage.isCorrect ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <p className={`font-black ${lastMessage.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
              {lastMessage.text}
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-black/70 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-black text-white">How to Play</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-emerald-400 font-bold text-xs">1</span>
              </div>
              <p className="text-xs text-zinc-300">Click object in center</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-emerald-400 font-bold text-xs">2</span>
              </div>
              <p className="text-xs text-zinc-300">Click correct bin</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-emerald-400 font-bold text-xs">3</span>
              </div>
              <p className="text-xs text-zinc-300">New object appears</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-black/70 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4">
          <h3 className="text-sm font-black text-white mb-3">Recycling Bins</h3>
          <div className="space-y-2">
            {bins.map(bin => (
              <div key={bin.type} className="flex items-center gap-3 p-2 bg-zinc-900/50 rounded-lg">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bin.color }} />
                <div>
                  <span className="text-xs text-white font-medium">{bin.label}</span>
                  <p className="text-[10px] text-zinc-400">{bin.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {gameCompleted && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-6">
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-yellow-400" />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-4">Game Over!</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-zinc-900/50 rounded-xl">
                <p className="text-xs text-zinc-400 mb-1">Final Score</p>
                <p className="text-2xl font-black text-emerald-400">{score}</p>
              </div>
              
              <div className="p-4 bg-zinc-900/50 rounded-xl">
                <p className="text-xs text-zinc-400 mb-1">Correct Sorts</p>
                <p className="text-2xl font-black text-white">{totalCorrect}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-zinc-400">
                You sorted <span className="text-white font-bold">{totalCorrect}</span> items correctly
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Accuracy: {totalCorrect + totalIncorrect > 0 
                  ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) 
                  : 0}%
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl font-black uppercase text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Play Again
              </button>
              
              <button
                onClick={handleBackToStudy}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl text-sm font-black uppercase transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Study
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function CarbonSortGame({ onScoreUpdate }: CarbonSortGameProps) {
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