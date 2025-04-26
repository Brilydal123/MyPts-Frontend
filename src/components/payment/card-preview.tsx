'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CardPreviewProps {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvc: string;
  flipped: boolean;
}

export function CardPreview({
  cardNumber,
  cardholderName,
  expiryDate,
  cvc,
  flipped
}: CardPreviewProps) {
  const [isFlipped, setIsFlipped] = useState(flipped);

  // Format the card number with spaces
  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Add a space after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');

    // Pad with asterisks if less than 16 digits
    const padded = formatted.padEnd(19, '•').substring(0, 19);

    return padded;
  };

  // Format the expiry date
  const formatExpiryDate = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Add a slash after the first 2 digits
    if (digits.length >= 2) {
      return `${digits.substring(0, 2)}/${digits.substring(2, 4).padEnd(2, '•')}`;
    }

    return digits.padEnd(5, '•');
  };

  // Get card type
  const getCardType = (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');

    // Visa: Starts with 4
    if (/^4/.test(cleanNumber)) {
      return 'visa';
    }

    // Mastercard: Starts with 51-55 or 2221-2720
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(cleanNumber)) {
      return 'mastercard';
    }

    // Amex: Starts with 34 or 37
    if (/^3[47]/.test(cleanNumber)) {
      return 'amex';
    }

    // Discover: Starts with 6011, 622126-622925, 644-649, or 65
    if (/^(6011|622(12[6-9]|1[3-9]|[2-8]|9[0-1][0-9]|92[0-5])|64[4-9]|65)/.test(cleanNumber)) {
      return 'discover';
    }

    return 'unknown';
  };

  // Update flipped state when prop changes
  useEffect(() => {
    setIsFlipped(flipped);
  }, [flipped]);

  const cardType = getCardType(cardNumber);

  return (
    <div
      className="w-full h-56 relative perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-transform duration-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Front of card */}
        <div
          className="absolute w-full h-full backface-hidden rounded-xl p-6 shadow-lg overflow-hidden"
          style={{
            backgroundImage: `url('/images/cards/${
              cardType === 'visa' ? 'visa-bg.jpg' :
              cardType === 'mastercard' ? 'mastercard-bg.jpg' :
              cardType === 'amex' ? 'amex-bg.jpg' :
              cardType === 'discover' ? 'discover-bg.jpg' :
              'default-card-bg.jpg'
            }')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/10"></div>
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex justify-between items-start">
              {/* EMV Chip */}
              <div className="w-12 h-9 rounded-md bg-yellow-500/80 flex items-center justify-center overflow-hidden shadow-md">
                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex flex-col justify-center">
                  <div className="h-1 bg-gray-800/30 my-0.5"></div>
                  <div className="h-1 bg-gray-800/30 my-0.5"></div>
                  <div className="h-1 bg-gray-800/30 my-0.5"></div>
                </div>
              </div>

              {/* Card Brand Logo */}
              <div className="text-white font-bold">
                {cardType === 'visa' && (
                  <div className="text-2xl font-italic tracking-tighter text-white">
                    <span className="italic font-extrabold">VISA</span>
                  </div>
                )}
                {cardType === 'mastercard' && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-500 opacity-80 mr-1"></div>
                    <div className="w-8 h-8 rounded-full bg-yellow-500 opacity-80 -ml-4"></div>
                  </div>
                )}
                {cardType === 'amex' && (
                  <div className="text-lg font-bold text-white">
                    AMERICAN<br />EXPRESS
                  </div>
                )}
                {cardType === 'discover' && (
                  <div className="text-xl font-bold text-white">
                    DISCOVER
                  </div>
                )}
                {cardType === 'unknown' && (
                  <div className="text-xl font-bold text-white">
                    CARD
                  </div>
                )}
              </div>
            </div>

            {/* Card Number */}
            <div className="text-white text-xl font-mono tracking-wider mt-4 drop-shadow-md font-bold">
              <div className="bg-black/20 backdrop-blur-sm py-2 px-3 rounded-md inline-block">
                {formatCardNumber(cardNumber)}
              </div>
            </div>

            {/* Card Details */}
            <div className="flex justify-between mt-2">
              <div className="text-white text-sm bg-black/20 backdrop-blur-sm p-2 rounded-md">
                <div className="uppercase text-xs mb-1 font-medium">Card Holder</div>
                <div className="font-medium uppercase tracking-wide">{cardholderName || 'YOUR NAME'}</div>
              </div>
              <div className="text-white text-sm bg-black/20 backdrop-blur-sm p-2 rounded-md">
                <div className="uppercase text-xs mb-1 font-medium">Expires</div>
                <div className="font-medium tracking-wide">{formatExpiryDate(expiryDate)}</div>
              </div>
            </div>

            {/* Card Network */}
            <div className="absolute bottom-3 right-3 opacity-30">
              {cardType === 'visa' && (
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 5H1v14h22V5zm-1 13H2V6h20v12z" />
                  <path d="M4 11.5h2.5l.6-1.4 1.1 3.3 1.2-4.4 1.1 5.5 1-3 .7 1.4H15" strokeWidth="1" stroke="currentColor" fill="none" />
                </svg>
              )}
              {cardType === 'mastercard' && (
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" fillOpacity="0.3" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className="absolute w-full h-full backface-hidden rounded-xl shadow-lg rotate-y-180 overflow-hidden"
          style={{
            backgroundImage: `url('/images/cards/${
              cardType === 'visa' ? 'visa-bg.jpg' :
              cardType === 'mastercard' ? 'mastercard-bg.jpg' :
              cardType === 'amex' ? 'amex-bg.jpg' :
              cardType === 'discover' ? 'discover-bg.jpg' :
              'default-card-bg.jpg'
            }')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative w-full h-14 bg-black/60 mt-5 z-10"></div>
          <div className="px-6 mt-6 relative z-10">
            {/* CVC strip */}
            <div className="bg-white/90 h-12 flex items-center justify-end px-4 rounded-md shadow-md">
              <div className="font-mono text-gray-800 tracking-wider font-bold text-lg">
                <span>{cvc || '•••'}</span>
              </div>
            </div>

            {/* Signature strip */}
            <div className="mt-6 h-10 bg-white/30 backdrop-blur-sm rounded-sm flex items-center px-3 shadow-sm">
              <div className="text-xs text-white font-mono tracking-widest">
                {cardholderName ? cardholderName.substring(0, 20) : 'AUTHORIZED SIGNATURE'}
              </div>
            </div>

            <div className="mt-8 text-xs text-white text-center bg-black/30 backdrop-blur-sm p-2 rounded-md">
              <p>This card is for demonstration purposes only.</p>
              <p className="mt-2 font-medium">Tap card to flip</p>
            </div>

            {/* Card Network Logo */}
            <div className="absolute bottom-4 right-4">
              {cardType === 'visa' && (
                <div className="text-xl font-italic tracking-tighter text-white/90">
                  <span className="italic font-extrabold">VISA</span>
                </div>
              )}
              {cardType === 'mastercard' && (
                <div className="flex items-center scale-75">
                  <div className="w-8 h-8 rounded-full bg-red-500 opacity-80 mr-1"></div>
                  <div className="w-8 h-8 rounded-full bg-yellow-500 opacity-80 -ml-4"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
