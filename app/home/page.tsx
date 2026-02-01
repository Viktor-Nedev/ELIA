"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import {
  Globe,
  Sparkles,
  Target,
  Users,
  Brain,
  LineChart,
  Award,
  Shield,
  Zap,
  ChevronRight,
  ArrowRight,
  Code,
  Server,
  Mail,
  Github,
  Linkedin
} from "lucide-react";

async function getOrbitControls() {
  const module = await import('three/examples/jsm/controls/OrbitControls.js');
  return module.OrbitControls;
}

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initScene = async () => {
      const OrbitControls = await getOrbitControls();
      
      const scene = new THREE.Scene();
      
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
      directionalLight.position.set(5, 3, 5);
      scene.add(directionalLight);

      const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x2F4F4F, 0.3);
      scene.add(hemisphereLight);

      const starGeometry = new THREE.BufferGeometry();
      const starCount = 5000;
      const starPositions = new Float32Array(starCount * 3);
      const starSizes = new Float32Array(starCount);
      const starColors = new Float32Array(starCount * 3);

      for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        const radius = 100 + Math.random() * 900;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i3 + 2] = radius * Math.cos(phi);
        
        starSizes[i] = Math.random() * 1.5 + 0.5;
        
        const starType = Math.random();
        if (starType < 0.7) {
          starColors[i3] = 1; starColors[i3 + 1] = 1; starColors[i3 + 2] = 1;
        } else if (starType < 0.85) {
          starColors[i3] = 0.8; starColors[i3 + 1] = 0.9; starColors[i3 + 2] = 1;
        } else {
          starColors[i3] = 1; starColors[i3 + 1] = 0.9; starColors[i3 + 2] = 0.7;
        }
      }

      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

      const starMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        sizeAttenuation: true
      });

      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);

      camera.position.set(2, 5, 4);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.minDistance = 1.5;
      controls.maxDistance = 4;
      controls.minPolarAngle = Math.PI / 6;
      controls.maxPolarAngle = Math.PI / 2;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      const loader = new GLTFLoader();
      
