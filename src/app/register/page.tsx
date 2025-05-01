'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RegistrationFlow } from '@/components/auth/registration-flow';

export default function RegisterPage() {
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number, y: number }>>({});

  // Define the social media icons with their properties
  const socialIcons = [
    {
      id: "facebook",
      name: "Facebook",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
      color: "bg-blue-600",
      textColor: "text-blue-600",
      position: { x: -120, y: 0 },
      delay: 0.1
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
      color: "bg-pink-600",
      textColor: "text-pink-600",
      position: { x: -80, y: 100 },
      delay: 0.2
    },
    {
      id: "phone",
      name: "WhatsApp",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
      color: "bg-green-500",
      textColor: "text-green-500",
      position: { x: 80, y: -60 },
      delay: 0.3
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
      color: "bg-blue-500",
      textColor: "text-blue-500",
      position: { x: 100, y: 80 },
      delay: 0.4
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
          <path d="m10 15 5-3-5-3z" />
        </svg>
      ),
      color: "bg-red-600",
      textColor: "text-red-600",
      position: { x: 0, y: 120 },
      delay: 0.5
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      ),
      color: "bg-blue-400",
      textColor: "text-blue-400",
      position: { x: 120, y: -100 },
      delay: 0.6
    }
  ];

  // Initialize icon positions only once
  useEffect(() => {
    // Initialize icon positions
    const initialPositions: Record<string, { x: number, y: number }> = {};
    socialIcons.forEach(icon => {
      initialPositions[icon.id] = { x: icon.position.x, y: icon.position.y };
    });
    setIconPositions(initialPositions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  // Function to handle drag end and update positions
  const handleDragEnd = (_: any, info: any, iconId: string) => {
    // Update the position of the dragged icon
    setIconPositions(prev => {
      // Only update if we have previous positions
      if (!prev[iconId]) return prev;

      return {
        ...prev,
        [iconId]: {
          x: prev[iconId].x + info.offset.x,
          y: prev[iconId].y + info.offset.y
        }
      };
    });
  };

  // No longer needed

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4 auth-container auth-bg-pattern">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-particle absolute top-[10%] left-[10%] w-24 h-24 rounded-full bg-blue-100 opacity-20" style={{ animationDelay: '0s' }}></div>
        <div className="floating-particle absolute top-[30%] left-[80%] w-32 h-32 rounded-full bg-pink-100 opacity-20" style={{ animationDelay: '1s' }}></div>
        <div className="floating-particle absolute top-[70%] left-[20%] w-40 h-40 rounded-full bg-green-100 opacity-20" style={{ animationDelay: '2s' }}></div>
        <div className="floating-particle absolute top-[60%] left-[70%] w-28 h-28 rounded-full bg-yellow-100 opacity-20" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="w-full max-w-[1200px] flex relative z-10">
        {/* Left side with social icons */}
        <div className="hidden md:flex md:w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300 rounded-l-3xl overflow-hidden shadow-2xl">
            {/* Background elements */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/80 rounded-full blur-3xl"></div>
            <div className="absolute left-1/4 top-1/4 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-100/50 rounded-full blur-xl"></div>
            <div className="absolute right-1/4 bottom-1/4 transform translate-x-1/2 translate-y-1/2 w-40 h-40 bg-pink-100/50 rounded-full blur-xl"></div>

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-10"
                 style={{
                   backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
                   backgroundSize: '40px 40px'
                 }}>
            </div>

            {/* MyProfile Logo */}
            <motion.div
              className="absolute left-1/2 top-1/4 transform -translate-x-1/2 -translate-y-1/2 flex items-center glass-effect px-6 py-3 rounded-full -mt-10"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: 0.2
              }}
            >
              <div className="mr-4 bg-white rounded-full p-2 shadow-md">
                <motion.img
                  src="/profilewhite.png"
                  alt="MyProfile"
                  width="55"
                  height="55"
                  className="object-contain"
                  whileHover={{ rotate: 10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                />
              </div>
              <motion.h1
                className="text-3xl font-bold"
                style={{ fontFamily: 'Manrope' }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <span className="bg-clip-text font-extrabold text-4xl">My</span>
                <span className="font-normal bg-clip-text  bg-gradient-to-r from-gray-700 to-gray-400">Profile</span>
              </motion.h1>
            </motion.div>

            {/* Central Profile Icon */}
            <div className="relative left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              {/* Multiple pulsing ring effects */}
              <motion.div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/20 -z-10"
                initial={{ width: 0, height: 0, opacity: 0 }}
                animate={{
                  width: 120,
                  height: 120,
                  opacity: [0, 0.5, 0],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  delay: 0
                }}
              />

              <motion.div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 -z-10"
                initial={{ width: 0, height: 0, opacity: 0 }}
                animate={{
                  width: 100,
                  height: 100,
                  opacity: [0, 0.4, 0],
                  scale: [1, 1.4, 1]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  delay: 1
                }}
              />

              <motion.div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/20 -z-10"
                initial={{ width: 0, height: 0, opacity: 0 }}
                animate={{
                  width: 80,
                  height: 80,
                  opacity: [0, 0.3, 0],
                  scale: [1, 1.3, 1]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  delay: 2
                }}
              />

              {/* Main profile icon */}
              <motion.div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-lg z-10 cursor-pointer"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.3
                }}
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0 0 30px rgba(0,0,0,0.2)",
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src="/profileblack.png"
                  alt="MyProfile"
                  width="70"
                  height="60"
                  className="object-contain"
                />
              </motion.div>

              {/* Label below the icon */}
              <motion.div
                className="absolute left-1/2 top-[calc(50%+60px)] transform -translate-x-1/2 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <div className="text-sm font-medium text-gray-700 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                  Connect All Your Profiles
                </div>

                {/* Drag hint */}
                {/* <motion.div
                  className="mt-2 text-xs font-medium text-blue-600 bg-white/80 px-2 py-0.5 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    y: [0, -3, 0],
                    transition: {
                      y: {
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut"
                      }
                    }
                  }}
                >
                  <span className="inline-block mr-1">↔</span>
                  Drag icons to rearrange
                </motion.div> */}
              </motion.div>
            </div>

            {/* Social Media Icons */}
            {socialIcons.map((icon) => (
              <div key={icon.id} className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                {/* Icon */}
                <motion.div
                  className={`${icon.color} rounded-full p-3 shadow-lg relative z-10 backdrop-blur-sm draggable drag-hint`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    x: iconPositions[icon.id]?.x || icon.position.x,
                    y: iconPositions[icon.id]?.y || icon.position.y,
                    scale: 1,
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 10,
                      delay: icon.delay + 0.5
                    }
                  }}
                  // Make draggable
                  drag={true}
                  dragMomentum={false}
                  dragConstraints={{
                    top: -150,
                    left: -150,
                    right: 150,
                    bottom: 150
                  }}
                  onDragEnd={(event, info) => handleDragEnd(event, info, icon.id)}
                  // Remove floating animation when draggable
                  // Add hover and tap effects for interactivity
                  whileHover={{
                    scale: 1.3,
                    boxShadow: "0 0 20px rgba(255,255,255,0.7)",
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                  }}
                  whileTap={{ scale: 0.9, rotate: 15 }}
                >
                  {icon.icon}

                  {/* Connection line to central icon */}
                  {/* <motion.div
                    className="absolute top-1/2 left-1/2 -z-10 bg-red-500 h-0.5"
                    style={{
                      width: Math.sqrt(
                        Math.pow(iconPositions[icon.id]?.x || icon.position.x, 2) +
                        Math.pow(iconPositions[icon.id]?.y || icon.position.y, 2)
                      ),
                      transform: `translate(-50%, -50%) rotate(${
                        Math.atan2(
                          iconPositions[icon.id]?.y || icon.position.y,
                          iconPositions[icon.id]?.x || icon.position.x
                        ) * (180 / Math.PI)
                      }deg)`,
                      transformOrigin: 'center'
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: icon.delay + 0.7, duration: 0.5 }}
                  /> */}

                  {/* Figma-style name label */}
                  <motion.div
                    className={`absolute ${
                      (iconPositions[icon.id]?.y || icon.position.y) > 0 ? '-bottom-10' : '-top-10'
                    } left-1/2 transform -translate-x-1/2 bg-white px-3 py-1.5 rounded-md shadow-md ${
                      icon.textColor
                    } font-medium text-xs whitespace-nowrap border border-gray-100`}
                    initial={{ opacity: 0, scale: 0.8, y: icon.position.y > 0 ? 10 : -10 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      transition: {
                        delay: icon.delay + 0.8,
                        type: "spring",
                        stiffness: 100,
                        damping: 10
                      }
                    }}
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                    whileHover={{
                      y: (iconPositions[icon.id]?.y || icon.position.y) > 0 ? 3 : -3,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      transition: { type: "spring", stiffness: 400, damping: 10 }
                    }}
                  >
                    {icon.name}
                  </motion.div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side with registration form */}
        <div className="w-full md:w-1/2 bg-white rounded-3xl md:rounded-l-none md:rounded-r-3xl shadow-2xl overflow-hidden relative">
          {/* Subtle top gradient */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-r from-blue-100 via-pink-100 to-purple-100 opacity-50"></div>

          {/* Form container with enhanced styling */}
          <div className="pt-6">
            <RegistrationFlow />
          </div>

          {/* Bottom decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-pink-500 to-purple-500"></div>
        </div>
      </div>
    </div>
  );
}
