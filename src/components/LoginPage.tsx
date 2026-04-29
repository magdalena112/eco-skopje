import React, { useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, LogIn, Zap } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Initialize user in Firestore if not exists
      const userDoc = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userDoc);
      
      if (!snap.exists()) {
        await setDoc(userDoc, {
          email: result.user.email,
          points: 0,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        });
      }
    } catch (err: any) {
      setError("Грешка при најава. Ве молиме обидете се повторно.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-sans relative overflow-hidden bg-emerald-50/50">
      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.15]" 
        style={{ 
          backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Decorative Blobs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 text-center relative z-10 border border-white shadow-2xl shadow-emerald-900/5"
      >
        <div className="mb-10 flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-16 h-16 bg-white border border-emerald-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
          >
            <Leaf className="text-emerald-500 w-9 h-9" />
          </motion.div>
          <h1 className="text-4xl font-black text-emerald-600 mb-2 tracking-tighter uppercase italic">ECO-Skopje</h1>
          <p className="text-emerald-800/50 text-[10px] font-black uppercase tracking-[0.3em]">твојот град, твоја грижа</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-white text-slate-700 font-black py-4 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 border border-emerald-50"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></span>
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale opacity-70" alt="G" />
                <span className="uppercase text-[10px] tracking-widest underline decoration-emerald-200 decoration-2 underline-offset-4">Најави се со Google</span>
              </>
            )}
          </button>
          
          <div className="relative py-2 flex items-center gap-4">
            <div className="flex-1 h-px bg-emerald-100"></div>
            <span className="text-[9px] font-black uppercase text-emerald-300 tracking-widest">Или продолжете со</span>
            <div className="flex-1 h-px bg-emerald-100"></div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Е-пошта или телефон" 
                className="w-full pl-6 pr-12 py-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm text-slate-700 transition-all placeholder:text-slate-500"
              />
            </div>
            <div className="relative">
              <input 
                type="password" 
                placeholder="Лозинка" 
                className="w-full pl-6 pr-12 py-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm text-slate-700 transition-all placeholder:text-slate-500"
              />
            </div>
            <div className="flex justify-end">
              <button className="text-[10px] font-black text-emerald-400 hover:text-emerald-600 uppercase tracking-widest transition-colors">
                Заборавена лозинка?
              </button>
            </div>
            <button className="w-full bg-emerald-600 text-white font-black py-4 px-6 rounded-2xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-200 uppercase text-[10px] tracking-widest">
              Најави се
            </button>
          </div>
        </div>


        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-[11px] font-black uppercase tracking-wider"
          >
            {error}
          </motion.p>
        )}

        <p className="mt-10 text-[10px] font-medium text-slate-400 leading-relaxed max-w-[80%] mx-auto">
          Со најавата, се согласувате со нашите <span className="text-slate-600 font-bold">услови за користење</span> и <span className="text-slate-600 font-bold">политика за приватност</span>.
        </p>
      </motion.div>
    </div>
  );
}
