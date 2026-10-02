import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext.js';

interface WhatsAppButtonProps {
  customMessage?: string;
  variant?: 'floating' | 'inline' | 'compact';
  className?: string;
  showNumber?: boolean;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  customMessage,
  variant = 'inline',
  className = '',
  showNumber = false,
}) => {
  const { storeSettings } = useStore();

  const phoneLink = storeSettings.whatsapp_link_number || '6285819822250';
  const displayNumber = storeSettings.whatsapp_number || '085819822250';
  const defaultText = storeSettings.whatsapp_default_message || 'Halo Vortex ID, saya ingin bertanya mengenai produk.';
  const message = encodeURIComponent(customMessage || defaultText);
  const waUrl = `https://wa.me/${phoneLink}?text=${message}`;

  if (variant === 'floating') {
    return (
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 active:scale-95 font-medium text-sm group ${className}`}
        aria-label="Chat WhatsApp Vortex ID"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="hidden sm:inline">Chat WhatsApp</span>
      </a>
    );
  }

  if (variant === 'compact') {
    return (
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition ${className}`}
      >
        <MessageCircle className="w-4 h-4 fill-current" />
        Chat WhatsApp
      </a>
    );
  }

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-98 ${className}`}
    >
      <MessageCircle className="w-5 h-5 fill-current" />
      <span>Chat WhatsApp</span>
      {showNumber && <span className="text-xs bg-emerald-800/60 px-2 py-0.5 rounded-full font-mono">{displayNumber}</span>}
    </a>
  );
};
