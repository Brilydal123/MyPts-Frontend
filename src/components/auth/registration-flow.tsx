"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EmailRegistrationStep } from "./registration-steps/email-step";
import { BasicInfoStep } from "./registration-steps/basic-info-step";
import { EligibilityStep } from "./registration-steps/eligibility-step";
import { SetupStep } from "./registration-steps/setup-step";
import { SecureStep } from "./registration-steps/secure-step";
import { VerificationStep } from "./registration-steps/verification-step";

export type RegistrationData = {
  email: string;
  fullName: string;
  username: string;
  wasReferred: boolean;
  referralCode?: string;
  accountType: "MYSELF" | "SOMEONE_ELSE";
  dateOfBirth: Date | null;
  countryOfResidence: string;
  accountCategory: "PRIMARY_ACCOUNT" | "SECONDARY_ACCOUNT";
  phoneNumber: string;
  password: string;
  verificationMethod: "EMAIL" | "PHONE";
};

export const RegistrationFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    email: "",
    fullName: "",
    username: "",
    wasReferred: false,
    accountType: "MYSELF",
    dateOfBirth: null,
    countryOfResidence: "",
    accountCategory: "PRIMARY_ACCOUNT",
    phoneNumber: "",
    password: "",
    verificationMethod: "EMAIL",
  });

  const updateRegistrationData = (data: Partial<RegistrationData>) => {
    setRegistrationData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const steps = [
    { title: "Email", component: EmailRegistrationStep, showInProgress: false },
    {
      title: "Get Started",
      component: BasicInfoStep,
      showInProgress: true,
      stepNumber: 1,
    },
    {
      title: "Eligibility",
      component: EligibilityStep,
      showInProgress: true,
      stepNumber: 2,
    },
    {
      title: "Set Up",
      component: SetupStep,
      showInProgress: true,
      stepNumber: 3,
    },
    {
      title: "Secure",
      component: SecureStep,
      showInProgress: true,
      stepNumber: 4,
    },
    { title: "Verify", component: VerificationStep, showInProgress: false },
  ];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
  };
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    setDirection(1);
    nextStep();
  };

  const handlePrev = () => {
    setDirection(-1);
    prevStep();
  };

  // Render the progress indicator with animations
  const renderProgressIndicator = () => {
    // Filter steps that should be shown in the progress bar
    const progressSteps = steps.filter((step) => step.showInProgress);

    // Animation variants for step circles
    const circleVariants = {
      inactive: {
        scale: 1,
        backgroundColor: "#e5e7eb", // gray-200
        color: "#6b7280", // gray-500
        transition: { duration: 0.3 },
      },
      active: {
        scale: [1, 1.1, 1],
        backgroundColor: "#000000", // black
        color: "#ffffff", // white
        transition: {
          duration: 0.5,
          scale: {
            duration: 0.5,
            times: [0, 0.5, 1],
            ease: "easeInOut",
          },
        },
      },
      completed: {
        backgroundColor: "#000000", // black
        color: "#ffffff", // white
        transition: { duration: 0.3 },
      },
    };

    // Animation variants for connecting lines
    const lineVariants = {
      inactive: {
        backgroundColor: "#e5e7eb", // gray-200
        transition: { duration: 0.3 },
      },
      active: {
        backgroundColor: "#000000", // black
        transition: { duration: 0.5, delay: 0.2 },
      },
    };

    // Animation variants for step titles
    const titleVariants = {
      inactive: {
        color: "#6b7280", // gray-500
        fontWeight: 400,
        transition: { duration: 0.3 },
      },
      active: {
        color: "#000000", // black
        fontWeight: 500,
        transition: { duration: 0.3 },
      },
    };

    return (
      <motion.div
        className="flex flex-col items-center justify-center mb-6 mt-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center">
          {progressSteps.map((step, index) => {
            const stepIndex = steps.indexOf(step);
            const isActive = stepIndex === currentStep;
            const isCompleted = stepIndex < currentStep;

            return (
              <div key={index} className="flex items-center">
                <motion.div
                  className="flex items-center justify-center w-10 h-10 rounded-full"
                  variants={circleVariants}
                  initial="inactive"
                  animate={
                    isActive ? "active" : isCompleted ? "completed" : "inactive"
                  }
                >
                  {step.stepNumber}
                </motion.div>

                {index < progressSteps.length - 1 && (
                  <motion.div
                    className="w-12 h-0.5 mx-1"
                    variants={lineVariants}
                    initial="inactive"
                    animate={stepIndex < currentStep ? "active" : "inactive"}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center mt-2">
          {progressSteps.map((step, index) => {
            const stepIndex = steps.indexOf(step);
            const isActiveOrCompleted = stepIndex <= currentStep;

            return (
              <div key={index} className="flex items-center">
                <motion.div
                  className="text-xs w-10 text-center"
                  variants={titleVariants}
                  initial="inactive"
                  animate={isActiveOrCompleted ? "active" : "inactive"}
                >
                  {step.title}
                </motion.div>

                {index < progressSteps.length - 1 && (
                  <div className="w-12 mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const CurrentStepComponent =
    steps[currentStep]?.component || EmailRegistrationStep;

  return (
    <div className="flex items-center justify-center min-h-screen ">
      <div className="flex flex-col gap-5 w-full max-w-lg border rounded-xl overflow-hidden p-10">
        {steps[currentStep]?.showInProgress && renderProgressIndicator()}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
              scale: { duration: 0.4 },
            }}
            className="flex-1 flex flex-col"
          >
            <div className="">
              <CurrentStepComponent
                registrationData={registrationData}
                updateRegistrationData={updateRegistrationData}
                onNext={handleNext}
                onPrev={handlePrev}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
