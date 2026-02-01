"use client";

import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ArrowLeft, Cloud, Droplet, Flame, Zap, Recycle, Leaf, Filter, Layers, Download, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

type EmissionType = 'co2' | 'water' | 'energy' | 'waste' | 'food';
type EmissionData = {
  date: string;
  co2: number;
  water: number;
  energy: number;
  waste: number;
  food: number;
  location?: [number, number];
};

type EmissionCloud = {
  id: string;
  type: EmissionType;
  value: number;
  position: [number, number];
  radius: number;
  color: string;
};

export default function EmissionsMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [emissionsData, setEmissionsData] = useState<EmissionData[]>([]);
  const [clouds, setClouds] = useState<EmissionCloud[]>([]);
  const [selectedEmission, setSelectedEmission] = useState<EmissionType | 'all'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week');
  const [exporting, setExporting] = useState(false);

  const emissionColors: Record<EmissionType, string> = {
    co2: '#f97316',
    water: '#0ea5e9',
    energy: '#eab308',
    waste: '#22c55e',
    food: '#8b5cf6'
  };

  const emissionIcons: Record<EmissionType, React.ReactNode> = {
    co2: <Flame size={20} />,
    water: <Droplet size={20} />,
    energy: <Zap size={20} />,
    waste: <Recycle size={20} />,
    food: <Leaf size={20} />
  };

  const emissionLabels: Record<EmissionType, string> = {
    co2: 'CO₂ Emissions',
    water: 'Water Impact',
    energy: 'Energy Usage',
    waste: 'Waste Generated',
    food: 'Food Footprint'
  };

  const generateRandomPosition = (): [number, number] => {
    const baseLng = 23.3219;
    const baseLat = 42.6977;
    const lng = baseLng + (Math.random() - 0.5) * 0.3;
    const lat = baseLat + (Math.random() - 0.5) * 0.3;
    return [lng, lat];
  };

  useEffect(() => {
    const loadEmissionsData = async () => {
      setLoading(true);
      
      const mockData: EmissionData[] = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          co2: Math.random() * 10 + 2,
          water: Math.random() * 100 + 20,
          energy: Math.random() * 15 + 5,
          waste: Math.random() * 5 + 1,
          food: Math.random() * 3 + 0.5,
          location: generateRandomPosition()
        };
      });

      setEmissionsData(mockData);

      const generatedClouds: EmissionCloud[] = [];
      mockData.forEach((data, index) => {
        if (data.location) {
          const emissionTypes: EmissionType[] = ['co2', 'water', 'energy', 'waste', 'food'];
          emissionTypes.forEach(type => {
            if (data[type] > 0) {
              generatedClouds.push({
                id: `${type}-${index}`,
                type,
                value: data[type],
                position: data.location!,
                radius: Math.max(100, Math.min(1000, data[type] * 50)),
                color: emissionColors[type]
              });
            }
          });
        }
      });

      setClouds(generatedClouds);
      setLoading(false);
    };

    loadEmissionsData();
  }, [dateRange]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/vikdev/cml2u065q005n01qwebg569qo',
      center: [23.3219, 42.6977],
      zoom: 10,
      pitch: 0,
      bearing: 0,
      antialias: true,
      attributionControl: false
    });

    map.current.on('load', () => {
      console.log('Mapbox map loaded successfully!');
      setMapLoaded(true);
      
      try {
        map.current?.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });

        map.current?.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        map.current?.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        map.current.addControl(new mapboxgl.AttributionControl(), 'bottom-right');

        setTimeout(() => {
          updateCloudsOnMap();
        }, 500);

      } catch (error) {
        console.error('Error adding map features:', error);
      }
    });

    map.current.on('error', (e) => {
      console.error('Mapbox error:', e);
      if (e.error && e.error.status === 404) {
        map.current?.setStyle('mapbox://styles/mapbox/dark-v11');
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (map.current && mapLoaded) {
      updateCloudsOnMap();
    }
  }, [clouds, selectedEmission, mapLoaded]);

  const updateCloudsOnMap = () => {
    if (!map.current || !mapLoaded) return;

    const style = map.current.getStyle();
    
    if (style.layers) {
      style.layers.forEach((layer: any) => {
        if (layer.id && layer.id.startsWith('cloud-')) {
          if (map.current?.getLayer(layer.id)) {
            map.current.removeLayer(layer.id);
          }
        }
      });
    }

    if (style.sources) {
      Object.keys(style.sources).forEach(sourceId => {
        if (sourceId.startsWith('cloud-')) {
          if (map.current?.getSource(sourceId)) {
            map.current.removeSource(sourceId);
          }
        }
      });
    }

    const filteredClouds = selectedEmission === 'all' 
      ? clouds 
      : clouds.filter(cloud => cloud.type === selectedEmission);

    filteredClouds.forEach((cloud) => {
      const sourceId = `cloud-${cloud.id}`;
      const layerId = `cloud-layer-${cloud.id}`;

      const geojson = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: cloud.position
          },
          properties: {
            radius: cloud.radius,
            color: cloud.color,
            value: cloud.value,
            type: cloud.type
          }
        }]
      };

      try {
        if (!map.current?.getSource(sourceId)) {
          map.current?.addSource(sourceId, {
            type: 'geojson',
            data: geojson as any
          });
        }

        if (!map.current?.getLayer(layerId)) {
          map.current?.addLayer({
            id: layerId,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 5,
                12, cloud.radius / 100,
                16, cloud.radius / 20
              ],
              'circle-color': cloud.color,
              'circle-opacity': 0.4,
              'circle-blur': 0.6,
              'circle-stroke-width': 1,
              'circle-stroke-color': cloud.color,
              'circle-stroke-opacity': 0.8
            }
          });
        }

        const markerElement = document.createElement('div');
        markerElement.className = 'cloud-marker';
        markerElement.style.width = '12px';
        markerElement.style.height = '12px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.backgroundColor = cloud.color;
        markerElement.style.opacity = '0.8';
        markerElement.style.cursor = 'pointer';
        markerElement.style.boxShadow = `0 0 8px ${cloud.color}`;

        const popup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          offset: 25
        }).setHTML(`
          <div class="p-3 bg-zinc-900 text-white rounded-lg border border-zinc-700">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-3 h-3 rounded-full" style="background-color: ${cloud.color}"></div>
              <strong class="text-sm font-semibold">${emissionLabels[cloud.type]}</strong>
            </div>
            <p class="text-xs text-zinc-300 mb-1">Impact Value: <span class="text-white font-medium">${cloud.value.toFixed(2)}</span></p>
            <p class="text-xs text-zinc-300 mb-1">Cloud Radius: <span class="text-white font-medium">${Math.round(cloud.radius)}m</span></p>
          </div>
        `);

        new mapboxgl.Marker({
          element: markerElement,
          anchor: 'center'
        })
          .setLngLat(cloud.position)
          .setPopup(popup)
          .addTo(map.current);

      } catch (error) {
        console.error('Error adding cloud:', error);
      }
    });

    if (filteredClouds.length > 0 && map.current.getPitch() === 0) {
      setTimeout(() => {
        map.current?.easeTo({
          pitch: 45,
          bearing: -17.6,
          duration: 2000
        });
      }, 1000);
    }
  };

  const handleFullscreen = () => {
    if (!mapContainer.current) return;

    if (!document.fullscreenElement) {
      mapContainer.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const exportMap = async () => {
    if (!map.current || !mapLoaded) {
      console.error('Map not loaded yet');
      return;
    }

    setExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = map.current.getCanvas();
      
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      const exportCanvas = document.createElement('canvas');
      const context = exportCanvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      const scale = 2;
      exportCanvas.width = canvas.width * scale;
      exportCanvas.height = canvas.height * scale;
      
      context.scale(scale, scale);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      
      context.drawImage(canvas, 0, 0);
      
      context.fillStyle = 'rgba(5, 5, 5, 0.1)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      
      context.fillStyle = 'white';
      context.font = 'bold 24px Arial';
      context.textAlign = 'left';
      context.fillText('Emissions Impact Map', 20, 40);
      
      context.font = '14px Arial';
      context.fillStyle = '#a1a1aa';
      context.fillText(`Generated: ${dateStr} ${timeStr}`, 20, 70);
      
      let yPos = 100;
      Object.entries(emissionColors).forEach(([type, color]) => {
        context.fillStyle = color;
        context.beginPath();
        context.arc(20, yPos + 5, 6, 0, Math.PI * 2);
        context.fill();
        
        context.fillStyle = 'white';
        context.font = '12px Arial';
        context.fillText(emissionLabels[type as EmissionType], 35, yPos + 9);
        
        yPos += 25;
      });
      
      context.fillStyle = 'rgba(24, 24, 27, 0.8)';
      context.fillRect(canvas.width - 250, 20, 230, 180);
      
      context.fillStyle = 'white';
      context.font = 'bold 16px Arial';
      context.fillText('Statistics', canvas.width - 240, 45);
      
      context.font = '12px Arial';
      context.fillStyle = '#a1a1aa';
      
      const stats = [
        `Clouds: ${clouds.length}`,
        `Data Points: ${emissionsData.length}`,
        `Filter: ${selectedEmission === 'all' ? 'All' : selectedEmission}`,
        `Period: ${dateRange === 'week' ? '7 Days' : dateRange === 'month' ? '30 Days' : 'All Time'}`,
        `Avg CO₂: ${emissionsData.reduce((sum, d) => sum + d.co2, 0) / emissionsData.length || 0}kg`,
        `Avg Water: ${emissionsData.reduce((sum, d) => sum + d.water, 0) / emissionsData.length || 0}L`
      ];
      
      stats.forEach((stat, i) => {
        context.fillText(stat, canvas.width - 240, 70 + (i * 20));
      });
      
      context.fillStyle = 'rgba(5, 5, 5, 0.7)';
      context.fillRect(0, canvas.height - 30, canvas.width, 30);
      
      context.fillStyle = 'white';
      context.font = '10px Arial';
      context.textAlign = 'center';
      context.fillText('Generated by EcoTrack - Saving the planet one emission at a time', canvas.width / 2, canvas.height - 10);
      
      const link = document.createElement('a');
      const timestamp = `${dateStr}_${timeStr}`;
      link.download = `emissions-map-${timestamp}.png`;
      
      exportCanvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }
        
        const url = URL.createObjectURL(blob);
        link.href = url;
        
        link.click();
        
        URL.revokeObjectURL(url);
        setExporting(false);
        
        alert('✅ Map exported successfully! Check your downloads folder.');
        
      }, 'image/png', 1.0);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Failed to export map. Please try again.');
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:bg-zinc-800/50 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
              <Cloud size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
                Emissions <span className="text-emerald-500">Map</span>
              </h1>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Visualize Your Environmental Impact</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportMap}
              disabled={!mapLoaded || exporting}
              className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={16} className="text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Export Map</span>
                </>
              )}
            </button>
            <button
              onClick={handleFullscreen}
              className="px-4 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:bg-zinc-800/50 transition-colors flex items-center gap-2"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span className="text-sm font-medium">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </motion.header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-20">
          <div className="lg:col-span-8 space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden"
              style={{ height: '600px' }}
            >
              <div className="absolute top-2 left-2 z-10">
                <div className="text-xs bg-black/50 text-white px-2 py-1 rounded">
                  {mapLoaded ? '✅ Map loaded' : '🔄 Loading map...'}
                </div>
              </div>
              
              <div 
                ref={mapContainer}
                className="absolute inset-0 rounded-2xl w-full h-full"
              />
              
              {(!mapLoaded || loading) && (
                <div className="absolute inset-0 bg-zinc-900/90 flex flex-col items-center justify-center z-20">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 border-4 border-zinc-700 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                    <div className="space-y-2">
                      <p className="text-zinc-300 font-medium">Loading map...</p>
                    </div>
                  </div>
                </div>
              )}

              {mapLoaded && (
                <>
                  <div className="absolute top-6 right-6 p-4 bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter size={16} className="text-emerald-400" />
                      <span className="text-sm font-medium text-white">Emission Legend</span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(emissionColors).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-zinc-300">
                            {emissionLabels[type as EmissionType]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Emissions Summary</h3>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(emissionColors).map(([type, color]) => {
                  const total = emissionsData.reduce((sum, data) => sum + (data[type as EmissionType] || 0), 0);
                  const avg = emissionsData.length > 0 ? total / emissionsData.length : 0;
                  
                  return (
                    <div key={type} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                          {emissionIcons[type as EmissionType]}
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase">
                          {type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-2xl font-black text-white mb-1">
                        {avg.toFixed(1)}
                        <span className="text-xs text-zinc-500 ml-1">
                          {type === 'co2' ? 'kg' : type === 'water' ? 'L' : type === 'energy' ? 'kWh' : 'kg'}
                        </span>
                      </p>
                      <p className="text-xs text-zinc-400">Avg per day</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Filter size={16} className="text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Filter Emissions</h3>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedEmission('all')}
                  className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                    selectedEmission === 'all'
                      ? 'bg-emerald-500/20 border-emerald-500/50'
                      : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                      <Layers size={16} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white">All Emissions</p>
                      <p className="text-xs text-zinc-400">Show all impact types</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    selectedEmission === 'all' ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`} />
                </button>

                {Object.entries(emissionColors).map(([type, color]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedEmission(type as EmissionType)}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                      selectedEmission === type
                        ? 'bg-emerald-500/20 border-emerald-500/50'
                        : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        {emissionIcons[type as EmissionType]}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white">{emissionLabels[type as EmissionType]}</p>
                        <p className="text-xs text-zinc-400">
                          {clouds.filter(c => c.type === type).length} locations
                        </p>
                      </div>
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedEmission === type ? color : '#374151' }}
                    />
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Export Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-zinc-300">
                    <span className="text-emerald-400">High-quality PNG</span> with 2x resolution
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-zinc-300">
                    <span className="text-orange-400">Statistics and legend</span> included automatically
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-zinc-300">
                    <span className="text-blue-400">Timestamp</span> added for tracking
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-zinc-300">
                    <span className="text-purple-400">Perfect for reports</span> and presentations
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-zinc-800/30">
                <p className="text-xs text-zinc-500 text-center">
                  File name: emissions-map-YYYY-MM-DD_HH-MM-SS.png
                </p>
              </div>
            </motion.div>

          </div>
        </main>
      </div>

      <style jsx global>{`
        .mapboxgl-map {
          width: 100%;
          height: 100%;
        }
        .mapboxgl-canvas-container {
          width: 100% !important;
          height: 100% !important;
        }
        .mapboxgl-canvas {
          width: 100% !important;
          height: 100% !important;
          background-color: #050505 !important;
        }
        .cloud-marker:hover {
          transform: scale(1.3);
          transition: transform 0.2s ease;
        }
        .mapboxgl-popup-content {
          background: rgba(24, 24, 27, 0.95) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(39, 39, 42, 0.8);
          border-radius: 0.75rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        .mapboxgl-popup-close-button {
          color: #a1a1aa !important;
          font-size: 20px !important;
          padding: 8px !important;
        }
        .mapboxgl-popup-close-button:hover {
          color: #ffffff !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}