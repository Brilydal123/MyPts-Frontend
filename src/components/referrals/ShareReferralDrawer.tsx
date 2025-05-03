import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReferralService from '@/services/referralService';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Clipboard, Mail, Download } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeStyling from '@solana/qr-code-styling';

import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ShareReferralDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
}

const ShareReferralDrawer: React.FC<ShareReferralDrawerProps> = ({ isOpen, onClose, referralCode }) => {
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

  // Get profile info from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedProfileData = localStorage.getItem('profileData');
        if (storedProfileData) {
          const profileData = JSON.parse(storedProfileData);
          if (profileData.profileImage) {
            setProfileImage(profileData.profileImage);
          }
          if (profileData.name) {
            setProfileName(profileData.name);
          }
        }
      } catch (error) {
        console.error('Error parsing profile data from localStorage:', error);
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

  // Effect to update QR code when shareable link or logo type changes
  useEffect(() => {
    if (isOpen && (shareableLink || referralCode) && activeTab === 'qr') {
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
  }, [shareableLink, referralCode, logoType, profileImage, activeTab, isOpen]);

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

            qrCodeRef.current.innerHTML = '';
            qrCode.current.append(qrCodeRef.current);
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [activeTab, shareableLink, referralCode, logoType, profileImage]);

  // Function to download QR code
  const downloadQRCode = () => {
    if (qrCode.current) {
      qrCode.current.download({
        name: `mypts-referral-${referralCode}`,
        extension: 'png'
      });
      toast.success('QR code downloaded successfully!');
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
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        {/* Add CSS to make QR code logo rounded and improve responsiveness */}
        <style jsx global>{`
          /* Make QR code logo rounded */
          svg image {
            border-radius: 50% !important;
            overflow: hidden !important;
          }

          /* Center QR code */
          #qr-code-zzz   max-height: 300px;
          }

          /* Small mobile devices */
          @media (max-width: 375px) {
            #qr-code-container {
              max-width: 200px;
            }
          }
        `}</style>

        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
          <DrawerHeader className="p-0">
            <DrawerTitle className="text-2xl font-bold tracking-tight">Share Your Referral</DrawerTitle>
            <DrawerDescription className="text-base mt-2 opacity-90">
              Invite friends to join MyPts and earn rewards when they sign up and reach 1000+ MyPts.
            </DrawerDescription>
          </DrawerHeader>
        </div>

        <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="grid w-full grid-cols-3 share-modal-tabs bg-transparent p-0 h-auto">
              <TabsTrigger value="link" className="data-[state=active]:shadow-none bg-transparent py-2">Link</TabsTrigger>
              <TabsTrigger value="social" className="data-[state=active]:shadow-none bg-transparent py-2">Social</TabsTrigger>
              <TabsTrigger value="qr" className="data-[state=active]:shadow-none bg-transparent py-2">QR Code</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="link" className="px-6 py-6 share-modal-tabs-content">
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
                    We couldn't generate a shareable link at this time. Please try again later or use your referral code directly.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-3">Shareable Link</h3>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={shareableLink}
                        readOnly
                        className="font-mono text-sm bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                        onClick={() => {
                          navigator.clipboard.writeText(shareableLink);
                          toast.success('Link copied to clipboard!');
                        }}
                      >
                        <Clipboard className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3">Referral Code</h3>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={referralCode}
                        readOnly
                        className="font-mono text-sm bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                        onClick={() => {
                          navigator.clipboard.writeText(referralCode);
                          toast.success('Referral code copied to clipboard!');
                        }}
                      >
                        <Clipboard className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="social" className="px-6 py-6 share-modal-tabs-content">
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
                    We couldn't generate a shareable link at this time. Please try again later or use your referral code directly.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-3">Share on Social Media</h3>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-[#1DA1F2]/10 hover:bg-[#1DA1F2] hover:text-white border-[#1DA1F2]/20 transition-all"
                        onClick={shareViaTwitter}
                      >
                        Twitter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-[#4267B2]/10 hover:bg-[#4267B2] hover:text-white border-[#4267B2]/20 transition-all"
                        onClick={shareViaFacebook}
                      >
                        Facebook
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-[#0077B5]/10 hover:bg-[#0077B5] hover:text-white border-[#0077B5]/20 transition-all"
                        onClick={shareViaLinkedin}
                      >
                        LinkedIn
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-muted/50 hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={shareViaEmail}
                      >
                        Email
                      </Button>
                    </div>
                  </div>

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
                        toast.success('Message copied to clipboard!');
                      }}
                    >
                      <Clipboard className="h-4 w-4 mr-2" /> Copy Message
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3">Share Directly</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
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
                        Share Now
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="qr" className="px-6 py-6 share-modal-tabs-content">
            <div className="space-y-6">
              {isShareLinkLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-10">
                  <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading your QR code...</p>
                </div>
              ) : !shareableLink && !referralCode ? (
                <div className="h-full flex flex-col items-center justify-center py-10">
                  <div className="bg-muted/50 p-4 rounded-full mb-4">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">No QR Code Available</p>
                  <p className="text-sm text-muted-foreground text-center">
                    We couldn't generate a QR code at this time. Please try again later.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center">
                    <div id="qr-code-container" ref={qrCodeRef} className="mb-6"></div>

                    <div className="w-full max-w-sm">
                      <h3 className="text-sm font-medium mb-3">QR Code Options</h3>
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <Button
                          variant={logoType === 'logo1' ? 'default' : 'outline'}
                          size="sm"
                          className="p-2 h-auto"
                          onClick={() => setLogoType('logo1')}
                        >
                          <div className="flex flex-col items-center">
                            <Avatar className="h-8 w-8 mb-1">
                              <AvatarImage src="/profileblack.png" alt="Logo 1" />
                              <AvatarFallback>L1</AvatarFallback>
                            </Avatar>
                            <span className="text-xs">Logo 1</span>
                          </div>
                        </Button>
                        <Button
                          variant={logoType === 'logo2' ? 'default' : 'outline'}
                          size="sm"
                          className="p-2 h-auto"
                          onClick={() => setLogoType('logo2')}
                        >
                          <div className="flex flex-col items-center">
                            <Avatar className="h-8 w-8 mb-1">
                              <AvatarImage src="/profilewhite.png" alt="Logo 2" />
                              <AvatarFallback>L2</AvatarFallback>
                            </Avatar>
                            <span className="text-xs">Logo 2</span>
                          </div>
                        </Button>
                        <Button
                          variant={logoType === 'myLogo' ? 'default' : 'outline'}
                          size="sm"
                          className="p-2 h-auto"
                          onClick={() => setLogoType('myLogo')}
                        >
                          <div className="flex flex-col items-center">
                            <Avatar className="h-8 w-8 mb-1">
                              <AvatarImage src={profileImage} alt="My Logo" />
                              <AvatarFallback>ML</AvatarFallback>
                            </Avatar>
                            <span className="text-xs">My Logo</span>
                          </div>
                        </Button>
                        <Button
                          variant={logoType === 'none' ? 'default' : 'outline'}
                          size="sm"
                          className="p-2 h-auto"
                          onClick={() => setLogoType('none')}
                        >
                          <div className="flex flex-col items-center">
                            <div className="h-8 w-8 mb-1 rounded-full border-2 border-dashed flex items-center justify-center">
                              <span className="text-xs">X</span>
                            </div>
                            <span className="text-xs">No Logo</span>
                          </div>
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                        onClick={downloadQRCode}
                      >
                        <Download className="h-4 w-4 mr-2" /> Download QR Code
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};

export default ShareReferralDrawer;
