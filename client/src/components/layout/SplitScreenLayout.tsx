import React from 'react';
import { motion } from 'framer-motion';
import WaveBackground from '@/components/ui/WaveBackground';

interface SplitScreenLayoutProps {
  children: React.ReactNode;
  showWave?: boolean;
}

const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({ 
  children, 
  showWave = true 
}) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form content */}
      <motion.div 
        className="flex-1 flex items-center justify-center p-8 bg-white"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full max-w-md">
          {children}
        </div>
      </motion.div>

      {/* Right side - Wave background */}
      {showWave && (
        <motion.div 
          className="flex-1 hidden lg:block relative"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <WaveBackground />
          
          {/* Brand logo overlay */}
          <div className="absolute top-8 left-8 z-10">
            <motion.div
              className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-lg flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <span className="text-white font-bold text-xl">HD</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SplitScreenLayout;
