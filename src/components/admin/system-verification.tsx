import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { myPtsHubApi } from '@/lib/api/mypts-api';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Clock, RotateCw, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion, MotionConfig, AnimatePresence } from 'framer-motion';

export function SystemVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    hubCirculatingSupply: number;
    actualCirculatingSupply: number;
    difference: number;
    isConsistent: boolean;
    message: string;
  } | null>(null);
  const [reconcileReason, setReconcileReason] = useState('');

  // Periodic check settings - initialize from localStorage if available, default to true
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedValue = localStorage.getItem('mypts-auto-check-enabled');
      // If there's no saved value, default to true
      return savedValue === null ? true : savedValue === 'true';
    }
    return true; // Default to true for SSR
  });

  const [checkInterval, setCheckInterval] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedInterval = localStorage.getItem('mypts-check-interval');
      return savedInterval || '15'; // Default to 15 minutes if not saved
    }
    return '15';
  });

  const [lastAutoCheck, setLastAutoCheck] = useState<Date | null>(() => {
    if (typeof window !== 'undefined') {
      const savedTime = localStorage.getItem('mypts-last-auto-check');
      return savedTime ? new Date(savedTime) : null;
    }
    return null;
  });

  const [nextCheckTime, setNextCheckTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const response = await myPtsHubApi.verifySystemConsistency();

      if (response.success && response.data) {
        setVerificationResult(response.data);

        if (response.data.isConsistent) {
          toast.success('System is consistent', {
            description: 'The MyPts hub data matches the actual profile balances.',
          });
        } else {
          toast.warning('System inconsistency detected', {
            description: response.data.message,
          });
        }
      } else {
        toast.error('Failed to verify system consistency', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error verifying system consistency:', error);
      toast.error('Failed to verify system consistency', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!reconcileReason.trim()) {
      toast.error('Reason is required', {
        description: 'Please provide a reason for the reconciliation.',
      });
      return;
    }

    setIsReconciling(true);
    try {
      const response = await myPtsHubApi.reconcileSupply(reconcileReason);

      if (response.success && response.data) {
        toast.success('Successfully reconciled system supply', {
          description: response.data.message,
        });
        setReconcileReason('');
        // Verify again to show updated status
        handleVerify();
      } else {
        toast.error('Failed to reconcile system supply', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error reconciling system supply:', error);
      toast.error('Failed to reconcile system supply', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsReconciling(false);
    }
  };

  // Function to perform automatic verification
  const performAutoCheck = async () => {
    try {
      const response = await myPtsHubApi.verifySystemConsistency();

      if (response.success && response.data) {
        setVerificationResult(response.data);

        // Save the current time as the last check time
        const now = new Date();
        setLastAutoCheck(now);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('mypts-last-auto-check', now.toISOString());
        }

        if (!response.data.isConsistent) {
          toast.warning('System inconsistency detected during automatic check', {
            description: response.data.message,
          });
        }
      } else {
        console.error('Failed automatic system verification:', response.message);
      }
    } catch (error) {
      console.error('Error during automatic system verification:', error);
    }
  };

  // Save settings to localStorage when they change
  const saveSettingsToLocalStorage = (enabled: boolean, interval: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mypts-auto-check-enabled', enabled.toString());
      localStorage.setItem('mypts-check-interval', interval);
    }
  };

  // Custom handlers for setting changes that also update localStorage
  const handleAutoCheckToggle = (enabled: boolean) => {
    setAutoCheckEnabled(enabled);
    saveSettingsToLocalStorage(enabled, checkInterval);
  };

  const handleIntervalChange = (interval: string) => {
    setCheckInterval(interval);
    saveSettingsToLocalStorage(autoCheckEnabled, interval);
  };

  // Set up the automatic check interval
  useEffect(() => {
    if (autoCheckEnabled) {
      // Clear any existing interval
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }

      // Calculate the next check time
      const intervalMinutes = parseInt(checkInterval, 10);
      const nextCheck = new Date();
      nextCheck.setMinutes(nextCheck.getMinutes() + intervalMinutes);
      setNextCheckTime(nextCheck);

      // Set up the new interval
      checkIntervalRef.current = setInterval(() => {
        performAutoCheck();

        // Update next check time
        const nextCheck = new Date();
        nextCheck.setMinutes(nextCheck.getMinutes() + intervalMinutes);
        setNextCheckTime(nextCheck);
      }, intervalMinutes * 60 * 1000);

      // Perform an initial check
      performAutoCheck();

      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
    } else {
      // Clean up when disabled
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      setNextCheckTime(null);
    }
  }, [autoCheckEnabled, checkInterval]);

  // Update the countdown timer
  useEffect(() => {
    if (autoCheckEnabled && nextCheckTime) {
      // Update the time remaining every second
      timerRef.current = setInterval(() => {
        const now = new Date();
        const diff = nextCheckTime.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining('Checking now...');
          return;
        }

        // Format the remaining time
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else {
      setTimeRemaining('');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [autoCheckEnabled, nextCheckTime]);

  // Initialize localStorage on first mount and clean up intervals on component unmount
  useEffect(() => {
    // Save initial state to localStorage if it doesn't exist
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('mypts-auto-check-enabled') === null) {
        localStorage.setItem('mypts-auto-check-enabled', 'true');
      }
      if (localStorage.getItem('mypts-check-interval') === null) {
        localStorage.setItem('mypts-check-interval', checkInterval);
      }
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
      >
        <Card className="bg-white dark:bg-black border-0 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl font-semibold text-black dark:text-white tracking-tight">System Verification</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-light">
                  Verify and reconcile the MyPts system integrity
                </CardDescription>
              </div>
              <motion.div
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#0066FF] dark:bg-[#0A84FF] flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </motion.div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8">
            <motion.div
              className="space-y-6 sm:space-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Automatic verification settings */}
              <motion.div variants={itemVariants} className="space-y-5 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-black dark:text-white">Periodic Verification</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light">
                      Automatically check system consistency at regular intervals
                    </p>
                  </div>
                  <Switch
                    checked={autoCheckEnabled}
                    onCheckedChange={handleAutoCheckToggle}
                    aria-label="Toggle automatic verification"
                    className="data-[state=checked]:bg-[#0066FF] dark:data-[state=checked]:bg-[#0A84FF] data-[state=checked]:text-white"
                  />
                </div>

                {autoCheckEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="check-interval" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Check Interval
                      </Label>
                      <Select
                        value={checkInterval}
                        onValueChange={handleIntervalChange}
                        disabled={!autoCheckEnabled}
                      >
                        <SelectTrigger id="check-interval" className="w-full bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus:ring-[#0066FF] dark:focus:ring-[#0A84FF] focus:border-[#0066FF] dark:focus:border-[#0A84FF]">
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg">
                          <SelectItem value="5">Every 5 minutes</SelectItem>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every hour</SelectItem>
                          <SelectItem value="360">Every 6 hours</SelectItem>
                          <SelectItem value="720">Every 12 hours</SelectItem>
                          <SelectItem value="1440">Every 24 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Status
                      </Label>
                      <div className="flex items-center h-10 px-4 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                        {timeRemaining ? (
                          <div className="flex items-center text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-neutral-500 dark:text-neutral-400" />
                            <span>Next check in {timeRemaining}</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                            <span>Not active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {lastAutoCheck && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 pt-1 font-light">
                    Last automatic check: {lastAutoCheck.toLocaleString()}
                  </div>
                )}
              </motion.div>

              {/* Manual verification */}
              <motion.div variants={itemVariants} className="space-y-4 sm:space-y-5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                  <div>
                    <h3 className="text-sm font-medium text-black dark:text-white">Manual Verification</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light">
                      Check if the hub's circulating supply matches the sum of all profile balances
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVerify}
                    disabled={isLoading}
                    className="h-9 px-4 border-[#0066FF] dark:border-[#0A84FF] text-[#0066FF] dark:text-[#0A84FF] hover:bg-[#F0F7FF] dark:hover:bg-[#0A2A4F] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Now'
                    )}
                  </Button>
                </div>

                <AnimatePresence mode="wait">
                  {verificationResult && (
                    <motion.div
                      key={verificationResult.isConsistent ? "consistent" : "inconsistent"}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        mass: 1
                      }}
                      className={`p-6 rounded-xl border ${verificationResult.isConsistent
                        ? 'bg-[#F5F9FF] dark:bg-[#0A1A2F] border-[#E1EAFF] dark:border-[#1A3A5F]'
                        : 'bg-[#FFF1F0] dark:bg-[#2F1A1A] border-[#FFCECB] dark:border-[#5F2A2A]'
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        {verificationResult.isConsistent ? (
                          <motion.div
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#0066FF] dark:bg-[#0A84FF] flex items-center justify-center"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 15,
                              delay: 0.2
                            }}
                          >
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                            >
                              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </motion.div>
                          </motion.div>
                        ) : (
                          <motion.div
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#FF3B30] dark:bg-[#FF453A] flex items-center justify-center"
                            initial={{ scale: 0, rotate: 180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 15,
                              delay: 0.2
                            }}
                          >
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{
                                opacity: 1,
                                scale: [1, 1.2, 1],
                              }}
                              transition={{
                                delay: 0.5,
                                repeat: 2,
                                duration: 1,
                              }}
                            >
                              <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </motion.div>
                          </motion.div>
                        )}
                        <div className="flex-1 text-center sm:text-left">
                          <p className={`font-medium text-base sm:text-lg ${verificationResult.isConsistent
                            ? 'text-[#0066FF] dark:text-[#0A84FF]'
                            : 'text-[#FF3B30] dark:text-[#FF453A]'
                            }`}>
                            {verificationResult.message}
                          </p>

                          {verificationResult.isConsistent && (
                            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-light">
                              All profile balances match the hub's circulating supply. The system is in perfect balance.
                            </p>
                          )}

                          <div className="mt-4 space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                            <div className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                                <span className="font-light">Hub circulating:</span>
                                <span className="font-medium">{verificationResult.hubCirculatingSupply.toLocaleString()} MyPts</span>
                              </div>
                            </div>
                            <div className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                                <span className="font-light">Actual circulating:</span>
                                <span className="font-medium">{verificationResult.actualCirculatingSupply.toLocaleString()} MyPts</span>
                              </div>
                            </div>

                            {verificationResult.isConsistent ? (
                              <div className="text-xs sm:text-sm text-[#34C759] dark:text-[#30D158] mt-2">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                                  <span className="font-light">Difference:</span>
                                  <span className="font-medium">0 MyPts</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs sm:text-sm text-[#FF3B30] dark:text-[#FF453A] mt-2">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                                  <span className="font-light">Difference:</span>
                                  <span className="font-medium">
                                    {Math.abs(verificationResult.difference).toLocaleString()} MyPts
                                    {verificationResult.difference > 0 ? ' (excess)' : ' (missing)'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {verificationResult.isConsistent && (
                              <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                                <div className="flex items-center gap-2 text-sm text-[#34C759] dark:text-[#30D158]">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Last verified: {new Date().toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-light">
                                  The system verification ensures that all MyPts tokens are properly accounted for across all user profiles.
                                  This verification helps maintain the integrity and trust in the MyPts ecosystem.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {verificationResult && !verificationResult.isConsistent && (
                <motion.div
                  variants={itemVariants}
                  className="space-y-4 sm:space-y-5 pt-4 sm:pt-6 border-t border-neutral-100 dark:border-neutral-800"
                >
                  <div>
                    <h3 className="text-sm font-medium text-black dark:text-white">Reconcile System</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light">
                      This operation will adjust the hub data to match the actual profile balances.
                      {verificationResult.difference > 0
                        ? ' New MyPts will be issued to match the excess in circulation.'
                        : ' MyPts will be moved from circulation to reserve to match the actual balances.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reconcileReason" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Reason for Reconciliation
                    </Label>
                    <Input
                      id="reconcileReason"
                      placeholder="Provide a reason for this reconciliation"
                      value={reconcileReason}
                      onChange={(e) => setReconcileReason(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-[#0066FF] dark:focus-visible:ring-[#0A84FF] focus-visible:border-[#0066FF] dark:focus-visible:border-[#0A84FF]"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light">
                      This will be recorded in the system logs
                    </p>
                  </div>

                  <div className="flex justify-center sm:justify-end">
                    <Button
                      variant="default"
                      onClick={handleReconcile}
                      disabled={isReconciling || !reconcileReason.trim()}
                      className="w-full sm:w-auto bg-[#0066FF] hover:bg-[#0055DD] text-white dark:bg-[#0A84FF] dark:hover:bg-[#0A74EE] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isReconciling ? (
                        <>
                          <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                          Reconciling...
                        </>
                      ) : (
                        'Reconcile System'
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </MotionConfig>
  );
}
