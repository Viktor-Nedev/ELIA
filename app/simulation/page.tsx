"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { sustainabilityService } from "@/lib/sustainability.service";
import { DailyEntry } from "@/lib/types";
import {
  Globe, Zap, Droplets, Leaf, Flame, Recycle,
  ChevronRight, ChevronLeft, Play, Pause, RotateCcw,
  TrendingUp, Thermometer, Trees, Cloud,
  AlertCircle, Target, Sparkles, Eye
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

type ImpactType = 'co2' | 'water' | 'energy' | 'waste' | 'food';
type PlanetState = 'healthy' | 'warning' | 'critical' | 'recovering';

interface ImpactData {
  co2: number;
  water: number;
  energy: number;
  waste: number;
  food: number;
}

interface SimulationResult {
  temperatureRise: number;
  forestLoss: number;
  waterScarcity: number;
  iceLoss: number;
  pollution: number;
  planetState: PlanetState;
}

export default function SimulatorPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userImpact, setUserImpact] = useState<ImpactData>({
    co2: 0.5,
    water: 0.5,
    energy: 0.5,
    waste: 0.5,
    food: 0.5
  });
  const [years, setYears] = useState<number>(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [showHelp, setShowHelp] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const yearOptions = [10, 25, 50, 100];

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    calculateSimulation();
  }, [userImpact, years]);

  useEffect(() => {
    if (isPlaying && simulation) {
      startAnimation();
    } else {
      stopAnimation();
    }
    return () => stopAnimation();
  }, [isPlaying, simulation]);

  const loadUserData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const entries = await sustainabilityService.getRecentEntries(user.uid, 30);
      
      if (entries.length > 0) {
        const avgImpact = calculateAverageImpact(entries);
        setUserImpact(avgImpact);
      }
    } catch (err) {
      console.error("Load user data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageImpact = (entries: DailyEntry[]): ImpactData => {
    const totals = { co2: 0, water: 0, energy: 0, waste: 0, food: 0 };
    const counts = { co2: 0, water: 0, energy: 0, waste: 0, food: 0 };

    entries.forEach(entry => {
      const emissions = entry.emissions;
      
      if (emissions.co2 > 0) {
        totals.co2 += emissions.co2;
        counts.co2++;
      }
      if (emissions.water > 0) {
        totals.water += emissions.water;
        counts.water++;
      }
      if (emissions.energy && emissions.energy > 0) {
        totals.energy += emissions.energy;
        counts.energy++;
      }
      if (emissions.waste && emissions.waste > 0) {
        totals.waste += emissions.waste;
        counts.waste++;
      }
      if (emissions.food > 0) {
        totals.food += emissions.food;
        counts.food++;
      }
    });

    const normalize = (value: number, max: number = 10) => Math.min(1, value / max);
    
    return {
      co2: normalize(totals.co2 / Math.max(1, counts.co2), 5),
      water: normalize(totals.water / Math.max(1, counts.water), 50),
      energy: normalize(totals.energy / Math.max(1, counts.energy), 10),
      waste: normalize(totals.waste / Math.max(1, counts.waste), 5),
      food: normalize(totals.food / Math.max(1, counts.food), 10)
    };
  };

  const calculateSimulation = () => {
    const normalizedImpact = {
      co2: userImpact.co2,
      water: userImpact.water,
      energy: userImpact.energy,
      waste: userImpact.waste,
      food: userImpact.food
    };

    const temperatureRise = normalizedImpact.co2 * years * 0.02;
    const forestLoss = normalizedImpact.waste * years * 0.3;
    const waterScarcity = normalizedImpact.water * years * 0.25;
    const iceLoss = temperatureRise * 0.6;
    const pollution = (normalizedImpact.co2 + normalizedImpact.waste) * years * 0.15;

    let planetState: PlanetState = 'healthy';
    const severity = temperatureRise + forestLoss + waterScarcity + iceLoss + pollution;
    
    if (severity < 20) planetState = 'healthy';
    else if (severity < 50) planetState = 'warning';
    else if (severity < 80) planetState = 'critical';
    else planetState = 'recovering';

    setSimulation({
      temperatureRise: Math.min(100, temperatureRise),
      forestLoss: Math.min(100, forestLoss),
      waterScarcity: Math.min(100, waterScarcity),
      iceLoss: Math.min(100, iceLoss),
      pollution: Math.min(100, pollution),
      planetState
    });

    drawPlanet();
  };

  const drawPlanet = () => {
    const canvas = canvasRef.current;
    if (!canvas || !simulation) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;

    ctx.clearRect(0, 0, width, height);

    const getPlanetColor = () => {
      switch (simulation.planetState) {
        case 'healthy': return '#4F46E5';
        case 'warning': return '#F59E0B';
        case 'critical': return '#DC2626';
        case 'recovering': return '#10B981';
        default: return '#4F46E5';
      }
    };

    const getOceanColor = () => {
      const baseBlue = 100;
      const pollutionEffect = simulation.pollution * 1.5;
      const r = Math.min(255, 30 + pollutionEffect * 2);
      const g = Math.min(255, baseBlue + pollutionEffect * 0.5);
      const b = Math.min(255, baseBlue + pollutionEffect * 1.5);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const getLandColor = () => {
      const desertEffect = simulation.waterScarcity * 2;
      const r = Math.min(255, 120 + desertEffect);
      const g = Math.max(0, 180 - desertEffect);
      const b = Math.max(0, 100 - desertEffect * 0.5);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const drawBackground = () => {
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius * 3
      );
      
      switch (simulation.planetState) {
        case 'healthy':
          gradient.addColorStop(0, 'rgba(79, 70, 229, 0.1)');
          gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
          break;
        case 'warning':
          gradient.addColorStop(0, 'rgba(245, 158, 11, 0.1)');
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
          break;
        case 'critical':
          gradient.addColorStop(0, 'rgba(220, 38, 38, 0.1)');
          gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');
          break;
        case 'recovering':
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.1)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          break;
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const drawPlanetBase = () => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = getPlanetColor();
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.stroke();
    };

    const drawOceans = () => {
      const oceanCount = 4;
      for (let i = 0; i < oceanCount; i++) {
        const angle = (Math.PI * 2 * i) / oceanCount;
        const oceanRadius = radius * 0.7;
        const oceanX = centerX + Math.cos(angle) * oceanRadius * 0.5;
        const oceanY = centerY + Math.sin(angle) * oceanRadius * 0.5;
        
        ctx.beginPath();
        ctx.arc(oceanX, oceanY, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = getOceanColor();
        ctx.fill();
      }
    };

    const drawLand = () => {
      const landCount = 3;
      for (let i = 0; i < landCount; i++) {
        const angle = (Math.PI * 2 * i) / landCount + Math.PI / 6;
        const landRadius = radius * 0.9;
        const landX = centerX + Math.cos(angle) * landRadius * 0.3;
        const landY = centerY + Math.sin(angle) * landRadius * 0.3;
        
        ctx.beginPath();
        ctx.arc(landX, landY, radius * 0.25 * (1 - simulation.forestLoss / 200), 0, Math.PI * 2);
        ctx.fillStyle = getLandColor();
        ctx.fill();
      }
    };

    const drawIce = () => {
      if (simulation.iceLoss < 95) {
        const iceRadius = radius * 0.2 * (1 - simulation.iceLoss / 100);
        
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.6, centerY - radius * 0.4, iceRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.5, centerY + radius * 0.5, iceRadius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawPollution = () => {
      if (simulation.pollution > 10) {
        const pollutionDensity = Math.min(50, simulation.pollution / 2);
        
        for (let i = 0; i < pollutionDensity; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = radius * (0.8 + Math.random() * 0.4);
          const particleX = centerX + Math.cos(angle) * distance;
          const particleY = centerY + Math.sin(angle) * distance;
          const particleSize = 1 + Math.random() * 3;
          
          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100, 100, 100, ${0.1 + Math.random() * 0.2})`;
          ctx.fill();
        }
      }
    };

    const drawAtmosphere = () => {
      const gradient = ctx.createRadialGradient(
        centerX, centerY, radius,
        centerX, centerY, radius * 1.5
      );
      
      if (simulation.temperatureRise < 30) {
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else if (simulation.temperatureRise < 60) {
        gradient.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
        gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(220, 38, 38, 0.5)');
        gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');
      }
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    drawBackground();
    drawPlanetBase();
    drawOceans();
    drawLand();
    drawIce();
    drawPollution();
    drawAtmosphere();
  };

  const startAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas || !simulation) return;

    let time = 0;
    const animate = () => {
      time += 0.02;
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.4;

      ctx.clearRect(0, 0, width, height);

      const pulseRadius = radius * (1 + Math.sin(time) * 0.05);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      
      const getPulseColor = () => {
        switch (simulation.planetState) {
          case 'healthy': return 'rgba(16, 185, 129, 0.3)';
          case 'warning': return 'rgba(245, 158, 11, 0.3)';
          case 'critical': return 'rgba(220, 38, 38, 0.3)';
          case 'recovering': return 'rgba(59, 130, 246, 0.3)';
          default: return 'rgba(16, 185, 129, 0.3)';
        }
      };

      ctx.fillStyle = getPulseColor();
      ctx.fill();

      drawPlanet();
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleImpactChange = (type: ImpactType, value: number) => {
    setUserImpact(prev => ({
      ...prev,
      [type]: value / 100
    }));
  };

  const resetToAverage = () => {
    setUserImpact({
      co2: 0.5,
      water: 0.5,
      energy: 0.5,
      waste: 0.5,
      food: 0.5
    });
    setYears(50);
    setIsPlaying(false);
  };

  const getImpactDescription = () => {
    if (!simulation) return "";
    
    if (simulation.planetState === 'healthy') {
      return "Earth remains vibrant and healthy. Your habits are sustainable!";
    } else if (simulation.planetState === 'warning') {
      return "Earth shows signs of stress. Consider improving your habits.";
    } else if (simulation.planetState === 'critical') {
      return "Earth is in critical condition. Immediate action is needed.";
    } else {
      return "Earth is recovering! Your positive changes are making a difference.";
    }
  };

  const getStateColor = (state: PlanetState) => {
    switch (state) {
      case 'healthy': return 'text-emerald-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      case 'recovering': return 'text-blue-500';
      default: return 'text-emerald-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-16 h-16 border-2 border-t-emerald-500 border-zinc-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 pb-20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 lg:mb-12">
          <div className="space-y-2">
            <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors uppercase text-xs font-black tracking-widest mb-4">
              <ChevronLeft className="w-4 h-4" /> Back to Nexus
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                <Globe size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-white italic uppercase tracking-tighter">
                  Planet <span className="text-emerald-500">Impact Simulator</span>
                </h1>
                <p className="text-zinc-500 font-medium">Visualize the future based on your daily habits</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showHelp ? "Hide Info" : "How It Works"}
          </button>
        </div>

        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-zinc-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">How the Simulator Works</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-zinc-300">This simulator shows what could happen if <span className="text-emerald-400 font-bold">8 billion people</span> lived like you for <span className="text-emerald-400 font-bold">{years} years</span>.</p>
                <p className="text-zinc-300 text-sm">It's not a scientific prediction, but a visualization to help understand the impact of daily habits.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-zinc-300">Adjust sliders to see different scenarios</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-zinc-300">Watch the planet change in real-time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-zinc-300">See how your choices affect Earth's future</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Earth Visualization</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('2d')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${viewMode === '2d' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                  >
                    2D View
                  </button>
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${viewMode === '3d' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                  >
                    3D View
                  </button>
                </div>
              </div>

              <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={800}
                  className="w-full h-full"
                />
                
                {simulation && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-xl border border-zinc-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-3 h-3 rounded-full ${getStateColor(simulation.planetState).replace('text-', 'bg-')}`}></div>
                          <span className={`text-sm font-bold ${getStateColor(simulation.planetState)}`}>
                            {simulation.planetState.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">{getImpactDescription()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-white">{years} Years</p>
                        <p className="text-xs text-zinc-400">Timeframe</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-white flex items-center gap-2 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "Pause" : "Play Animation"}
                </button>
                <button
                  onClick={resetToAverage}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-medium text-zinc-300 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">Simulation Controls</h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Time Period</span>
                  <span className="text-sm font-bold text-white">{years} years</span>
                </div>
                <div className="flex gap-2">
                  {yearOptions.map(year => (
                    <button
                      key={year}
                      onClick={() => setYears(year)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium ${years === year ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                      {year}y
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <ImpactSlider
                  icon={<Flame className="w-4 h-4" />}
                  label="CO₂ Emissions"
                  value={userImpact.co2 * 100}
                  onChange={(val) => handleImpactChange('co2', val)}
                  color="text-orange-500"
                />
                <ImpactSlider
                  icon={<Droplets className="w-4 h-4" />}
                  label="Water Usage"
                  value={userImpact.water * 100}
                  onChange={(val) => handleImpactChange('water', val)}
                  color="text-blue-500"
                />
                <ImpactSlider
                  icon={<Zap className="w-4 h-4" />}
                  label="Energy Consumption"
                  value={userImpact.energy * 100}
                  onChange={(val) => handleImpactChange('energy', val)}
                  color="text-yellow-500"
                />
                <ImpactSlider
                  icon={<Recycle className="w-4 h-4" />}
                  label="Waste Production"
                  value={userImpact.waste * 100}
                  onChange={(val) => handleImpactChange('waste', val)}
                  color="text-green-500"
                />
                <ImpactSlider
                  icon={<Leaf className="w-4 h-4" />}
                  label="Food Impact"
                  value={userImpact.food * 100}
                  onChange={(val) => handleImpactChange('food', val)}
                  color="text-emerald-500"
                />
              </div>
            </div>

            {simulation && (
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">Impact Metrics</h3>
                
                <div className="space-y-4">
                  <MetricItem
                    icon={<Thermometer className="w-4 h-4" />}
                    label="Temperature Rise"
                    value={`+${simulation.temperatureRise.toFixed(1)}°C`}
                    severity={simulation.temperatureRise}
                  />
                  <MetricItem
                    icon={<Trees className="w-4 h-4" />}
                    label="Forest Loss"
                    value={`${simulation.forestLoss.toFixed(1)}%`}
                    severity={simulation.forestLoss}
                  />
                  <MetricItem
                    icon={<Droplets className="w-4 h-4" />}
                    label="Water Scarcity"
                    value={`${simulation.waterScarcity.toFixed(1)}%`}
                    severity={simulation.waterScarcity}
                  />
                  <MetricItem
                    icon={<Cloud className="w-4 h-4" />}
                    label="Ice Loss"
                    value={`${simulation.iceLoss.toFixed(1)}%`}
                    severity={simulation.iceLoss}
                  />
                  <MetricItem
                    icon={<AlertCircle className="w-4 h-4" />}
                    label="Pollution Level"
                    value={`${simulation.pollution.toFixed(1)}%`}
                    severity={simulation.pollution}
                  />
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-800">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-white">Want to Change This Future?</h4>
                  </div>
                  <p className="text-sm text-zinc-300 mb-4">
                    Small changes in your daily habits can create a better future for our planet.
                  </p>
                  <Link
                    href="/challenges"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <Target className="w-4 h-4" />
                    Start Eco Challenges
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 p-6 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <h4 className="font-bold text-white mb-2">Scale Matters</h4>
              <p className="text-sm text-zinc-400">
                Your individual impact × 8 billion people = global change
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="font-bold text-white mb-2">Visual Learning</h4>
              <p className="text-sm text-zinc-400">
                See how environmental systems interact and change over time
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="font-bold text-white mb-2">Empowerment</h4>
              <p className="text-sm text-zinc-400">
                Every positive choice contributes to a healthier planet
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImpactSlider({ icon, label, value, onChange, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color} bg-opacity-10`}>
            {icon}
          </div>
          <span className="text-sm text-zinc-300">{label}</span>
        </div>
        <span className="text-sm font-bold text-white">{value.toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      />
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Low Impact</span>
        <span>High Impact</span>
      </div>
    </div>
  );
}

function MetricItem({ icon, label, value, severity }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  severity: number;
}) {
  const getSeverityColor = (severity: number) => {
    if (severity < 25) return 'bg-emerald-500';
    if (severity < 50) return 'bg-yellow-500';
    if (severity < 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-zinc-800 rounded-lg">
          {icon}
        </div>
        <div>
          <p className="text-sm text-zinc-300">{label}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
      </div>
      <div className="w-24">
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${getSeverityColor(severity)}`}
            style={{ width: `${Math.min(100, severity)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}