loader.load(
  '/earth.glb',
  (gltf) => {
    const earth = gltf.scene;

    // Променихме скалирането и позиционирането
    earth.scale.set(2, 2, 2); // Увеличаваме мащаба
    earth.position.set(0, 0, 0); // Центрираме в началото

    // Обработка на материалите
    earth.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({
          map: (mesh.material as any).map || null,
          roughness: 0.8,
          metalness: 0.2,
          emissive: new THREE.Color(0x000000),
          emissiveIntensity: 0
        });
      }
    });

    scene.add(earth);

    // Промяна на позицията на камерата
    camera.position.set(0, 0, 3); // По-близо до планетата

    setLoading(false);
    setProgress(100);

    const animate = () => {
      requestAnimationFrame(animate);
      earth.rotation.y += 0.003; // Малко по-бързо въртене
      stars.rotation.y += 0.0005;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();
  },
  (xhr) => {
    // Прогрес при зареждане
    const progress = (xhr.loaded / xhr.total) * 100;
    setProgress(progress);
  },
  (error) => {
    console.error('Error loading Earth model:', error);
    setLoading(false);
  }
);


      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
      };
    };

    initScene().catch(console.error);
  }, []);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Diary",
      description: "Our AI models analyze your daily activities and automatically calculate their environmental footprint.",
      color: "from-emerald-500 to-green-500"
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: "Dynamic Analytics",
      description: "Track your progress with interactive charts and detailed statistics for CO₂, water and energy.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Challenges",
      description: "Personalized AI-generated challenges tailored to your environmental habits.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Rewards & Streaks",
      description: "Earn badges and maintain streaks for every consecutive day of eco-friendly action.",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Social Community",
      description: "Compete with friends and see your position in the leaderboard of the most eco-conscious users.",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Global Impact",
      description: "See how your actions contribute to global environmental improvement.",
      color: "from-teal-500 to-emerald-500"
    }
  ];

  const stats = [
    { value: "15K+", label: "Active Users", color: "text-emerald-400" },
    { value: "750+", label: "Tons CO₂ Saved", color: "text-blue-400" },
    { value: "2.5M+", label: "Liters Water Saved", color: "text-cyan-400" },
    { value: "50K+", label: "Eco Actions Logged", color: "text-green-400" }
  ];

  const team = [
    {
      name: "Viktor Nedev",
      role: "Frontend Developer & UI/UX Designer",
      description: "Responsible for the visual design, user interface, and frontend architecture of ELIA.",
      skills: ["React", "Next.js", "Three.js", "TypeScript"],
      social: {
        github: "https://github.com/Viktor-Nedev",
      }
    },
    {
      name: "Boris Savyanov",
      role: "Backend Developer & System Architect",
      description: "Handles the backend infrastructure, database architecture, and overall system functionality.",
      skills: ["Node.js", "Firebase", "AI Integration", "DevOps"],
      social: {
        github: "https://github.com/BorisSavianov",
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="relative h-screen overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Loading Earth model... {Math.round(progress)}%</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/70 to-gray-900"></div>
        
        <div className="relative h-full flex items-center justify-center z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  delay: 0.5
                }}
                className="relative inline-block mb-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 rounded-full blur-3xl opacity-30"></div>
                <h1 className="relative text-7xl md:text-9xl font-black bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  ELIA
                </h1>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 1, duration: 1 }}
                  className="h-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mt-4"
                />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-2xl md:text-3xl font-bold text-white mb-2"
              >
                Environmental Lifecycle Intelligence Assistant
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              >
                Your personal AI assistant for an environmentally conscious lifestyle.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
              >
                <Link href="#login-button">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3 group"
                  >
                    <Sparkles className="w-6 h-6" />
                    Start Your Journey
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </motion.button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-16 max-w-3xl mx-auto"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 + index * 0.1 }}
                    className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-sm"
                  >
                    <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-sm text-gray-400 mt-2">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </header>

      <main>
        <section id="our-mission" className="py-24 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/30 border border-emerald-700/50 rounded-full mb-4">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Our Mission</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Building a Sustainable Future Through Technology
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                ELIA was created with one clear goal: to make sustainable living accessible.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  In a world facing unprecedented environmental challenges, we believe that individual actions matter.
                </p>
                <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                  ELIA bridges this gap by transforming abstract environmental concepts into concrete daily actions.
                </p>
                <div className="space-y-4">
                  {[
                    "Democratizing environmental awareness through technology",
                    "Making sustainability data accessible and understandable",
                    "Creating actionable insights from complex environmental data",
                    "Building a community committed to positive environmental change"
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-gray-300">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 mb-4">
                      <Globe className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Core Principles</h3>
                    <p className="text-gray-400">The foundation of everything we build</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { title: "Data Accuracy", desc: "Precise environmental impact calculations" },
                      { title: "User Privacy", desc: "Secure and transparent data handling" },
                      { title: "Scientific Integrity", desc: "Based on verified environmental research" },
                      { title: "Continuous Improvement", desc: "Regular updates with latest scientific findings" }
                    ].map((principle, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-xl">
                        <div className="w-8 h-8 bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{principle.title}</h4>
                          <p className="text-sm text-gray-400">{principle.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-700/50 rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">Features</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Powerful Tools for Sustainable Living
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Combining artificial intelligence, interactive visualization, and gamification.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-8 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-900/20 transition-all duration-300 h-full">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-6`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="py-24 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-700/50 rounded-full mb-4">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-purple-400 uppercase tracking-wider">Development Team</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Meet the Team Behind ELIA
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Passionate innovators united by the mission to make sustainable living accessible.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="group"
                >
                  <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-8 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-900/20 transition-all duration-300">
                    <div className="flex items-start gap-6 mb-6">
                      <div className={`relative ${index === 0 ? 'bg-gradient-to-br from-emerald-500 to-blue-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'} p-1 rounded-2xl`}>
                        <div className="w-20 h-20 bg-gray-900 rounded-xl flex items-center justify-center">
                          {index === 0 ? (
                            <Code className="w-10 h-10 text-white" />
                          ) : (
                            <Server className="w-10 h-10 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{member.name}</h3>
                        <p className="text-emerald-400 font-medium">{member.role}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-6 leading-relaxed">{member.description}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {member.skills.map((skill, skillIndex) => (
                        <span key={skillIndex} className="px-3 py-1 bg-gray-900 text-gray-300 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      {Object.entries(member.social).map(([platform, link]) => (
                        <motion.a
                          key={platform}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          href={platform === 'email' ? `mailto:${link}` : link}
                          className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center hover:bg-emerald-900/30 hover:text-emerald-400 text-gray-400 transition-all"
                        >
                          {platform === 'github' && <Github className="w-4 h-4" />}
                          {platform === 'linkedin' && <Linkedin className="w-4 h-4" />}
                          {platform === 'email' && <Mail className="w-4 h-4" />}
                        </motion.a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-br from-emerald-900/20 via-blue-900/20 to-emerald-900/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-3xl p-12 shadow-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-700/50 rounded-full mb-6">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Get Started</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Start Your Sustainability Journey Today
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join our growing community of individuals making real changes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/signup" id="login-button">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
                    >
                      <Sparkles className="w-6 h-6" />
                      Create Account
                    </motion.button>
                  </Link>
                  <Link href="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gray-800 border border-gray-700 rounded-full font-bold text-gray-300 text-lg hover:bg-gray-700 transition-all"
                    >
                      Sign In
                    </motion.button>
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mt-6">
                  No credit card required • No commitment • 100% free
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full blur-lg opacity-75"></div>
                <div className="relative bg-gray-900 p-2 rounded-full">
                  <Globe className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">ELIA</div>
                <div className="text-sm text-gray-400">Environmental Lifecycle Intelligence Assistant</div>
              </div>
            </div>

            <div className="text-sm text-gray-400 text-center">
              Building a more sustainable future through technology
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                © 2026 ELIA. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}