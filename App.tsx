
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertCircle } from 'lucide-react';
import { AppState, StitchResult } from './types';
import { analyzeStitchPattern } from './services/geminiService';
import ScanningOverlay from './components/ScanningOverlay';
import ResultCard from './components/ResultCard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<StitchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data:image/...;base64,
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      const previewUrl = URL.createObjectURL(file);
      setImage(previewUrl);
      setState(AppState.ANALYZING);

      try {
        const base64 = await fileToBase64(file);
        const analysis = await analyzeStitchPattern(base64, file.type);
        setResult(analysis);
        setState(AppState.RESULT);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "We couldn't quite see the details. Try taking a photo in better lighting or focusing on a single row.");
        setState(AppState.ERROR);
      }
    }
  };

  const reset = useCallback(() => {
    setImage(null);
    setResult(null);
    setError(null);
    setState(AppState.IDLE);
  }, []);

  return (
    <>
    <h1>Testing</h1>
    <div className="min-h-screen bg-[#fefcfb] selection:bg-pink-100 selection:text-pink-600 flex flex-col items-center justify-center p-6 sm:p-12 overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-pink-100 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-100 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full mb-6">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
           </span>
           <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Vision AI v2.5</span>
        </div>
        <h1 className="text-6xl sm:text-7xl font-serif text-indigo-950 mb-4 tracking-tight">
          FiberOptic
        </h1>
        <p className="text-indigo-400/80 font-medium tracking-[0.3em] uppercase text-xs">
          Advanced Pattern Recognition
        </p>
      </motion.div>

      <div className="relative w-full max-w-xl flex items-center justify-center z-10">
        <AnimatePresence mode="wait">
          {/* STATE 1: IDLE / Upload */}
          {state === AppState.IDLE && (
            <motion.label
              key="upload"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.05, opacity: 0 }}
              whileHover={{ y: -4 }}
              className="group cursor-pointer bg-white shadow-[0_24px_48px_-12px_rgba(49,46,129,0.12)] rounded-[2.5rem] w-full aspect-square sm:aspect-video flex flex-col items-center justify-center border-2 border-dashed border-indigo-100/80 hover:border-pink-300 transition-all p-12 text-center"
            >
              <div className="bg-pink-50 p-8 rounded-full mb-8 group-hover:scale-110 transition-transform shadow-sm group-hover:shadow-pink-100 group-hover:shadow-xl">
                <Camera className="w-10 h-10 text-pink-400" />
              </div>
              <h3 className="text-2xl font-serif text-indigo-950 mb-3 text-nowrap">Snap your work-in-progress</h3>
              <p className="text-indigo-400 max-w-xs mx-auto leading-relaxed">
                Our AI will instantly identify the stitch pattern, recognize your project type, and explain exactly why.
              </p>
              <div className="mt-8 flex gap-2">
                 <span className="px-4 py-2 bg-indigo-50 text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-widest">Crochet</span>
                 <span className="px-4 py-2 bg-pink-50 text-pink-400 text-[10px] font-bold rounded-full uppercase tracking-widest">Knitting</span>
              </div>
              <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
            </motion.label>
          )}

          {/* STATE 2: ANALYZING */}
          {state === AppState.ANALYZING && image && (
            <ScanningOverlay key="analyzing" image={image} />
          )}

          {/* STATE 3: RESULT */}
          {state === AppState.RESULT && result && (
            <ResultCard key="result" result={result} onReset={reset} />
          )}

          {/* STATE 4: ERROR */}
          {state === AppState.ERROR && (
            <motion.div
              key="error"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-12 rounded-[2.5rem] shadow-2xl border-2 border-red-50 text-center w-full"
            >
              <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-2xl font-serif text-indigo-950 mb-3">Pattern Unclear</h3>
              <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                {error}
              </p>
              <button 
                onClick={reset}
                className="bg-indigo-950 text-white py-4 px-10 rounded-2xl font-bold text-sm hover:bg-indigo-900 transition-colors shadow-lg shadow-indigo-100"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative Thread Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        className="mt-20 pointer-events-none relative"
      >
        <svg width="300" height="40" viewBox="0 0 300 40" className="mx-auto">
          <path 
            d="M0 20 Q 37.5 0, 75 20 T 150 20 T 225 20 T 300 20" 
            fill="none" 
            stroke="#4F46E5" 
            strokeWidth="3" 
            strokeDasharray="8,8" 
          />
        </svg>
        <p className="text-[10px] text-center mt-4 text-indigo-300 font-bold uppercase tracking-[0.4em]">Designed for creators</p>
      </motion.div>
    </div>
        </>
  );
};

export default App;
