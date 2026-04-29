import React, { useState, useEffect, useRef } from 'react';
import { auth, db, handleFirestoreError, OperationType, seedEvents } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, onSnapshot, query, where, updateDoc, arrayUnion, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  Trash, 
  Wind, 
  Award, 
  Camera, 
  MapPin, 
  Send, 
  User, 
  LogOut,
  Calendar,
  CheckCircle2,
  Users,
  Truck,
  Plus,
  QrCode,
  Info,
  BarChart3,
  Trophy,
  Target,
  Flame,
  Leaf,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Zap,
  Search,
  Menu,
  LayoutGrid,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { UserProfile, ReportType, EnvironmentalReport, EcoEvent, GeoLocation, WasteTransport } from '../types';

const HelpStep = ({ number, title, text }: { number: string; title: string; text: string }) => (
  <div className="flex gap-4">
    <div className="w-8 h-8 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center text-xs font-black text-slate-500">
      {number}
    </div>
    <div>
      <h4 className="text-sm font-black text-slate-700 leading-none mb-1">{title}</h4>
      <p className="text-[11px] font-medium text-slate-400">{text}</p>
    </div>
  </div>
);

const DrawerItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
  >
    <div className="text-slate-400">{icon}</div>
    <span className="text-sm font-black tracking-tight">{label}</span>
  </button>
);

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [sending, setSending] = useState(false);
  const [events, setEvents] = useState<EcoEvent[]>([]);
  const [transports, setTransports] = useState<WasteTransport[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [recentReports, setRecentReports] = useState<EnvironmentalReport[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBulkyWasteModal, setShowBulkyWasteModal] = useState(false);
  const [transportView, setTransportView] = useState<'transport' | 'containers'>('transport');
  const [showTransportDropdown, setShowTransportDropdown] = useState(false);
  const [activePartnerCategory, setActivePartnerCategory] = useState<string>('Спортски настани');
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const partnerLogos: Record<string, { name: string; url: string }[]> = {
    'Спортски настани': [
      { name: 'ФК Вардар', url: 'https://upload.wikimedia.org/wikipedia/en/c/cc/FK_Vardar_logo.png' },
      { name: 'РК Вардар', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/RK_Vardar_logo.svg/1200px-RK_Vardar_logo.svg.png' },
      { name: 'МЗТ Скопје', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/KK_MZT_Skopje_logo.svg/1200px-KK_MZT_Skopje_logo.svg.png' },
      { name: 'Работнички', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/KK_Rabotni%C4%8Dki_logo.svg/1200px-KK_Rabotni%C4%8Dki_logo.svg.png' }
    ],
    'Фестивали': [
      { name: 'Таксират', url: 'https://taksirat.mk/wp-content/uploads/2021/11/Taksirat-Logo-Black.png' },
      { name: 'Д Фестивал', url: 'https://dfestival.mk/wp-content/uploads/2020/03/Dfes-Logo-White-BG.png' },
      { name: 'Skopje Jazz', url: 'https://www.skopjejazzfest.com.mk/images/logo_sjf.gif' },
      { name: 'ОфФест', url: 'https://www.offest.com.mk/images/logo_offest.gif' }
    ],
    'Театри': [
      { name: 'МНТ', url: 'https://mnt.mk/images/logo-mnt.png' },
      { name: 'Драмски Театар', url: 'https://dramskiteatar.com.mk/wp-content/uploads/2021/04/Dramski-logo.png' },
      { name: 'Театар Комедија', url: 'https://teatarkomedija.mk/wp-content/themes/teatar/assets/images/logo-footer.png' },
      { name: 'Детски Театар', url: 'https://tdm.com.mk/templates/tdm/images/logo.png' }
    ],
    'Музеи': [
      { name: 'Град Скопје', url: 'https://mgsk.mk/wp-content/uploads/2019/04/cropped-logo-mgsk.png' },
      { name: 'Археолошки', url: 'https://amm.org.mk/wp-content/uploads/2019/11/logo-amm-white.png' },
      { name: 'МСУ', url: 'https://msu.mk/wp-content/uploads/2022/02/MSU_logo_black-1.png' },
      { name: 'Холокауст', url: 'https://holocaustfund.org.mk/wp-content/uploads/2019/05/cropped-logo-new-1.png' }
    ]
  };

  const createEvent = async () => {
    if (!auth.currentUser) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'events'), {
        userId: auth.currentUser.uid,
        title: eventTitle,
        description,
        date: new Date(eventDate),
        location: capacity || 'Скопје', // reusing capacity state as location for simplified form
        pointsReward: 50,
        participants: [auth.currentUser.uid]
      });
      setSuccessMessage("Вашата еко-акција е креирана! 🌳");
      setEventTitle('');
      setDescription('');
      setEventDate('');
      setCapacity('');
      setShowEventForm(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'events');
    } finally {
      setSending(false);
    }
  };

  const refreshLocation = () => {
    if (!("geolocation" in navigator)) {
      setSuccessMessage("Вашиот уред не поддржува ГПС. ❌");
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    setSuccessMessage("Ажурирање на локација... 📡");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setSuccessMessage("Локацијата е ажурирана! ✅");
        setTimeout(() => setSuccessMessage(null), 2000);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setSuccessMessage("Неуспешно лоцирање. Проверете ГПС. ⚠️");
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    seedEvents();

    const unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${auth.currentUser?.uid}`));

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      }, (error) => {
        console.error("Error getting location", error);
      });
    }

    const qEvents = query(collection(db, 'events'));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as EcoEvent)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'events'));

    // User specific stats
    const qUserReports = query(collection(db, 'reports'), where('userId', '==', auth.currentUser.uid));
    const unsubUserReports = onSnapshot(qUserReports, (snap) => {
      setMyStats(prev => ({ ...prev, photos: snap.size }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'reports'));

    const qUserEvents = query(collection(db, 'events'), where('participants', 'array-contains', auth.currentUser.uid));
    const unsubUserEvents = onSnapshot(qUserEvents, (snap) => {
      setMyStats(prev => ({ ...prev, joined: snap.size }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'events'));

    const qTransports = query(collection(db, 'transports'), where('status', '==', 'active'), orderBy('timestamp', 'desc'), limit(10));
    const unsubTransports = onSnapshot(qTransports, (snap) => {
      setTransports(snap.docs.map(d => ({ id: d.id, ...d.data() } as WasteTransport)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transports'));

    // Recent reports query
    const typeMap: Record<string, string> = { dumps: 'dump', containers: 'container', air: 'air' };
    const qReports = query(
      collection(db, 'reports'), 
      where('type', '==', typeMap[activeTab] || 'dump'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const unsubReports = onSnapshot(qReports, (snap) => {
      setRecentReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'reports'));

    return () => {
      unsubUser();
      unsubEvents();
      unsubReports();
      unsubTransports();
      unsubUserReports();
      unsubUserEvents();
    };
  }, [activeTab]);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitReport = async () => {
    if (!auth.currentUser || !location) return;
    
    setSending(true);
    try {
      const typeMap: Record<string, 'dump' | 'container' | 'air'> = {
        dumps: 'dump',
        containers: 'container',
        air: 'air'
      };

      const path = 'reports';
      await addDoc(collection(db, path), {
        type: typeMap[activeTab],
        userId: auth.currentUser.uid,
        photoUrl: photo || '', // In production, upload to Storage first
        location,
        description,
        timestamp: serverTimestamp(),
        pointsAwarded: true
      });

      // Award points
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        points: (profile?.points || 0) + 5
      });

      setSuccessMessage("Успешно пријавено! Добивте 5 поени. 🎉");
      setPhoto(null);
      setDescription('');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reports');
    } finally {
      setSending(false);
    }
  };

  const offerTransport = async () => {
    if (!auth.currentUser || !location) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'transports'), {
        userId: auth.currentUser.uid,
        userName: profile?.displayName || 'Корисник',
        location,
        description,
        capacity,
        timestamp: serverTimestamp(),
        status: 'active',
        interestedUsers: []
      });
      
      setSuccessMessage("Вашата понуда за превоз е објавена! 🚛");
      setDescription('');
      setCapacity('');
      setShowOfferForm(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'transports');
    } finally {
      setSending(false);
    }
  };

  const joinTransport = async (transportId: string) => {
    if (!auth.currentUser) return;
    try {
      const transportRef = doc(db, 'transports', transportId);
      await updateDoc(transportRef, {
        interestedUsers: arrayUnion(auth.currentUser.uid)
      });
      setSuccessMessage("Го известивте возачот дека имате отпад! 🤝");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `transports/${transportId}`);
    }
  };

  const joinEvent = async (eventId: string, points: number) => {
    if (!auth.currentUser) return;
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        participants: arrayUnion(auth.currentUser.uid)
      });

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        points: (profile?.points || 0) + points
      });

      setSuccessMessage(`Се пријавивте за еко-акција! Добивте ${points} поени. 🌿`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `events/${eventId}`);
    }
  };

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState({ reports: 0, actions: 0, points: 0 });

  const tabs = ['home', 'dumps', 'containers', 'air', 'transport', 'actions', 'stats'];
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAchievementsDropdownOpen, setIsAchievementsDropdownOpen] = useState(false);
  const [myStats, setMyStats] = useState({ photos: 0, joined: 0, created: 0 });

  useEffect(() => {
    if (!auth.currentUser) return;
    // Fetch top 5 users for leaderboard
    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      // If we don't have enough users, add some "Skopje Champions" as demo data
      if (usersList.length < 5) {
        const dummyUsers = [
          { id: 'dummy-1', displayName: 'Марија Еко', points: 2850, photoURL: 'https://i.pravatar.cc/150?u=marija' },
          { id: 'dummy-2', displayName: 'Марко Чист', points: 2420, photoURL: 'https://i.pravatar.cc/150?u=marko' },
          { id: 'dummy-3', displayName: 'Петар Рециклирај', points: 1980, photoURL: 'https://i.pravatar.cc/150?u=petar' },
          { id: 'dummy-4', displayName: 'Ана Зелена', points: 1560, photoURL: 'https://i.pravatar.cc/150?u=ana' },
          { id: 'dummy-5', displayName: 'Стефан Воздух', points: 1240, photoURL: 'https://i.pravatar.cc/150?u=stefan' },
        ];
        
        // Take real users and pad with dummies to reach 5, then sort again
        const combined = [...usersList];
        dummyUsers.forEach(d => {
          if (combined.length < 5 && !combined.some(u => u.displayName === d.displayName)) {
            combined.push(d);
          }
        });
        usersList = combined.sort((a, b) => (b.points || 0) - (a.points || 0));
      }

      setLeaderboard(usersList);
      
      // Calculate global impact (demo logic but based on real user points)
      const totalP = usersList.reduce((acc, curr) => acc + (curr.points || 0), 0);
      setGlobalStats(prev => ({ ...prev, points: totalP }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    // Global stats from reports and events
    const qReports = query(collection(db, 'reports'));
    const qEvents = query(collection(db, 'events'));
    
    const unSubR = onSnapshot(qReports, (snapshot) => setGlobalStats(prev => ({ ...prev, reports: snapshot.size })), (err) => handleFirestoreError(err, OperationType.GET, 'reports'));
    const unSubE = onSnapshot(qEvents, (snapshot) => setGlobalStats(prev => ({ ...prev, actions: snapshot.size })), (err) => handleFirestoreError(err, OperationType.GET, 'events'));
    
    return () => { unSubR(); unSubE(); };
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Personal stats calculation
    const qMyReports = query(collection(db, 'reports'), where('userId', '==', auth.currentUser.uid));
    const unSubMyR = onSnapshot(qMyReports, (snap) => {
      setMyStats(prev => ({ ...prev, photos: snap.size }));
    });

    const qMyEvents = query(collection(db, 'events'));
    const unSubMyE = onSnapshot(qMyEvents, (snap) => {
      const docs = snap.docs.map(d => d.data());
      const joined = docs.filter(d => d.participants?.includes(auth.currentUser?.uid) && d.userId !== auth.currentUser?.uid).length;
      const created = docs.filter(d => d.userId === auth.currentUser?.uid).length;
      setMyStats(prev => ({ ...prev, joined, created }));
    });

    return () => { unSubMyR(); unSubMyE(); };
  }, []);

  const handleSwipe = (direction: number) => {
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < tabs.length) {
      setActiveTab(tabs[nextIndex]);
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'home') {
      return (
        <motion.div
          key="home-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 pb-24"
        >
          <div className="bento-card p-8 bg-gradient-to-br from-emerald-600 to-teal-500 text-white relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/30">
                <Leaf size={32} />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">ЕкоСкопје</h1>
              <p className="text-xs font-bold text-emerald-50 uppercase tracking-[0.2em] opacity-80">Чист град, среќни луѓе</p>
            </div>
          </div>

          <div className="bento-card p-6 bg-white border-slate-100">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Info size={14} className="text-emerald-500" />
              За апликацијата
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Добредојдовте во ЕкоСкопје - вашата алатка за градење почист и позелен град. Преку оваа апликација можете активно да учествувате во подобрувањето на животната средина во вашето соработништво со локалните заедници и институции.
            </p>
          </div>

          <div className="space-y-4">
            <div className="px-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Пријави проблем</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Изберете категорија на проблем кој сакате да го пријавите:</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveTab('dumps')}
                className="bento-card p-5 bg-white hover:bg-red-50 border-red-100/50 group transition-all text-left"
              >
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <Trash2 size={20} />
                </div>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Депонии</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Диви депонии и ѓубре</p>
              </button>

              <button 
                onClick={() => setActiveTab('containers')}
                className="bento-card p-5 bg-white hover:bg-blue-50 border-blue-100/50 group transition-all text-left"
              >
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <Trash size={20} />
                </div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Контејнери</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Полни и оштетени</p>
              </button>

              <button 
                onClick={() => setActiveTab('air')}
                className="bento-card p-5 bg-white hover:bg-orange-50 border-orange-100/50 group transition-all text-left"
              >
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <Wind size={20} />
                </div>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Воздух</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Загадување и миризба</p>
              </button>

              <button 
                onClick={() => setActiveTab('transport')}
                className="bento-card p-5 bg-white hover:bg-indigo-50 border-indigo-100/50 group transition-all text-left"
              >
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <Truck size={20} />
                </div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Отпад</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Кабаст и рециклиран</p>
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeTab === 'transport') {
      return (
        <motion.div
          key="transport-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 pb-24"
        >
        <div className={`bento-card p-6 text-center relative bg-white border-${theme}-100 z-10`}>
          <button 
            onClick={() => setShowBulkyWasteModal(true)}
            className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 hover:text-indigo-600 transition-colors z-20"
          >
            <HelpCircle size={18} />
          </button>
          <div className="relative z-10 text-center">
            <div className={`w-10 h-10 bg-${theme}-50 text-${theme}-600 rounded-xl flex items-center justify-center mx-auto mb-3 border border-${theme}-100 shadow-sm`}>
              <Truck className="w-5 h-5" />
            </div>
            <h2 className={`text-xl font-black tracking-tight text-slate-800 leading-none`}>
              Кабаст отпад
            </h2>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-2 text-${theme}-600/70`}>
              {transportView === 'transport' ? 'Одиш до контејнери? Помогни на другите!' : 'Пронајди ги најблиските контејнери за кабаст отпад'}
            </p>
            
            {transportView === 'transport' ? (
              <>
                {!showOfferForm ? (
                  <div className="flex flex-col gap-2 mt-4 max-w-[220px] mx-auto">
                    <button 
                      onClick={() => setShowOfferForm(true)}
                      className={`px-5 py-3 bg-${theme}-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 w-full active:scale-95 transition-transform`}
                    >
                      <Plus size={16} />
                      Понуди превоз
                    </button>
                    <div className="relative w-full">
                      <button 
                        onClick={() => setShowTransportDropdown(!showTransportDropdown)}
                        className={`px-5 py-3 bg-white text-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 w-full border border-slate-100 active:scale-95 transition-transform`}
                      >
                        <Search size={16} className="text-blue-600" />
                        Пронајди
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${showTransportDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {showTransportDropdown && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setShowTransportDropdown(false)}
                          >
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-3 w-full max-w-[240px] overflow-hidden relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="px-4 py-2 mb-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Пронајди:</p>
                              </div>
                              <div className="space-y-1.5">
                                <button 
                                  onClick={() => { 
                                    setTransportView('transport'); 
                                    setShowTransportDropdown(false);
                                    setTimeout(() => {
                                      const el = document.getElementById('active-transports');
                                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 100);
                                  }}
                                  className={`w-full px-4 py-3 text-left flex items-center gap-3 rounded-2xl transition-all ${transportView === 'transport' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${transportView === 'transport' ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <Truck size={16} />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Превоз</span>
                                </button>
                                <button 
                                  onClick={() => { setTransportView('containers'); setShowTransportDropdown(false); }}
                                  className={`w-full px-4 py-3 text-left flex items-center gap-3 rounded-2xl transition-all ${transportView === 'containers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${transportView === 'containers' ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
                                    <div className="w-4 h-4 rounded-sm border-2 border-current" />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Контејнери</span>
                                </button>
                              </div>
                              <button 
                                onClick={() => setShowTransportDropdown(false)}
                                className="w-full mt-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                Затвори
                              </button>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowOfferForm(false)}
                    className={`mt-4 px-5 py-2.5 bg-white text-${theme}-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 mx-auto border border-${theme}-100`}
                  >
                    Откажи
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <button 
                  onClick={() => setTransportView('transport')}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors mt-4"
                >
                  <ArrowLeft size={14} />
                  Назад кон отпад
                </button>
                
                <div className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-inner group relative">
                  <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Систем активен</span>
                  </div>
                  
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m13!1m3!1d47453.77884144577!2d21.393437299999997!3d42.00035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x135415a58c9aa2a5%3A0xb2ed883ee3f6381e!2sSkopje!5e0!3m2!1sen!2smk!4v1714387000000!5m2!1sen!2smk" 
                    width="100%" 
                    height="350" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale hover:grayscale-0 transition-all duration-700"
                  ></iframe>
                  
                  <div className="bg-white p-4 border-t border-slate-50 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Локации на контејнери (Демо)</span>
                      </div>
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">СКОПЈЕ</span>
                    </div>
                    
                    <div className="flex gap-2">
                       <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Близок контејнер</p>
                          <p className="text-[10px] font-black text-slate-700 mt-1 uppercase">Центар - Маалски</p>
                       </div>
                       <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Статус</p>
                          <p className="text-[10px] font-black text-emerald-600 mt-1 uppercase">Слободно</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

          <AnimatePresence>
            {transportView === 'transport' && showOfferForm && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bento-card p-6 space-y-4 border-2 border-blue-200">
                  <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Нова понуда</h3>
                  
                  <button 
                    onClick={refreshLocation}
                    className="w-full flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white text-blue-600 flex items-center justify-center shadow-sm">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Твоја Локација (Притисни за рефреш)</p>
                       <p className="text-[11px] font-bold text-slate-600 truncate">
                         {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Лоцирање...'}
                       </p>
                    </div>
                  </button>

                  <textarea 
                    placeholder="На пр: Одам од Карпош до центар..."
                    className="w-full h-24 px-5 py-4 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none border border-slate-100 text-sm font-medium"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <input 
                    type="text"
                    placeholder="Капацитет (на пр: цел пикап празeн)"
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-slate-100 text-sm font-medium"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                  <button 
                    onClick={offerTransport}
                    disabled={sending || !description || !capacity}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100"
                  >
                    ОБЈАВИ ПОНУДА
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {transportView === 'transport' && (
            <div className="space-y-4" id="active-transports">
              <h3 className="font-bold text-slate-700 px-2 uppercase text-xs tracking-widest flex items-center gap-2">
                <Truck size={14} className="text-blue-600" />
                Активни превози во близина
              </h3>
              
              {transports.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-100">
                  <Truck className="mx-auto mb-4 w-12 h-12 opacity-10" />
                  <p className="text-xs font-bold uppercase tracking-tighter">Нема активни понуди во моментов.</p>
                </div>
              ) : (
                transports.map((transport) => (
                  <motion.div 
                    key={transport.id}
                    className="bento-card p-5 group transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm leading-none">{transport.userName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Организатор</p>
                        </div>
                      </div>
                      <div className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-[9px] uppercase tracking-widest">
                         {transport.status}
                      </div>
                    </div>

                    <div className="space-y-3 px-1">
                      <p className="text-xs text-slate-600 font-medium">"{transport.description}"</p>
                      <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <Plus size={14} className="text-blue-500" />
                          <span className="text-[10px] font-black text-slate-500 uppercase">Капацитет: {transport.capacity}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                          <MapPin size={12} className="text-blue-400" />
                          <span>Скопје</span>
                       </div>
                       <button 
                          disabled={transport.userId === auth.currentUser?.uid || transport.interestedUsers.includes(auth.currentUser?.uid || '')}
                          onClick={() => joinTransport(transport.id)}
                          className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${
                            transport.interestedUsers.includes(auth.currentUser?.uid || '')
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                          }`}
                       >
                          {transport.userId === auth.currentUser?.uid 
                            ? 'Ваша понуда' 
                            : transport.interestedUsers.includes(auth.currentUser?.uid || '') 
                            ? 'Веќе известено' 
                            : 'ПРАТИ ОТПАД'}
                       </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>
      );
    }

    if (activeTab === 'actions') {
      return (
        <motion.div 
          key="actions-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 pb-24"
        >
        <div className={`bento-card p-6 text-center relative overflow-hidden bg-white border-${theme}-100`}>
          <div className="relative z-10 text-center">
            <div className={`w-10 h-10 bg-${theme}-50 text-${theme}-600 rounded-xl flex items-center justify-center mx-auto mb-3 border border-${theme}-100 shadow-sm`}>
              <Award size={20} />
            </div>
            <h2 className={`text-xl font-black tracking-tight text-slate-800 leading-none`}>
              Еко-Акции
            </h2>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-2 text-${theme}-600/70`}>
              Биди дел од промената во Скопје
            </p>
            
            <div className="flex gap-3 justify-center mt-5">
              {!showEventForm ? (
                <button 
                  onClick={() => setShowEventForm(true)}
                  className={`px-5 py-2.5 bg-${theme}-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2`}
                >
                  <Plus size={16} />
                  Креирај
                </button>
              ) : (
                <button 
                  onClick={() => setShowEventForm(false)}
                  className={`px-5 py-2.5 bg-white text-${theme}-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-${theme}-100`}
                >
                   Откажи
                </button>
              )}
            </div>
          </div>
        </div>

          <AnimatePresence>
            {showEventForm && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bento-card p-6 space-y-4 border-2 border-emerald-200">
                  <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Нова Еко-Акција</h3>
                  <input 
                    type="text"
                    placeholder="Име на акцијата (на пр: Чистење Кеј)"
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all border border-slate-100 text-sm font-medium"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                  />
                  <textarea 
                    placeholder="Детален опис..."
                    className="w-full h-24 px-5 py-4 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none border border-slate-100 text-sm font-medium"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="date"
                      className="px-5 py-4 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all border border-slate-100 text-sm font-medium"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                    <div className="relative group">
                      <input 
                        type="text"
                        placeholder="Локација"
                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all border border-slate-100 text-sm font-medium pr-12"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                      />
                      <button 
                        onClick={() => {
                          refreshLocation();
                          if (location) setCapacity(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-emerald-600 bg-white rounded-lg shadow-sm border border-emerald-50 active:scale-90 transition-transform"
                      >
                        <MapPin size={16} />
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={createEvent}
                    disabled={sending || !eventTitle || !description || !eventDate}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100"
                  >
                    КРЕИРАЈ АКЦИЈА (+50 П)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 px-2 uppercase text-xs tracking-widest flex items-center gap-2">
              <Calendar size={14} className="text-emerald-600" />
              Претстојни акции
            </h3>
            {events.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-100">
                <Calendar className="mx-auto mb-4 w-12 h-12 opacity-10" />
                <p className="text-xs font-bold uppercase tracking-tighter">Моментално нема активни еко-акции.</p>
              </div>
            ) : (
              events.map((event) => (
                <motion.div 
                  key={event.id}
                  className="bento-card p-6 flex flex-col gap-4 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 text-xl tracking-tight leading-tight">{event.title}</h4>
                      <p className="text-slate-500 text-sm mt-2 line-clamp-2">{event.description}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 font-black px-4 py-2 rounded-2xl text-[10px] uppercase shadow-sm border border-emerald-100 whitespace-nowrap">
                      +{event.pointsReward} П
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-emerald-500" />
                      <span>{new Date(event.date?.seconds * 1000).toLocaleDateString('mk')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-emerald-500" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <button 
                    disabled={event.participants.includes(auth.currentUser?.uid || '')}
                    onClick={() => joinEvent(event.id, event.pointsReward)}
                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                      event.participants.includes(auth.currentUser?.uid || '')
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                    }`}
                  >
                    {event.participants.includes(auth.currentUser?.uid || '') ? 'Веќе учествувате' : 'Приклучи се'}
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      );
    }

    if (activeTab === 'stats') {
      return (
        <motion.div
          key="stats-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 pb-24"
        >
          {/* Community Impact Hero */}
          <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl border-4 border-emerald-500">
            <div className="relative z-10 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70 mb-4">Град Скопје Заедно Досега:</p>
              <h3 className="text-5xl font-black tracking-tighter mb-2">{(globalStats.points * 123) + 12450}</h3>
              <p className="text-sm font-bold text-white/90">Вкупно Собрани Еко-Поени ⚡️</p>
              
              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/20">
                <div>
                  <p className="text-xl font-black">{globalStats.reports + 412}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Пријави</p>
                </div>
                <div>
                  <p className="text-xl font-black">{globalStats.actions + 86}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Акции</p>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" />
                Топ Еко-Херои на Неделата
              </h3>
            </div>
            
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 ring-2 ring-white/10 overflow-hidden">
              {leaderboard.map((user, idx) => (
                <div 
                  key={user.id} 
                  className={`flex items-center gap-4 p-4 ${idx !== leaderboard.length - 1 ? 'border-b border-slate-50' : ''} ${user.id === auth.currentUser?.uid ? 'bg-emerald-50/50' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-amber-100 text-amber-600' : 
                    idx === 1 ? 'bg-slate-100 text-slate-500' :
                    idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white overflow-hidden shadow-sm">
                    <img 
                      src={user.photoURL || `https://i.pravatar.cc/150?u=${user.id}`} 
                      className="w-full h-full object-cover" 
                      alt="Avatar"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName || user.id}`;
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-800 leading-none">{user.displayName || 'Anon'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Скопје</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600 leading-none">{user.points || 0}</p>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Поени</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

      {/* Full-screen Overlays */}
      <AnimatePresence>
        {showAchievements && (
           <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 z-[100] bg-white flex flex-col max-w-md mx-auto"
           >
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Мои достигнувања</h2>
                <button onClick={() => setShowAchievements(false)} className="p-2 bg-slate-100 rounded-xl text-slate-500"><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Award size={80} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Твојот Напредок</p>
                  <h3 className="text-3xl font-black mt-2">{profile?.points || 0}</h3>
                  <p className="text-xs font-bold text-blue-100 mt-1">Вкупно собрани еко-поени</p>
                  
                  <div className="mt-8 flex gap-2">
                    <div className="px-3 py-1.5 bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest">Ниво 4</div>
                    <div className="px-3 py-1.5 bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest">Активист</div>
                  </div>
                </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bento-card p-6 border-slate-100 bg-white flex flex-col items-center text-center">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-blue-50/50">
                          <Camera size={24} />
                       </div>
                       <h3 className="text-3xl font-black text-slate-800 leading-none">{myStats.photos}</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Споделени фотографии</p>
                    </div>
                    <div className="bento-card p-6 border-slate-100 bg-white flex flex-col items-center text-center">
                       <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-emerald-50/50">
                          <Calendar size={24} />
                       </div>
                       <h3 className="text-3xl font-black text-slate-800 leading-none">{myStats.joined}</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Еко Акции</p>
                    </div>
                 </div>
             </div>
           </motion.div>
        )}

        {showLeaderboard && (
           <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 z-[100] bg-white flex flex-col max-w-md mx-auto"
           >
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Топ Корисници</h2>
                <button onClick={() => setShowLeaderboard(false)} className="p-2 bg-slate-100 rounded-xl text-slate-500"><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Community Impact Hero */}
                <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl border-4 border-emerald-500">
                  <div className="relative z-10 text-center">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70 mb-4">Град Скопје Заедно Досега:</p>
                    <h3 className="text-5xl font-black tracking-tighter mb-2">{(globalStats.points * 123) + 12450}</h3>
                    <p className="text-sm font-bold text-white/90">Вкупно Собрани Еко-Поени ⚡️</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/20">
                      <div>
                        <p className="text-xl font-black">{globalStats.reports + 412}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Пријави</p>
                      </div>
                      <div>
                        <p className="text-xl font-black">{globalStats.actions + 86}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Акции</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-black text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
                      <Trophy size={16} className="text-amber-500" />
                      Топ Еко-Херои на Неделата
                    </h3>
                  </div>
                  
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {leaderboard.map((user, idx) => (
                      <div 
                        key={user.id} 
                        className={`flex items-center gap-4 p-4 ${idx !== leaderboard.length - 1 ? 'border-b border-slate-50' : ''} ${user.id === auth.currentUser?.uid ? 'bg-emerald-50/50' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                          idx === 0 ? 'bg-amber-100 text-amber-600' : 
                          idx === 1 ? 'bg-slate-100 text-slate-500' :
                          idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-300'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white overflow-hidden shadow-sm">
                          <img 
                            src={user.photoURL || `https://i.pravatar.cc/150?u=${user.id}`} 
                            className="w-full h-full object-cover" 
                            alt="Avatar"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName || user.id}`;
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-800 leading-none">{user.displayName || 'Anon'}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Скопје</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-600 leading-none">{user.points || 0}</p>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Поени</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
           </motion.div>
        )}

        {showSettings && (
           <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 z-[100] bg-white flex flex-col max-w-md mx-auto"
           >
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Акаунт Подесувања</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-100 rounded-xl text-slate-500"><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 rounded-[2rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden mb-4 relative group">
                      <img 
                        src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} 
                        className="w-full h-full object-cover"
                        alt="Avatar"
                      />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Профилна Слика</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Твоето име</label>
                      <input 
                        type="text" 
                        defaultValue={profile?.displayName || ''}
                        id="settings-name"
                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-sm"
                        placeholder="Внеси име..."
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Линк до фотографија (URL)</label>
                      <input 
                        type="text" 
                        defaultValue={profile?.photoURL || ''}
                        id="settings-photo"
                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-sm"
                        placeholder="https://..."
                      />
                   </div>
                </div>

                <button 
                  onClick={async () => {
                    if (!auth.currentUser) return;
                    const name = (document.getElementById('settings-name') as HTMLInputElement).value;
                    const photo = (document.getElementById('settings-photo') as HTMLInputElement).value;
                    try {
                      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                        displayName: name,
                        photoURL: photo
                      });
                      setSuccessMessage("Профилот е ажуриран! ✅");
                      setShowSettings(false);
                      setTimeout(() => setSuccessMessage(null), 3000);
                    } catch (err) {
                      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}`);
                    }
                  }}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
                >
                  ЗАЧУВАЈ ПРОМЕНИ
                </button>
             </div>
           </motion.div>
        )}
      </AnimatePresence>

    const icons = {
      dumps: <Trash2 className="w-10 h-10" />,
      containers: <Trash className="w-10 h-10" />,
      air: <Wind className="w-10 h-10" />
    };

    const labels = {
      dumps: 'Диви депонии',
      containers: 'Полни контејнери',
      air: 'Состојба на воздух'
    };

    const colors = {
      dumps: 'tab-bg-dumps border-red-200 text-red-500/20',
      containers: 'tab-bg-containers border-blue-200 text-blue-500/20',
      air: 'tab-bg-air border-orange-200 text-orange-500/20'
    };

    const textColors = {
      dumps: 'text-red-900',
      containers: 'text-blue-900',
      air: 'text-orange-900'
    };

    const subTextColors = {
      dumps: 'text-red-600/70',
      containers: 'text-blue-600/70',
      air: 'text-orange-600/70'
    };

    const iconBg = {
      dumps: 'bg-red-100 text-red-600',
      containers: 'bg-blue-100 text-blue-600',
      air: 'bg-orange-100 text-orange-600'
    };

    const isAir = activeTab === 'air';

    return (
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 pb-24"
      >
        <div className={`bento-card p-6 text-center relative overflow-hidden bg-white border-${theme}-100`}>
          <div className="relative z-10">
            <div className={`w-10 h-10 bg-${theme}-50 text-${theme}-600 rounded-xl flex items-center justify-center mx-auto mb-3 border border-${theme}-100 shadow-sm`}>
              {icons[activeTab as keyof typeof icons]}
            </div>
            <h2 className={`text-xl font-black tracking-tight leading-none text-slate-800`}>
              {labels[activeTab as keyof typeof labels]}
            </h2>
            {isAir && (
              <div className="mt-4 flex flex-col items-center gap-3">
                <p className={`text-[10px] font-black uppercase tracking-widest text-${theme}-600/70`}>
                  Пријави загадување
                </p>
                <button className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-200/50 active:scale-95 transition-all hover:shadow-emerald-300/50">
                  <Zap size={14} className="fill-white" />
                  <span>Додади нов сензор</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {isAir && (
          <div className="rounded-[1.5rem] bg-slate-900 h-48 relative shadow-2xl overflow-hidden border border-slate-800 mx-2">
            <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center grayscale contrast-125 shadow-inner"></div>
            
            {/* Simple Skopje Grid Overlay */}
            <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay"></div>
            
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-32 h-32 border-2 border-orange-500/30 rounded-full animate-pulse flex items-center justify-center">
                  <div className="w-16 h-16 border border-orange-500/50 rounded-full"></div>
               </div>
            </div>

            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
               <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
               <span className="text-[9px] font-black text-white uppercase tracking-widest">Skopje Station: Live</span>
            </div>

            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-right">
              <p className="text-orange-400 text-lg font-black leading-none">142 AQI</p>
              <p className="text-[8px] text-white/50 font-black uppercase mt-1">Загадено</p>
            </div>
          </div>
        )}

        {!isAir && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`h-40 bg-${theme}-50/30 rounded-[1.5rem] border-2 border-dashed border-${theme}-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative mx-2 shadow-sm group hover:border-${theme}-400 transition-colors`}
          >
            {photo ? (
              <div className="w-full h-full p-2">
                <img src={photo} alt="Report" className="w-full h-full object-cover rounded-xl" />
              </div>
            ) : (
              <>
                <Camera className={`w-8 h-8 text-${theme}-400 group-active:scale-90 transition-transform`} />
                <span className={`text-${theme}-600 font-black text-[10px] uppercase mt-3 tracking-widest`}>Додај слика од депонијата</span>
              </>
            )}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleCapture}
            />
          </div>
        )}

        <div className={`bento-card p-6 space-y-5 border-${theme}-200 shadow-xl shadow-${theme}-500/5`}>
          <button 
            onClick={refreshLocation}
            className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className={`w-12 h-12 rounded-xl bg-white text-${theme}-600 flex items-center justify-center shadow-sm border border-slate-100`}>
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Твојата Локација (Притисни за рефреш)</p>
              <p className="text-xs font-mono font-bold text-slate-600 mt-0.5">
                {location ? `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E` : 'Лоцирање...'}
              </p>
            </div>
          </button>

          <textarea 
            placeholder="Опис на проблемот... (на пр. зафаќа цел плочник)"
            className={`w-full h-32 px-6 py-5 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-${theme}-500 transition-all resize-none border border-slate-100 text-sm font-medium`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button 
            disabled={sending || (!photo && !isAir)}
            onClick={submitReport}
            className={`w-full py-6 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 via-orange-600 to-amber-500 text-white shadow-orange-200 active:scale-[0.97] hover:scale-[1.02] disabled:opacity-50 disabled:grayscale transition-all hover:shadow-orange-300`}
          >
            {sending ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              <>
                <Send size={22} className="drop-shadow-md" />
                <span>ПРИЈАВИ ПРОБЛЕМ (+5 поени)</span>
              </>
            )}
          </button>
        </div>

        {/* Community Feed */}
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
              <Users size={16} className={`text-${theme}-600`} />
              Последни активности
            </h3>
            <span className="text-[9px] font-black text-slate-400 tracking-tighter uppercase italic opacity-50">ЗАЕДНИЦА</span>
          </div>
          
          {recentReports.length === 0 ? (
            <div className="bento-card p-10 text-center text-slate-300">
              <p className="text-[10px] font-black uppercase tracking-widest">Биди првиот што ќе пријави!</p>
            </div>
          ) : (
            recentReports.map((report) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bento-card p-4 flex gap-4 items-center group cursor-pointer"
              >
                <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                  {report.photoUrl ? (
                    <img src={report.photoUrl} alt="Report" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                      <Camera size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 tracking-tight leading-tight truncate">
                    {report.description || 'Пријавено без опис'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1 uppercase tracking-tighter">
                    {report.timestamp ? new Date(report.timestamp.seconds * 1000).toLocaleTimeString('mk', { hour: '2-digit', minute: '2-digit' }) : 'Сега'}
                    <span className="opacity-30">•</span>
                    од Граѓанин
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm border border-emerald-100">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  +5П
                </div>
              </motion.div>
            ))
          )}
          
          <div className="pt-4 px-2">
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
               <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  className="h-full bg-emerald-500"
               ></motion.div>
            </div>
            <p className="text-[9px] text-center text-slate-400 mt-2 uppercase font-black tracking-tighter">Уште 75 поени до следната еко-награда</p>
          </div>
        </div>
      </motion.div>
    );
  };

  const getBgGlow = () => {
    switch(activeTab) {
      case 'dumps': return 'bg-red-400/5';
      case 'containers': return 'bg-blue-400/5';
      case 'air': return 'bg-orange-400/5';
      case 'transport': return 'bg-indigo-400/5';
      case 'actions': return 'bg-emerald-400/5';
      default: return 'bg-emerald-400/5';
    }
  };

  const getThemeColor = () => {
    switch(activeTab) {
      case 'home': return 'emerald';
      case 'dumps': return 'red';
      case 'containers': return 'blue';
      case 'air': return 'orange';
      case 'transport': return 'indigo';
      case 'actions': return 'emerald';
      case 'stats': return 'slate';
      default: return 'emerald';
    }
  };

  const theme = getThemeColor();

  return (
    <div className={`min-h-screen ${getBgGlow()} flex flex-col font-sans max-w-md mx-auto relative transition-colors duration-500 overflow-hidden`}>
      {/* Restore original pale gradient */}
      <div className="absolute inset-x-0 top-0 h-96 -z-10 bg-gradient-to-b from-white/80 to-transparent"></div>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/40 h-20 px-6 flex items-center justify-between shiny-border max-w-md mx-auto overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-white/60 flex items-center justify-center text-slate-400 overflow-hidden shadow-inner ring-2 ring-slate-100">
            {profile?.photoURL ? <img src={profile.photoURL} alt="P" className="w-full h-full object-cover" /> : <User size={20} />}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs font-black text-slate-800">
                {profile?.displayName?.split(' ')[0] || 'Корисник'}
              </span>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                {profile?.points || 0} П
              </span>
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Активен профил</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-slate-200"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mt-20 flex-1 px-6 pt-6 relative overflow-visible">
        <motion.div
          className="h-full cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            const threshold = 50; // More sensitive threshold
            const velocityThreshold = 200; // Swipe velocity matters too
            
            if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
              handleSwipe(1); // Swipe left -> next tab
            } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
              handleSwipe(-1); // Swipe right -> prev tab
            }
          }}
        >
          <AnimatePresence mode="wait">
            {renderTabContent()}
          </AnimatePresence>
        </motion.div>

        {/* Success Float */}
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={`fixed bottom-28 left-6 right-6 z-[60] bg-${theme}-600 text-white p-5 rounded-3xl flex items-center gap-4 shadow-2xl border border-white/20`}
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="text-white" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest leading-relaxed">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* QR Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => setShowQRModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 active:scale-90 transition-transform border border-slate-100 shadow-sm"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
                  <QrCode size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Твојот Еко-Ваучер</span>
                </div>
                <div className="w-10"></div>
              </div>

              <div className="text-center space-y-6">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Искористи ги твоите {profile?.points || 0} поени</h3>

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner flex justify-center">
                  <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <QRCodeSVG 
                      value={JSON.stringify({ 
                        uid: profile?.uid, 
                        points: profile?.points,
                        email: profile?.email,
                        timestamp: new Date().toISOString()
                      })}
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 shadow-sm relative">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Партнерски институции</p>
                      <button 
                        onClick={() => setShowPointsInfo(true)}
                        className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
                      >
                        <Info size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {Object.keys(partnerLogos).map(tag => (
                        <button 
                          key={tag} 
                          onClick={() => setActivePartnerCategory(tag)}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activePartnerCategory === tag ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-blue-500 border border-blue-100 hover:bg-blue-50'}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <AnimatePresence mode="wait">
                        <motion.div 
                          key={activePartnerCategory}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="col-span-2 grid grid-cols-2 gap-3"
                        >
                          {partnerLogos[activePartnerCategory].map((logo, idx) => (
                            <motion.div 
                              key={logo.name}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="bg-white p-3 rounded-2xl border border-blue-50 shadow-sm flex flex-col items-center justify-center gap-2 group hover:border-blue-200 transition-colors h-24"
                            >
                              <div className="w-full h-12 flex items-center justify-center overflow-hidden">
                                <img 
                                  src={logo.url} 
                                  alt={logo.name} 
                                  className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500" 
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-blue-600 transition-colors">{logo.name}</span>
                            </motion.div>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Важи за сите културни и спортски партнери
                  </p>
                </div>

                <button 
                  onClick={() => setShowQRModal(false)}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-emerald-100 active:scale-95 transition-all mt-4"
                >
                  Назад кон почетна
                </button>
              </div>

              {/* Points Info Modal Overlay */}
              <AnimatePresence>
                {showPointsInfo && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm p-8 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                      <Trophy size={32} />
                    </div>
                    <h4 className="text-xl font-black text-slate-800 mb-4 uppercase tracking-tight">Како да ги искористиш поените?</h4>
                    <div className="space-y-4 text-left mb-8">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-emerald-600">1</div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Секоја активност (пријавување депонија, учество во акција) ти носи <span className="font-bold text-slate-700">Еко-Поени</span>.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-emerald-600">2</div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Поените се поврзани со нашите <span className="font-bold text-slate-700">Партнерски институции</span> (театри, музеи, спортски клубови).</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-emerald-600">3</div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Покажи го QR кодот на билетарата. Поените се заменуваат за <span className="font-bold text-slate-700">бесплатни влезници или попусти</span>.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowPointsInfo(false)}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all"
                    >
                      Разбрав
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-100/30 rounded-full blur-3xl"></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Drawer (Gmail Style) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] max-w-md mx-auto"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-[300px] bg-white z-[70] shadow-2xl flex flex-col border-l border-slate-100"
            >
              <div className="p-8 pb-6 bg-slate-50/50 relative">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Мену</h3>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 px-2">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                      {profile?.photoURL ? 
                        <img src={profile.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : 
                        <User className="text-slate-400" size={24} />
                      }
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                          <Zap size={12} className="text-emerald-500 fill-emerald-500" />
                          <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">{profile?.displayName?.split(' ')[0] || 'Еко Херој'}</h2>
                        </div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mt-1.5 flex items-center gap-1">
                          {profile?.points || 0} Поени ⚡️
                        </p>
                    </div>
                  </div>

                  <div className="relative z-10 px-1">
                    <button 
                      onClick={() => setIsAchievementsDropdownOpen(!isAchievementsDropdownOpen)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <Trophy size={18} />
                        </div>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Мои достигнувања</span>
                      </div>
                      <ChevronRight 
                        size={16} 
                        className={`text-slate-400 transition-transform duration-300 ${isAchievementsDropdownOpen ? 'rotate-90' : ''}`} 
                      />
                    </button>

                    <AnimatePresence>
                      {isAchievementsDropdownOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-3 mt-3 px-1 pb-1">
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center group hover:border-emerald-200 transition-colors">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Слики</p>
                              <div className="flex items-center justify-center gap-2">
                                <Camera size={14} className="text-emerald-500" />
                                <span className="text-base font-black text-slate-800">{myStats.photos}</span>
                              </div>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center group hover:border-blue-200 transition-colors">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Акции</p>
                              <div className="flex items-center justify-center gap-2">
                                <Target size={14} className="text-blue-500" />
                                <span className="text-base font-black text-slate-800">{myStats.joined}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                <DrawerItem 
                  icon={<BarChart3 size={18} className="text-slate-800" />} 
                  label="Мои Активности" 
                  onClick={() => { setActiveTab('stats'); setIsDrawerOpen(false); }}
                />
                <DrawerItem 
                  icon={<QrCode size={18} className="text-emerald-600" />} 
                  label="Мој QR Код" 
                  onClick={() => { setShowQRModal(true); setIsDrawerOpen(false); }}
                />
                <div className="h-px bg-slate-100 my-3 mx-4" />
                <DrawerItem 
                  icon={<Settings size={18} />} 
                  label="Акаунт Подесувања" 
                  onClick={() => { setShowSettings(true); setIsDrawerOpen(false); }}
                />
                <DrawerItem 
                  icon={<HelpCircle size={18} />} 
                  label="Помош" 
                  onClick={() => { setShowHelpModal(true); setIsDrawerOpen(false); }}
                />
              </div>

              <div className="p-4 border-t border-slate-50">
                <button 
                  onClick={() => auth.signOut()}
                  className="w-full py-4 px-4 rounded-xl hover:bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-colors"
                >
                  <LogOut size={16} />
                  Одјави се
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulky Waste Info Modal */}
      <AnimatePresence>
        {showBulkyWasteModal && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 max-w-md mx-auto"
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowBulkyWasteModal(false)} />
            <div className="bg-white rounded-[2.5rem] w-full overflow-hidden relative shadow-2xl border border-slate-100">
              <div className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                  <Truck size={28} />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Што е кабаст отпад?</h2>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-6">
                  „Кабаст отпад“ се однесува на големи предмети од домаќинството кои не можат да се фрлат во стандардните контејнери.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Примери:</h4>
                    <div className="grid grid-cols-2 gap-2">
                       {['Стар мебел', 'Апарати', 'Теписи', 'Душеци'].map(item => (
                         <div key={item} className="bg-slate-50 p-2 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-100">
                           • {item}
                         </div>
                       ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Каде да се фрли?</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                        <MapPin size={14} className="text-indigo-600 mt-0.5" />
                        <p className="text-[10px] font-bold text-indigo-900/70 leading-normal">
                          Бесплатно во собирните центри (Вардариште, Шуто Оризари и Карпош).
                        </p>
                      </div>
                      <div className="flex items-start gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                        <Truck size={14} className="text-emerald-600 mt-0.5" />
                        <p className="text-[10px] font-bold text-emerald-900/70 leading-normal">
                          Специјализирани служби (ЈП Комунална Хигиена) организираат подигање од дома.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowBulkyWasteModal(false)}
                  className="w-full mt-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
                >
                  Разбрав
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal (Balloon/Pop-up) */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 max-w-md mx-auto"
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowHelpModal(false)} />
            <div className="bg-white rounded-[2.5rem] w-full overflow-hidden relative shadow-2xl border border-slate-100">
              <div className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                  <HelpCircle size={28} />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Како до повеќе поени?</h2>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-6">
                  Скопје има потреба од твојата помош. Еве како можеш да придонесеш:
                </p>
                
                <div className="space-y-4">
                  <HelpStep 
                    number="01" 
                    title="Пријави Проблем" 
                    text="Сликај дива депонија или преполн контејнер. Секоја пријава носи 5 поени."
                  />
                  <HelpStep 
                    number="02" 
                    title="Еко-Акции" 
                    text="Учествувај во групни чистења и садење дрвја за по 50 поени."
                  />
                  <HelpStep 
                    number="03" 
                    title="Кабаст отпад" 
                    text="Понуди превоз на кабаст отпад за другите граѓани за 20 поени по тура."
                  />
                </div>

                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
                >
                  Продолжи со чистење
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Tabs */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/60 backdrop-blur-xl border-t border-white/40 h-20 px-2 flex items-center justify-around z-50 max-w-md mx-auto shiny-border pb-4 overflow-x-auto">
        <TabButton 
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')} 
          icon={<Leaf size={20} />} 
          label="ПОЧЕТНА"
          themeColor="text-emerald-600"
        />
        <TabButton 
          active={activeTab === 'dumps'} 
          onClick={() => setActiveTab('dumps')} 
          icon={<Trash2 size={20} />} 
          label="ДЕПОНИИ"
          themeColor="text-red-500"
        />
        <TabButton 
          active={activeTab === 'containers'} 
          onClick={() => setActiveTab('containers')} 
          icon={<Trash size={20} />} 
          label="КОНТЕЈНЕРИ"
          themeColor="text-blue-500"
        />
        <TabButton 
          active={activeTab === 'air'} 
          onClick={() => setActiveTab('air')} 
          icon={<Wind size={20} />} 
          label="ВОЗДУХ"
          themeColor="text-orange-500"
        />
        <TabButton 
          active={activeTab === 'transport'} 
          onClick={() => setActiveTab('transport')} 
          icon={<Truck size={20} />} 
          label="ОТПАД"
          themeColor="text-indigo-500"
        />
        <TabButton 
          active={activeTab === 'actions'} 
          onClick={() => setActiveTab('actions')} 
          icon={<Calendar size={20} />} 
          label="АКЦИИ"
          themeColor="text-emerald-500"
        />
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, themeColor }: { active: boolean, onClick: () => void, icon: React.ReactElement, label: string, themeColor: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all h-full justify-center px-1 flex-1 relative ${
        active 
        ? themeColor
        : 'text-slate-400'
      }`}
    >
      <div className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
        {React.cloneElement(icon, { 
          strokeWidth: active ? 2.5 : 2,
          fill: active ? 'currentColor' : 'none',
        })}
      </div>
      <span className={`text-[8px] font-black tracking-tighter uppercase whitespace-nowrap transition-opacity ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="tab-indicator"
          className={`absolute bottom-2 w-6 h-1 ${themeColor.replace('text', 'bg')} rounded-full`}
        />
      )}
    </button>
  );
}
