import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  LogIn,
  Package,
  ShoppingCart,
  BarChart3,
  Lock,
  FileText,
  Shield,
  KeyRound,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Clock,
  Layers,
  Zap,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Printer,
  Store,
  CreditCard,
  ExternalLink,
  X,
} from 'lucide-react';

interface LandingPageProps {
  onAdminLogin: (password: string) => Promise<{ success: boolean; message?: string }>;
  onStoreLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
}

interface Chapter {
  id: number;
  title: string;
  time: number;
  tag: string;
  badge: string;
  desc: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: 'Store Authentication',
    time: 0,
    tag: '0:00',
    badge: 'Security',
    desc: 'Secure store login with real-time active subscription check and isolated pharmacy database access.',
  },
  {
    id: 2,
    title: 'Store Dashboard',
    time: 21,
    tag: '0:21',
    badge: 'Analytics',
    desc: 'Live daily revenue, total sales count, operational warning badges, and 1-click POS terminal launcher.',
  },
  {
    id: 3,
    title: 'Smart Stock Filters',
    time: 35,
    tag: '0:35',
    badge: 'Inventory',
    desc: 'Instantly isolate medicines below 10 units or expiring within 30 days to avoid emergency stockouts.',
  },
  {
    id: 4,
    title: 'Add Medicine & Categories',
    time: 51,
    tag: '0:51',
    badge: 'Catalog',
    desc: 'Register stock and create custom categories on the fly with automatic batch expiration tracking.',
  },
  {
    id: 5,
    title: 'Rapid POS Billing',
    time: 86,
    tag: '1:26',
    badge: 'Dispensary',
    desc: 'Fast walk-in checkout — customer name and phone are 100% optional for rush-hour dispensary speed.',
  },
  {
    id: 6,
    title: 'Bill History & Invoices',
    time: 108,
    tag: '1:48',
    badge: 'Audit',
    desc: 'Search past transactions by customer or invoice ID and reprint itemized thermal/A4 receipts in one click.',
  },
  {
    id: 7,
    title: 'Super Admin Franchise Portal',
    time: 124,
    tag: '2:04',
    badge: 'Franchise',
    desc: 'Franchise oversight, subscription countdown badges, auto-inactivation upon expiry, and 1-click renewals.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onAdminLogin, onStoreLogin }) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePassword, setStorePassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Easter egg: Click on "MediPOS" 5 times to open Super Admin Login
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    if (window.location.search.includes('admin') || window.location.pathname.includes('admin')) {
      setShowAdminModal(true);
      setShowStoreModal(false);
    }
  }, []);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 500) {
      setClickCount((prev) => {
        const next = prev + 1;
        if (next === 5) {
          setShowAdminModal(true);
          setShowStoreModal(false);
          setErrorMessage('');
          return 0;
        }
        return next;
      });
    } else {
      setClickCount(1);
    }
    setLastClickTime(now);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    const res = await onAdminLogin(adminPassword);
    if (!res.success) {
      setErrorMessage(res.message || 'Invalid password');
    }
    setLoading(false);
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    const res = await onStoreLogin(storeEmail, storePassword);
    if (!res.success) {
      setErrorMessage(res.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  // Video Controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const jumpToChapter = (chapterTime: number, index: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = chapterTime;
    videoRef.current.play();
    setIsPlaying(true);
    setActiveChapterIndex(index);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 182;
    setVideoProgress((cur / dur) * 100);

    // Sync chapter highlight
    let currentIdx = 0;
    for (let i = CHAPTERS.length - 1; i >= 0; i--) {
      if (cur >= CHAPTERS[i].time - 0.5) {
        currentIdx = i;
        break;
      }
    }
    setActiveChapterIndex(currentIdx);
  };

  const fillDemoStore = () => {
    setStoreEmail('store@medipos.com');
    setStorePassword('password123');
  };

  const fillDemoAdmin = () => {
    setAdminPassword('admin');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* Background Radial Glow Effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[800px] -left-40 w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full" />
        <div className="absolute top-[1600px] -right-40 w-[650px] h-[650px] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Top Sticky Navigation */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/75 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                onClick={handleLogoClick}
                className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 cursor-pointer transform hover:scale-105 active:scale-95 transition-transform"
                title="MediPOS (Click 5 times for Admin Access)"
              >
                <Activity className="size-6 text-white" />
              </div>
              <div
                onClick={handleLogoClick}
                className="cursor-pointer select-none"
                title="MediPOS (Click 5 times for Admin Access)"
              >
                <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  Medi<span className="text-blue-400">POS</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Pro
                  </span>
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
              <a href="#features" className="hover:text-blue-400 transition-colors">
                Features
              </a>
              <a href="#demo-video" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
                Live Walkthrough
              </a>
              <a href="#how-it-works" className="hover:text-blue-400 transition-colors">
                Dispensary Flow
              </a>
              <a href="#pricing" className="hover:text-blue-400 transition-colors">
                Subscription
              </a>
              <a href="#faq" className="hover:text-blue-400 transition-colors">
                FAQ
              </a>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => {
                  fillDemoStore();
                  setShowStoreModal(true);
                  setShowAdminModal(false);
                  setErrorMessage('');
                }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
                title="Quick 1-Click Demo Credentials"
              >
                <KeyRound className="size-3.5 text-amber-400" />
                <span>Demo Account</span>
              </button>

              <button
                onClick={() => {
                  setShowStoreModal(true);
                  setShowAdminModal(false);
                  setErrorMessage('');
                }}
                className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] hover:bg-right transition-all duration-300 shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <LogIn className="size-4" />
                <span>Store Login</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-500/30 text-blue-300 text-xs sm:text-sm font-semibold tracking-wide mb-8 shadow-inner shadow-blue-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>PRODUCTION READY MEDICAL DISPENSARY OS</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 font-normal">v2.0 Full MySQL Stack</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.12]">
            Modern POS & Inventory OS for{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Independent Pharmacies
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Accelerate walk-in checkouts with sub-second billing, eliminate catastrophic stockouts with
            automated 30-day expiry radar, and oversee multiple medical franchise locations from a unified terminal.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => {
                setShowStoreModal(true);
                setShowAdminModal(false);
                setErrorMessage('');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transform hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>Launch Store Terminal</span>
              <ArrowRight className="size-5" />
            </button>

            <a
              href="#demo-video"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 shadow-md transition-all cursor-pointer"
            >
              <Play className="size-4 text-emerald-400 fill-emerald-400" />
              <span>Watch 3-Min Walkthrough</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80 text-left">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl sm:text-2xl mb-1">
                <Zap className="size-5" />
                <span>&lt; 10s</span>
              </div>
              <p className="text-xs text-slate-400">Average Walk-in Checkout</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xl sm:text-2xl mb-1">
                <CheckCircle2 className="size-5" />
                <span>100% Optional</span>
              </div>
              <p className="text-xs text-slate-400">Customer Name & Phone</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xl sm:text-2xl mb-1">
                <Clock className="size-5" />
                <span>30-Day Alert</span>
              </div>
              <p className="text-xs text-slate-400">Proactive Expiry Radar</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xl sm:text-2xl mb-1">
                <Shield className="size-5" />
                <span>Auto-Lock</span>
              </div>
              <p className="text-xs text-slate-400">On Subscription Expiry</p>
            </div>
          </div>
        </div>
      </section>

      {/* TUTORIAL VIDEO SHOWCASE SECTION (Featured Centerpiece) */}
      <section id="demo-video" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="size-3.5" />
              <span>Full Screen System Tour</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              See MediPOS in Action
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              Real 1080p live screen walkthrough showcasing the full dispensary workflow from store login to
              inventory filtering, custom categories, rapid checkout, and franchise administration.
            </p>
          </div>

          {/* Video Mockup Window */}
          <div className="relative rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 shadow-[0_25px_80px_rgba(0,0,0,0.6)] overflow-hidden">
            {/* Window Chrome Title Bar */}
            <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
                  https://app.medipos.io/terminal
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
                  <span className="size-1.5 rounded-full bg-blue-400 animate-ping" />
                  1080p Full HD Studio
                </span>
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video bg-black group">
              <video
                ref={videoRef}
                src="/medi_pos_tutorial.mp4"
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted={isMuted}
                loop
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls
              />

              {/* Big Play Button Overlay (when paused) */}
              {!isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-opacity"
                >
                  <div className="size-20 sm:size-24 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 transform hover:scale-110 active:scale-95 transition-all">
                    <Play className="size-10 fill-white translate-x-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Video Timeline Progress */}
            <div className="w-full bg-slate-800 h-1 relative">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 h-1 transition-all duration-200"
                style={{ width: `${videoProgress}%` }}
              />
            </div>

            {/* Interactive Chapter Selector Bar */}
            <div className="p-4 sm:p-6 bg-slate-950/80 border-t border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <Layers className="size-3.5 text-blue-400" />
                  Jump Directly to Chapter
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {CHAPTERS[activeChapterIndex]?.tag} / 3:02
                </span>
              </div>

              {/* Chapter Pill Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {CHAPTERS.map((ch, idx) => {
                  const isActive = activeChapterIndex === idx;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => jumpToChapter(ch.time, idx)}
                      className={`px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/50'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                        <span className={isActive ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                          {ch.tag}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                            isActive ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {ch.badge}
                        </span>
                      </div>
                      <p className="text-xs font-semibold truncate leading-tight">{ch.title}</p>
                    </button>
                  );
                })}
              </div>

              {/* Active Chapter Details Box */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <span className="size-2 rounded-full bg-emerald-400 shrink-0 mt-1 sm:mt-0 animate-pulse" />
                  <div>
                    <span className="text-xs font-bold text-white mr-2">
                      Chapter {activeChapterIndex + 1}: {CHAPTERS[activeChapterIndex]?.title}
                    </span>
                    <span className="text-xs text-slate-400">
                      {CHAPTERS[activeChapterIndex]?.desc}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => jumpToChapter(CHAPTERS[activeChapterIndex].time, activeChapterIndex)}
                  className="shrink-0 text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="size-3" />
                  <span>Replay Chapter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DISPENSARY WORKFLOW (3-Step Fast Checkout) */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Lightning Dispensary Workflow
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              Engineered specifically for peak pharmacy counter traffic. Zero required forms for walk-in patients.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 relative group">
              <div className="size-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-black text-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1-Click Medicine Staging</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Search pharmaceutical stock by brand or generic name. Single-click ‘+’ button instantly stages
                items into the cart with real-time stock limits to prevent overselling.
              </p>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Check className="size-3.5" /> Built-in stock validation
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 relative group">
              <div className="size-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-black text-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Frictionless Walk-in Checkout</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Customer name and telephone number are completely optional. Dispensary staff can immediately select
                Cash, Card, or UPI payment without typing tedious patient records.
              </p>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Check className="size-3.5" /> Optional patient details
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 relative group">
              <div className="size-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 font-black text-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Auto-Decrement & Print</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                The database decrements physical stock quantities instantaneously. A cleanly itemized medical
                receipt launches immediately for thermal 80mm or standard A4 invoice printing.
              </p>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Check className="size-3.5" /> Instant thermal / A4 receipt
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES BENTO GRID */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 bg-slate-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <span>Enterprise Modules</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Everything Your Pharmacy Needs
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              From front-desk counter point of sale to back-office distributor batching and multi-location management.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Bento Card 1 */}
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
              <div className="size-12 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center mb-6">
                <ShoppingCart className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">High-Speed POS Terminal</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Clean, keyboard-friendly counter interface. Real-time subtotal, quantity modification, and support
                for Cash, Card, and QR/UPI payments.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
              <div className="size-12 rounded-xl bg-red-600/10 text-red-400 flex items-center justify-center mb-6">
                <AlertTriangle className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Depletion & Expiry Safeguards</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Smart filter pills automatically isolate medicines below 10 units in bold red and highlight batches
                expiring within 30 days before they spoil on shelves.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
              <div className="size-12 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center mb-6">
                <Package className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Dynamic Category Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Add medicines on the fly with custom categories like Ophthalmic, Antibiotics, or Injectables
                directly from the registration form without switching screens.
              </p>
            </div>

            {/* Bento Card 4 */}
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
              <div className="size-12 rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center mb-6">
                <Shield className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Super Admin Franchise Hub</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Franchise owners track all locations, monitor monthly renewal dues, and enjoy automated account
                deactivation when a license reaches its expiration date.
              </p>
            </div>

            {/* Bento Card 5 */}
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
              <div className="size-12 rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center mb-6">
                <Printer className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Instant Receipt Reprinting</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Complete searchable historical billing archive. Search by bill reference or patient name to inspect
                detailed line-item breakdowns or reprint duplicates.
              </p>
            </div>

            {/* Bento Card 6 */}
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
              <div className="size-12 rounded-xl bg-cyan-600/10 text-cyan-400 flex items-center justify-center mb-6">
                <Lock className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Isolated Store Tenancy</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Multi-tenant database schema ensures each pharmacy location has an isolated inventory, pricing
                catalog, and ledger scope protected by bcrypt credential hashing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SUBSCRIPTION / PRICING TRANSPARENCY */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
            <span>Transparent Licensing</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Simple Monthly Franchise Subscription
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mb-12">
            No percentage cuts per transaction. Fixed monthly renewal fee managed easily by your Super Admin.
          </p>

          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 size-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-center gap-2 mb-6">
              <span className="text-5xl sm:text-6xl font-black text-white">Rs 1,500</span>
              <span className="text-slate-400 font-medium">/ store / month ($49 USD)</span>
            </div>

            <p className="text-slate-300 text-sm max-w-lg mx-auto mb-8">
              Full access for unlimited cashiers, unlimited medicine catalogs, automated 30-day expiry notifications,
              and thermal invoice printing.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left mb-8 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-400 shrink-0" />
                <span>Unlimited Billing & Invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-400 shrink-0" />
                <span>Automated Expiry Radar</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-400 shrink-0" />
                <span>Dynamic Custom Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-400 shrink-0" />
                <span>1-Click +30D Renewal Admin</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowStoreModal(true);
                setShowAdminModal(false);
                setErrorMessage('');
              }}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition cursor-pointer"
            >
              <span>Launch Store Terminal</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Everything you need to know about setting up and running MediPOS.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Are patient name and phone number mandatory during billing?',
                a: 'No! Unlike traditional enterprise software, MediPOS treats customer name and phone numbers as completely optional. You can generate a bill in under 5 seconds for fast walk-in dispensary customers.',
              },
              {
                q: 'What happens when a medical store’s subscription expires?',
                a: 'The system automatically marks the store’s account as inactive upon reaching the expiration date. Inactive or expired stores are immediately blocked from logging in until renewed by the Super Admin.',
              },
              {
                q: 'Can the Super Admin extend subscriptions easily?',
                a: 'Yes. Inside the Super Admin portal, administrators can click one-click renewal extension buttons (+30 Days, +3 Months, +1 Year) to instantly restore or extend active status without manual date math.',
              },
              {
                q: 'Can I create custom medicine categories like Ophthalmic or Injectables?',
                a: 'Yes. When adding new inventory, the category dropdown includes a prominent "+ Add New Category..." option that allows immediate on-the-fly category creation without navigating away.',
              },
              {
                q: 'Can historical bills and invoices be reprinted?',
                a: 'Yes. Every transaction is logged permanently in the Bill History ledger. You can search by customer name, phone, or bill ID and reprint the thermal receipt at any time.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-white hover:text-blue-400 transition cursor-pointer"
                  >
                    <span className="text-base sm:text-lg">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="size-5 text-blue-400 shrink-0" />
                    ) : (
                      <ChevronDown className="size-5 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-slate-950 text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div
              onClick={handleLogoClick}
              className="size-8 rounded-lg bg-blue-600 flex items-center justify-center cursor-pointer"
              title="MediPOS"
            >
              <Activity className="size-4 text-white" />
            </div>
            <span
              onClick={handleLogoClick}
              className="text-lg font-bold text-white cursor-pointer select-none"
            >
              MediPOS <span className="text-xs text-slate-500 font-normal">v2.0</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#demo-video" className="hover:text-white transition">
              Video Walkthrough
            </a>
            <a href="#how-it-works" className="hover:text-white transition">
              Dispensary Flow
            </a>
            <a href="#pricing" className="hover:text-white transition">
              Pricing
            </a>
            <button
              onClick={() => {
                setShowAdminModal(true);
                setShowStoreModal(false);
                setErrorMessage('');
              }}
              className="hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
              title="Super Admin Portal Access"
            >
              <Shield className="size-3" />
              <span>Admin Portal</span>
            </button>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} MediPOS. All rights reserved.
          </p>
        </div>
      </footer>

      {/* SUPER ADMIN LOGIN MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-left">
            <button
              onClick={() => {
                setShowAdminModal(false);
                setAdminPassword('');
                setErrorMessage('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Shield className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Super Admin Portal</h2>
                <p className="text-xs text-slate-400">Master franchise license & store controls</p>
              </div>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Admin Master Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-white outline-none transition text-sm"
                  placeholder="Enter admin password (demo: admin)"
                  required
                  autoFocus
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
                  {errorMessage}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  Fill Demo
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition disabled:opacity-50 text-sm shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign In as Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STORE LOGIN MODAL */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-left">
            <button
              onClick={() => {
                setShowStoreModal(false);
                setStoreEmail('');
                setStorePassword('');
                setErrorMessage('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Store className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Store Terminal Login</h2>
                <p className="text-xs text-slate-400">Secure dispensary & inventory access</p>
              </div>
            </div>

            <form onSubmit={handleStoreSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Store Email
                </label>
                <input
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-white outline-none transition text-sm"
                  placeholder="store@medipos.com"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={storePassword}
                  onChange={(e) => setStorePassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-white outline-none transition text-sm"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
                  {errorMessage}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={fillDemoStore}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  Fill Demo
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition disabled:opacity-50 text-sm shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  {loading ? 'Validating Subscription...' : 'Sign In to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
