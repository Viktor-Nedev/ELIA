// components/WaterFlowGame.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface WaterFlowGameProps {
  onGameComplete?: (score: number) => void;
  onClose?: () => void;
}

export default function WaterFlowGame({ onGameComplete, onClose }: WaterFlowGameProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [waterLevel, setWaterLevel] = useState(100);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [pipes, setPipes] = useState<THREE.Mesh[]>([]);
  const [waterDrops, setWaterDrops] = useState<THREE.Mesh[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Three.js референции
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number | null>(null);
  const pipesRef = useRef<THREE.Mesh[]>([]);
  const dropsRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const glowRefs = useRef<THREE.Mesh[]>([]);

  // Инициализиране на Three.js сцената
  const initScene = () => {
    if (!canvasRef.current) return;

    // Почистване на предишното съдържание
    canvasRef.current.innerHTML = '';

    // Настройка на сцената
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 10, 50);
    
    // Настройка на камерата
    const camera = new THREE.PerspectiveCamera(
      60,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 15);
    camera.lookAt(0, 0, 0);
    
    // Настройка на рендерера
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    canvasRef.current.appendChild(renderer.domElement);
    
    // Осветление
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Съхраняване на референции
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    
    // Създаване на начални обекти
    createGround(scene);
    createWaterSource(scene);
    createConservationPoints(scene);
    createObstacles(scene);
    
    // Стартиране на анимационния цикъл
    animate();
    
    // Обработка на промяна на размера на прозореца
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !canvasRef.current) return;
      
      cameraRef.current.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    setGameStarted(true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  };

  const createGround = (scene: THREE.Scene) => {
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a5f2a,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Грид помощник
    const gridHelper = new THREE.GridHelper(30, 30, 0x0a5a2a, 0x0a3a1a);
    scene.add(gridHelper);
  };

  const createWaterSource = (scene: THREE.Scene) => {
    // Източник на вода (кладенец/помпа)
    const sourceGeometry = new THREE.CylinderGeometry(0.5, 0.7, 1, 16);
    const sourceMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4a90e2,
      emissive: 0x1a5a9a,
      emissiveIntensity: 0.3
    });
    const source = new THREE.Mesh(sourceGeometry, sourceMaterial);
    source.position.set(-10, 0.5, 0);
    source.castShadow = true;
    scene.add(source);
    
    // Ефект на водни частици
    createWaterParticles(scene, source.position);
  };

  const createWaterParticles = (scene: THREE.Scene, position: THREE.Vector3) => {
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = position.x + (Math.random() - 0.5) * 0.8;
      positions[i + 1] = position.y + Math.random() * 3;
      positions[i + 2] = position.z + (Math.random() - 0.5) * 0.8;
    }
    
    const particles = new THREE.BufferGeometry();
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x4a90e2,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    particlesRef.current = particleSystem;
  };

  const createConservationPoints = (scene: THREE.Scene) => {
    const conservationPoints = [
      { position: new THREE.Vector3(8, 0.5, -5), type: 'garden' as const },
      { position: new THREE.Vector3(10, 0.5, 5), type: 'reservoir' as const },
      { position: new THREE.Vector3(0, 0.5, 10), type: 'filter' as const },
      { position: new THREE.Vector3(-5, 0.5, 8), type: 'storage' as const }
    ];
    
    conservationPoints.forEach((point) => {
      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;
      
      switch (point.type) {
        case 'garden':
          geometry = new THREE.ConeGeometry(0.6, 1, 8);
          material = new THREE.MeshStandardMaterial({ color: 0x2ecc71 });
          break;
        case 'reservoir':
          geometry = new THREE.BoxGeometry(1, 0.5, 1);
          material = new THREE.MeshStandardMaterial({ color: 0x3498db });
          break;
        case 'filter':
          geometry = new THREE.CylinderGeometry(0.4, 0.4, 1, 8);
          material = new THREE.MeshStandardMaterial({ color: 0x9b59b6 });
          break;
        case 'storage':
        default:
          geometry = new THREE.SphereGeometry(0.6, 16, 16);
          material = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
          break;
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(point.position);
      mesh.castShadow = true;
      mesh.userData = { type: 'target', pointType: point.type };
      scene.add(mesh);
      
      // Добавяне на ефект на сияние
      const glowGeometry = new THREE.RingGeometry(0.8, 1, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: point.type === 'garden' ? 0x2ecc71 : 
               point.type === 'reservoir' ? 0x3498db :
               point.type === 'filter' ? 0x9b59b6 : 0xe74c3c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.rotation.x = -Math.PI / 2;
      glow.position.copy(point.position);
      glow.position.y = 0.1;
      scene.add(glow);
      glowRefs.current.push(glow);
    });
  };

  const createObstacles = (scene: THREE.Scene) => {
    const obstacles = [
      { position: new THREE.Vector3(-2, 1, -3), size: new THREE.Vector3(1, 2, 1) },
      { position: new THREE.Vector3(3, 1, 2), size: new THREE.Vector3(2, 1, 2) },
      { position: new THREE.Vector3(0, 1, -2), size: new THREE.Vector3(1.5, 1.5, 1.5) },
      { position: new THREE.Vector3(5, 1, -1), size: new THREE.Vector3(1, 3, 1) }
    ];
    
    obstacles.forEach(obstacle => {
      const geometry = new THREE.BoxGeometry(obstacle.size.x, obstacle.size.y, obstacle.size.z);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x8b4513,
        roughness: 0.9
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(obstacle.position);
      mesh.castShadow = true;
      mesh.userData = { type: 'obstacle' };
      scene.add(mesh);
    });
  };

  const createPipe = (start: THREE.Vector3, end: THREE.Vector3) => {
    if (!sceneRef.current) return null;
    
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    direction.normalize();
    
    const geometry = new THREE.CylinderGeometry(0.15, 0.15, length, 8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const pipe = new THREE.Mesh(geometry, material);
    
    // Позициониране и завъртане на тръбата
    pipe.position.copy(start).add(end).multiplyScalar(0.5);
    pipe.lookAt(end);
    pipe.rotateX(Math.PI / 2);
    
    pipe.castShadow = true;
    pipe.userData = { start, end, length };
    sceneRef.current.add(pipe);
    pipesRef.current.push(pipe);
    setPipes([...pipesRef.current]);
    
    return pipe;
  };

  const createWaterDrop = (position: THREE.Vector3) => {
    if (!sceneRef.current) return null;
    
    const geometry = new THREE.SphereGeometry(0.08, 8, 8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4a90e2,
      emissive: 0x1a5a9a,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8
    });
    
    const drop = new THREE.Mesh(geometry, material);
    drop.position.copy(position);
    drop.position.y += 0.5; // Стартира малко по-високо
    drop.castShadow = true;
    drop.userData = { velocity: new THREE.Vector3(0, -0.05, 0) };
    sceneRef.current.add(drop);
    dropsRef.current.push(drop);
    setWaterDrops([...dropsRef.current]);
    
    return drop;
  };

  const checkTargetCollision = (drop: THREE.Mesh) => {
    if (!sceneRef.current) return false;
    
    const targets = sceneRef.current.children.filter(
      child => child.userData.type === 'target'
    );
    
    for (const target of targets) {
      const distance = drop.position.distanceTo(target.position);
      if (distance < 1.5) {
        // Успешно достигната цел
        sceneRef.current.remove(drop);
        return true;
      }
    }
    
    return false;
  };

  const animate = () => {
    animationRef.current = requestAnimationFrame(animate);
    
    // Анимиране на водните капки
    dropsRef.current.forEach((drop, index) => {
      if (drop.userData.velocity) {
        drop.position.add(drop.userData.velocity);
        
        // Проверка за сблъсък с цел
        if (checkTargetCollision(drop)) {
          dropsRef.current.splice(index, 1);
          setWaterDrops([...dropsRef.current]);
          setScore(prev => prev + 50); // Бонус за достигане на цел
          return;
        }
        
        // Премахване на капката ако падне под земята
        if (drop.position.y < -2) {
          if (sceneRef.current) {
            sceneRef.current.remove(drop);
            dropsRef.current.splice(index, 1);
            setWaterDrops([...dropsRef.current]);
            setWaterLevel(prev => Math.max(0, prev - 8));
          }
        }
      }
    });
    
    // Анимиране на частиците
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.005;
    }
    
    // Анимиране на сиянията
    glowRefs.current.forEach(glow => {
      glow.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.1);
    });
    
    // Анимиране на тръбите (пулсиращ ефект)
    pipesRef.current.forEach(pipe => {
      pipe.scale.y = 1 + Math.sin(Date.now() * 0.003) * 0.05;
    });
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!isPlaying || gameOver || !cameraRef.current || !sceneRef.current) return;
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      point.y = 0.5; // Поставяне на същата височина
      
      // Проверка дали точката не е върху пречка
      const obstacleIntersect = intersects.find(i => 
        i.object.userData.type === 'obstacle'
      );
      
      if (obstacleIntersect) {
        setWaterLevel(prev => Math.max(0, prev - 15));
        return;
      }
      
      // Създаване на нова тръба
      if (pipesRef.current.length === 0) {
        // Първа тръба от източника
        createPipe(new THREE.Vector3(-10, 0.5, 0), point);
      } else {
        // Свързване с последната тръба
        const lastPipe = pipesRef.current[pipesRef.current.length - 1];
        const endPoint = lastPipe.userData.end;
        createPipe(endPoint, point);
      }
      
      // Създаване на водна капка в точката на свързване
      createWaterDrop(point);
      
      // Добавяне на точки
      setScore(prev => prev + 10);
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setWaterLevel(100);
    setTimeLeft(60);
    
    // Почистване на съществуващи тръби и капки
    if (sceneRef.current) {
      pipesRef.current.forEach(pipe => sceneRef.current!.remove(pipe));
      dropsRef.current.forEach(drop => sceneRef.current!.remove(drop));
    }
    
    pipesRef.current = [];
    dropsRef.current = [];
    setPipes([]);
    setWaterDrops([]);
  };

  // Ефекти
  useEffect(() => {
    if (!gameStarted) {
      const cleanup = initScene();
      return cleanup;
    }
  }, [gameStarted]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsPlaying(false);
          setGameOver(true);
          if (onGameComplete) onGameComplete(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isPlaying, gameOver, score, onGameComplete]);

  useEffect(() => {
    if (waterLevel <= 0 && isPlaying) {
      setIsPlaying(false);
      setGameOver(true);
      if (onGameComplete) onGameComplete(score);
    }
  }, [waterLevel, isPlaying, score, onGameComplete]);

  // Почистване
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative min-h-[600px] w-full">
      {/* Заглавие на играта */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <DropletsIcon className="w-6 h-6 text-blue-400" />
            </div>
            Water Flow Game
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            Насочвай водата към точките за консервация, докато избягваш течове!
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black uppercase text-sm transition-colors flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Затвори
        </button>
      </div>

      {/* Игров Canvas */}
      <div 
        ref={canvasRef} 
        className="w-full h-[500px] rounded-2xl overflow-hidden cursor-crosshair border-2 border-zinc-800"
        onClick={handleCanvasClick}
      />
      
      {/* Игров UI Overlay */}
      <div className="absolute top-20 left-4 right-4">
        <div className="flex flex-wrap gap-4">
          {/* Точки */}
          <div className="px-6 py-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <StarIcon className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Точки</p>
                <p className="text-2xl font-black text-white">{score}</p>
              </div>
            </div>
          </div>
          
          {/* Ниво на водата */}
          <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 border-2 border-blue-400 rounded-lg relative overflow-hidden">
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-300 transition-all duration-300"
                    style={{ height: `${waterLevel}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Ниво на водата</p>
                <p className="text-sm font-black text-white">{waterLevel}% остава</p>
              </div>
            </div>
          </div>
          
          {/* Оставащо време */}
          <div className="px-6 py-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <ClockIcon className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Оставащо време</p>
                <p className="text-2xl font-black text-white">{timeLeft}с</p>
              </div>
            </div>
          </div>
          
          {/* Контроли */}
          <div className="flex items-center gap-2 ml-auto">
            {!isPlaying && !gameOver && (
              <button
                onClick={startGame}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-sm transition-colors flex items-center gap-2"
              >
                <PlayIcon className="w-4 h-4" /> Започни игра
              </button>
            )}
            
            {isPlaying && (
              <button
                onClick={() => setIsPlaying(false)}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black uppercase text-sm transition-colors flex items-center gap-2"
              >
                <PauseIcon className="w-4 h-4" /> Пауза
              </button>
            )}
            
            {gameOver && (
              <button
                onClick={startGame}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black uppercase text-sm transition-colors flex items-center gap-2"
              >
                <RefreshCwIcon className="w-4 h-4" /> Играй отново
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Инструкции за играта */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircleIcon className="w-5 h-5 text-blue-400" />
            <h4 className="font-black text-white">Как да играеш</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-zinc-400">Кликни, за да поставиш тръби</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <p className="text-sm text-zinc-400">Насочвай водата към цветните цели</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm text-zinc-400">Избягвай кафявите пречки</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Екран за край на играта */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <TrophyIcon className="w-12 h-12 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Край на играта!</h3>
              <p className="text-zinc-400 mb-6">Успешно насочи водата!</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-zinc-800/50 rounded-2xl">
                  <p className="text-xs text-zinc-600 uppercase tracking-widest">Крайни точки</p>
                  <p className="text-3xl font-black text-white">{score}</p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-2xl">
                  <p className="text-xs text-zinc-600 uppercase tracking-widest">Вода спестена</p>
                  <p className="text-3xl font-black text-emerald-400">{waterLevel}%</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={startGame}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black uppercase text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCwIcon className="w-4 h-4" /> Играй отново
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black uppercase text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeftIcon className="w-4 h-4" /> Затвори
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Статистика в долния десен ъгъл */}
      <div className="absolute bottom-4 right-4">
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-3">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-zinc-600">Тръби</p>
              <p className="text-lg font-black text-white">{pipes.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-600">Капки</p>
              <p className="text-lg font-black text-white">{waterDrops.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Икони компоненти
const DropletsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
  </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshCwIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const HelpCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);