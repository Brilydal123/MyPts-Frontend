import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReferralService from '@/services/referralService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Clipboard, Mail, Download } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeStyling from '@solana/qr-code-styling';

import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ShareReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
}

const ShareReferralModal: React.FC<ShareReferralModalProps> = ({ isOpen, onClose, referralCode }) => {
  const [activeTab, setActiveTab] = useState('link');
  const [logoType, setLogoType] = useState<'logo1' | 'logo2' | 'myLogo' | 'none'>('logo1');

  // Get user profile image from session if available
  const { data: session } = useSession();

  // Get profile info from localStorage
  const [profileImage, setProfileImage] = useState<string>('/profileblack.png');
  const [profileName, setProfileName] = useState<string>('User');

  // Create a ref for the QR code container
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const qrCode = useRef<any>(null);



  // Effect to get profile image from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Try to get profile data from localStorage
        const profileId = localStorage.getItem('selectedProfileId');
        const userDataStr = localStorage.getItem('user');

        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData.profileImage) {
            setProfileImage(userData.profileImage);
            console.log('Using profile image from localStorage:', userData.profileImage);
          }
          if (userData.fullName || userData.name) {
            setProfileName(userData.fullName || userData.name);
          }
        }

        // If we have a profile ID, try to get the profile image from the API
        if (profileId) {
          fetch(`/api/profiles/${profileId}`)
            .then(res => res.json())
            .then(data => {
              if (data.success && data.profile && data.profile.profileImage) {
                setProfileImage(data.profile.profileImage);
                console.log('Using profile image from API:', data.profile.profileImage);
                if (data.profile.name) {
                  setProfileName(data.profile.name);
                }
              }
            })
            .catch(err => console.error('Error fetching profile:', err));
        }
      } catch (error) {
        console.error('Error getting profile data:', error);
      }
    }
  }, []);

  // Get shareable link from the API
  const {
    data: shareData,
    isLoading: isShareLinkLoading
  } = useQuery({
    queryKey: ['referralShareLink', referralCode],
    queryFn: () => ReferralService.getShareableLink(),
    enabled: isOpen && !!referralCode,
  });

  const shareableLink = shareData?.shareableLink || '';


  // Function to get QR code size based on screen width
  const getQRCodeSize = () => {
    if (typeof window !== 'undefined') {
      // Get the screen width
      const screenWidth = window.innerWidth;

      // Adjust size based on screen width
      if (screenWidth <= 375) {
        return 200; // Small mobile devices
      } else if (screenWidth <= 640) {
        return 250; // Mobile devices
      } else {
        return 300; // Tablets and larger
      }
    }
    return 300; // Default size
  };

  // Effect to create and update QR code when data changes
  useEffect(() => {
    if (typeof window !== 'undefined' && qrCodeRef.current && (shareableLink || referralCode)) {
      const qrSize = getQRCodeSize();

      if (!qrCode.current) {
        // Create new QR code instance
        qrCode.current = new QRCodeStyling({
          width: qrSize,
          height: qrSize,
          type: 'svg',
          data: shareableLink || referralCode,
          dotsOptions: {
            color: '#000000',
            type: "extra-rounded"
          },
          cornersSquareOptions: {
            type: 'extra-rounded'
          },
          cornersDotOptions: {
            type: 'dot'
          },
          backgroundOptions: {
            color: '#ffffff',
          },
          imageOptions: {
            crossOrigin: 'anonymous',
            margin: 5,
            imageSize: 0.25,
            hideBackgroundDots: true,
          }
        });
      } else {
        // Update existing QR code data and size
        qrCode.current.update({
          data: shareableLink || referralCode,
          width: qrSize,
          height: qrSize,
        });
      }

      // Update QR code image based on selected logo type
      if (logoType !== 'none') {
        try {
          const logoUrl = logoType === 'logo1'
            ? '/profileblack.png'
            : logoType === 'logo2'
              ? '/profilewhite.png'
              : profileImage;

          // Use the logo directly without waiting for createRoundedImageUrl
          qrCode.current.update({
            image: logoUrl,
            imageOptions: {
              hideBackgroundDots: true,
              imageSize: 0.25,
              crossOrigin: 'anonymous',
              margin: 5,
            }
          });
        } catch (error) {
          console.error('Error updating QR code image:', error);
        }
      } else {
        qrCode.current.update({
          image: undefined
        });
      }

      // Clear the container and append the QR code
      if (qrCodeRef.current) {
        qrCodeRef.current.innerHTML = '';
        qrCode.current.append(qrCodeRef.current);
      }
    }
  }, [shareableLink, referralCode, logoType, profileImage]);

  // Effect to ensure QR code is rendered when the QR tab is selected
  useEffect(() => {
    // Only run this effect when the QR tab is selected
    if (activeTab === 'qr' && (shareableLink || referralCode)) {
      // Small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        if (qrCodeRef.current) {
          const qrSize = getQRCodeSize();

          // If QR code already exists, just re-append it
          if (qrCode.current) {
            qrCodeRef.current.innerHTML = '';
            qrCode.current.update({
              width: qrSize,
              height: qrSize
            });
            qrCode.current.append(qrCodeRef.current);
          }
          // Otherwise create a new QR code
          else {
            qrCode.current = new QRCodeStyling({
              width: qrSize,
              height: qrSize,
              type: 'svg',
              data: shareableLink || referralCode,
              dotsOptions: {
                color: '#000000',
                type: "extra-rounded"
              },
              cornersSquareOptions: {
                type: 'extra-rounded'
              },
              cornersDotOptions: {
                type: 'dot'
              },
              backgroundOptions: {
                color: '#ffffff',
              },
              imageOptions: {
                crossOrigin: 'anonymous',
                margin: 5,
                imageSize: 0.25,
                hideBackgroundDots: true,
              }
            });

            // Set logo if needed
            if (logoType !== 'none') {
              const logoUrl = logoType === 'logo1'
                ? '/profileblack.png'
                : logoType === 'logo2'
                  ? '/profilewhite.png'
                  : profileImage;

              qrCode.current.update({
                image: logoUrl,
                imageOptions: {
                  hideBackgroundDots: true,
                  imageSize: 0.25,
                  crossOrigin: 'anonymous',
                  margin: 5,
                }
              });
            }

            // Append to container
            qrCode.current.append(qrCodeRef.current);
          }
        }
      }, 100); // Small delay to ensure DOM is ready

      return () => clearTimeout(timer);
    }
  }, [activeTab, shareableLink, referralCode, logoType, profileImage]);





  const handleCopyLink = async () => {
    if (shareableLink) {
      await navigator.clipboard.writeText(shareableLink);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleCopyCode = async () => {
    if (referralCode) {
      await navigator.clipboard.writeText(referralCode);
      toast.success('Referral code copied to clipboard!');
    }
  };

  const shareMessage = `Join me on MyPts! Use my referral code ${referralCode} to sign up and we'll both earn rewards.`;

  const shareViaTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareableLink)}`;
    window.open(url, '_blank');
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableLink)}&quote=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const shareViaLinkedin = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableLink)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Join me on MyPts';
    const body = `${shareMessage}\n\n${shareableLink}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Add CSS to make QR code logo rounded and improve responsiveness */}
        <style jsx global>{`
          /* Make QR code logo rounded */
          svg image {
            border-radius: 50% !important;
            overflow: hidden !important;
          }

          /* Force the image to be circular with a mask */
          #qr-code-container svg image {
            mask-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='black'/%3E%3C/svg%3E");
            mask-size: contain;
            mask-repeat: no-repeat;
            mask-position: center;
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='black'/%3E%3C/svg%3E");
            -webkit-mask-size: contain;
            -webkit-mask-repeat: no-repeat;
            -webkit-mask-position: center;
          }

          .share-modal-tabs [data-state="active"] {
            background: linear-gradient(to right, var(--primary), var(--primary-foreground));
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            font-weight: 600;
            position: relative;
          }

          .share-modal-tabs [data-state="active"]::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 3px;
            background: var(--primary);
            border-radius: 3px;
            transition: all 0.2s ease;
          }

          /* Responsive tab content height */
          .share-modal-tabs-content {
            min-height: auto;
            max-height: calc(80vh - 150px);
            overflow-y: auto;
          }

          /* QR code container responsiveness */
          #qr-code-container {
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
            aspect-ratio: 1/1;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          #qr-code-container > div {
            width: 100% !important;
            height: 100% !important;
            max-width: 300px;
            max-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          #qr-code-container svg {
            width: 100% !important;
            height: 100% !important;
            max-width: 300px;
            max-height: 300px;
          }

          /* Responsive adjustments for mobile */
          @media (max-width: 640px) {
            .share-modal-tabs-content {
              padding-top: 1rem;
              padding-bottom: 1rem;
              max-height: calc(80vh - 120px);
            }

            #qr-code-container {
              max-width: 250px;
            }
          }

          /* Small mobile devices */
          @media (max-width: 375px) {
            #qr-code-container {
              max-width: 200px;
            }
          }
        `}</style>

        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 sm:p-8 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">Share Your Referral</DialogTitle>
            <DialogDescription className="text-base mt-2 opacity-90">
              Invite friends to join MyPts and earn rewards when they sign up and reach 1000+ MyPts.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 sm:px-8 pt-6">
            <TabsList className="grid w-full grid-cols-3 share-modal-tabs bg-transparent p-0 h-auto">
              <TabsTrigger value="link" className="data-[state=active]:shadow-none bg-transparent py-2">Link</TabsTrigger>
              <TabsTrigger value="social" className="data-[state=active]:shadow-none bg-transparent py-2">Social</TabsTrigger>
              <TabsTrigger value="qr" className="data-[state=active]:shadow-none bg-transparent py-2">QR Code</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="link" className="px-6 sm:px-8 py-6 share-modal-tabs-content">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Shareable Link</p>
                  {isShareLinkLoading && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <div className="h-3 w-3 mr-2 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                      Loading...
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 items-center">
                  <div className="relative flex-1">
                    <Input
                      value={shareableLink || ''}
                      placeholder={isShareLinkLoading ? "Loading shareable link..." : "No shareable link available"}
                      readOnly
                      className="pr-10 font-mono text-sm bg-muted/50"
                    />
                    {shareableLink && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    disabled={!shareableLink}
                    className="transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link directly with friends via message or email
                </p>
              </div>

              <div className="h-px w-full bg-border"></div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Referral Code</p>
                </div>
                <div className="flex space-x-2 items-center">
                  <div className="relative flex-1">
                    <Input
                      value={referralCode || ''}
                      placeholder="No referral code available"
                      readOnly
                      className="pr-10 font-mono text-sm tracking-wider bg-muted/50"
                    />
                    {referralCode && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    disabled={!referralCode}
                    className="transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Friends can enter this code during registration
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="px-6 sm:px-8 py-6 share-modal-tabs-content">
            <div className="space-y-6">
              {isShareLinkLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-10">
                  <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading your shareable link...</p>
                </div>
              ) : !shareableLink ? (
                <div className="h-full flex flex-col items-center justify-center py-10">
                  <div className="bg-muted/50 p-4 rounded-full mb-4">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">No Shareable Link Available</p>
                  <p className="text-sm text-muted-foreground text-center">
                    We couldn't generate your shareable link at this time.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-3">Share via Social Media</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose a platform to share your referral link
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="justify-start group hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                        onClick={shareViaTwitter}
                      >
                        <div className="mr-3 p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-500 dark:text-blue-400">
                            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                          </svg>
                        </div>
                        Twitter
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start group hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                        onClick={shareViaFacebook}
                      >
                        <div className="mr-3 p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-600 dark:text-blue-400">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                          </svg>
                        </div>
                        Facebook
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start group hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                        onClick={shareViaLinkedin}
                      >
                        <div className="mr-3 p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-700 dark:text-blue-400">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                            <rect x="2" y="9" width="4" height="12"></rect>
                            <circle cx="4" cy="4" r="2"></circle>
                          </svg>
                        </div>
                        LinkedIn
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start group hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-800 transition-all"
                        onClick={shareViaEmail}
                      >
                        <div className="mr-3 p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-colors">
                          <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        Email
                      </Button>
                    </div>
                  </div>

                  <div className="h-px w-full bg-border"></div>

                  <div>
                    <h3 className="text-sm font-medium mb-3">Copy Referral Message</h3>
                    <div className="bg-muted/50 p-4 rounded-lg border text-sm">
                      <p>Join me on MyPts and get rewarded! Use my referral link to sign up:</p>
                      <p className="mt-2 font-medium">{shareableLink}</p>
                      <p className="mt-2">Or use my referral code: <span className="font-mono font-medium">{referralCode}</span></p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full justify-center hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                      onClick={() => {
                        const message = `Join me on MyPts and get rewarded! Use my referral link to sign up:\n\n${shareableLink}\n\nOr use my referral code: ${referralCode}`;
                        navigator.clipboard.writeText(message);
                        toast.success('Referral message copied to clipboard!');
                      }}
                    >
                      <Clipboard className="h-4 w-4 mr-2" /> Copy Message
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="qr" className="px-6 sm:px-8 py-6 share-modal-tabs-content">
            <div className="space-y-6">
              {isShareLinkLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-10">
                  <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-4"></div>
                  <p className="text-sm text-muted-foreground">Generating QR code...</p>
                </div>
              ) : !shareableLink ? (
                <div className="h-full flex flex-col items-center justify-center py-10">
                  <div className="bg-muted/50 p-4 rounded-full mb-4">
                    <Download className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">No QR Code Available</p>
                  <p className="text-sm text-muted-foreground text-center">
                    We couldn't generate your QR code at this time.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center">
                    {/* Main content container with subtle gradient background */}
                    <div className="w-full max-w-md mx-auto bg-gradient-to-b from-background to-muted/20 rounded-xl overflow-hidden max-h-[70vh] overflow-y-auto">
                      {/* QR Code Section */}
                      <div className="flex flex-col items-center pt-4 sm:pt-8 pb-4 sm:pb-6">
                        <div
                          className="relative bg-white rounded-xl shadow-sm border border-border/40 p-3 sm:p-5"
                          id="qr-code-container"
                        >
                          <div className="relative w-full h-full" ref={qrCodeRef}></div>

                          {/* Subtle reflection effect */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-xl"></div>
                        </div>

                        <p className="text-sm text-muted-foreground mt-4 max-w-[250px] text-center">
                          Scan this QR code to join MyPts using your referral
                        </p>
                      </div>

                      {/* Logo Options Section */}
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                        <div className="bg-background/80 backdrop-blur-sm border border-border/40 rounded-lg p-3 sm:p-4">
                          <h3 className="text-sm font-medium mb-2 sm:mb-3 flex items-center">
                            <span className="h-1 w-1 rounded-full bg-primary mr-2"></span>
                            Choose Logo Style
                          </h3>

                          <div className="grid grid-cols-4 gap-2 sm:gap-3">
                            <div
                              className={`group flex flex-col items-center justify-center cursor-pointer transition-all`}
                              onClick={() => setLogoType('logo1')}
                            >
                              <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-1.5 border-2 transition-all ${logoType === 'logo1' ? 'border-primary shadow-sm shadow-primary/20' : 'border-transparent'}`}>
                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-border/40 group-hover:border-primary/40 transition-all">
                                  <img src="/profileblack.png" alt="Logo 1" className="h-6 w-6 object-contain" />
                                </div>
                              </div>
                              <span className={`text-xs transition-colors ${logoType === 'logo1' ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>Logo 1</span>
                            </div>

                            <div
                              className={`group flex flex-col items-center justify-center cursor-pointer transition-all`}
                              onClick={() => setLogoType('logo2')}
                            >
                              <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-1.5 border-2 transition-all ${logoType === 'logo2' ? 'border-primary shadow-sm shadow-primary/20' : 'border-transparent'}`}>
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-border/40 group-hover:border-primary/40 transition-all">
                                  <img src="/profilewhite.png" alt="Logo 2" className="h-6 w-6 object-contain" />
                                </div>
                              </div>
                              <span className={`text-xs transition-colors ${logoType === 'logo2' ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>Logo 2</span>
                            </div>

                            <div
                              className={`group flex flex-col items-center justify-center cursor-pointer transition-all`}
                              onClick={() => setLogoType('myLogo')}
                            >
                              <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-1.5 border-2 transition-all ${logoType === 'myLogo' ? 'border-primary shadow-sm shadow-primary/20' : 'border-transparent'}`}>
                                <div className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden border border-border/40 group-hover:border-primary/40 transition-all">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={profileImage} alt={profileName} />
                                    <AvatarFallback>{profileName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                </div>
                              </div>
                              <span className={`text-xs transition-colors ${logoType === 'myLogo' ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>My Logo</span>
                            </div>

                            <div
                              className={`group flex flex-col items-center justify-center cursor-pointer transition-all`}
                              onClick={() => setLogoType('none')}
                            >
                              <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-1.5 border-2 transition-all ${logoType === 'none' ? 'border-primary shadow-sm shadow-primary/20' : 'border-transparent'}`}>
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border/40 group-hover:border-primary/40 transition-all">
                                  <span className="text-xs font-medium text-muted-foreground">None</span>
                                </div>
                              </div>
                              <span className={`text-xs transition-colors ${logoType === 'none' ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>No Logo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-3 space-y-2 sm:space-y-0 mt-4 sm:mt-6 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full px-4 border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all w-full sm:w-auto"
                        onClick={() => {
                          if (qrCode.current) {
                            try {
                              qrCode.current.download({
                                extension: 'png',
                                name: `mypts-referral-${referralCode}`
                              });
                              toast.success('QR code downloaded!');
                            } catch (error) {
                              console.error('Failed to download QR code:', error);
                              toast.error('Failed to download QR code');
                            }
                          } else {
                            toast.error('QR code not found');
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" /> Download
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-full px-4 transition-all w-full sm:w-auto"
                        onClick={() => {
                          try {
                            if (navigator.share) {
                              navigator.share({
                                title: 'My MyPts Referral',
                                text: `Join me on MyPts! Use my referral code: ${referralCode}`,
                                url: shareableLink
                              }).then(() => {
                                toast.success('Referral shared successfully!');
                              }).catch((error) => {
                                if (error.name !== 'AbortError') {
                                  toast.error('Failed to share referral');
                                }
                              });
                            } else {
                              const message = `Join me on MyPts! Use my referral link: ${shareableLink} or code: ${referralCode}`;
                              navigator.clipboard.writeText(message);
                              toast.success('Referral message copied to clipboard!');
                            }
                          } catch (error) {
                            console.error('Failed to share:', error);
                            toast.error('Failed to share referral');
                          }
                        }}
                      >
                        Share Referral
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareReferralModal;
