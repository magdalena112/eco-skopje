/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-emerald-600 font-bold"
        >
          ЕкоСкопје...
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div 
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <MainApp />
        </motion.div>
      ) : (
        <motion.div 
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LoginPage />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
