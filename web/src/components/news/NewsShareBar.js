'use client';

import { useState, useEffect } from 'react';
import { FaLinkedin, FaFacebook, FaEnvelope, FaLink, FaCheck, FaShareAlt, FaFilePdf, FaRss } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

/**
 * NewsShareBar provides social sharing, copy-link, PDF export, and RSS syndication
 * utilities for news articles.
 * Follows modern accessibility standards with keyboard navigation, aria labels,
 * and live region feedback when copying the article link.
 */
export default function NewsShareBar({ article }) {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);

  // Set the current URL and detect native share support once mounted in the browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
      if (typeof navigator !== 'undefined' && navigator.share) {
        setSupportsNativeShare(true);
      }
    }
  }, []);

  const title = article?.title || 'AIRI @ UTCN News';
  const summary = article?.summary || '';
  const shareUrl = currentUrl || (article?.slug ? `https://airi.utcluj.ro/news&events/news/${article.slug}` : 'https://airi.utcluj.ro');

  // Copy current URL to clipboard with fallback
  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for non-secure contexts or older browsers
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy article URL to clipboard:', err);
    }
  };

  // Open native system share dialog (e.g. mobile devices)
  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title,
        text: summary,
        url: shareUrl,
      });
    } catch (err) {
      // User cancelled share or share failed
      if (err.name !== 'AbortError') {
        console.error('Native share failed:', err);
      }
    }
  };

  // Trigger browser print to allow saving as a clean PDF or printing directly
  const handlePrintPdf = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Construct sharing URLs
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = encodeURIComponent(summary ? `${summary}\n\n${shareUrl}` : shareUrl);

  const shareLinks = [
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: FaLinkedin,
      hoverClass: 'hover:bg-[#0077b5] hover:text-white dark:hover:bg-[#0077b5]',
      ariaLabel: 'Share this article on LinkedIn',
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: FaXTwitter,
      hoverClass: 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black',
      ariaLabel: 'Share this article on X (Twitter)',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: FaFacebook,
      hoverClass: 'hover:bg-[#1877f2] hover:text-white dark:hover:bg-[#1877f2]',
      ariaLabel: 'Share this article on Facebook',
    },
    {
      name: 'Email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedSummary}`,
      icon: FaEnvelope,
      hoverClass: 'hover:bg-gray-800 hover:text-white dark:hover:bg-gray-200 dark:hover:text-gray-900',
      ariaLabel: 'Share this article via Email',
    },
  ];

  return (
    <div
      className="print:hidden my-6 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 backdrop-blur-sm transition-colors"
      role="region"
      aria-label="Article sharing options"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Social Share Group */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-1 select-none">
            Share
          </span>

          {shareLinks.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.ariaLabel}
                title={item.ariaLabel}
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${item.hoverClass}`}
              >
                <Icon className="w-4 h-4" />
              </a>
            );
          })}

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label={copied ? 'Article link copied' : 'Copy article link to clipboard'}
            title={copied ? 'Link copied!' : 'Copy link'}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-xs font-medium cursor-pointer"
          >
            {copied ? (
              <>
                <FaCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <FaLink className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Native Mobile Share Button */}
          {supportsNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              aria-label="Share article via device options"
              title="More sharing options"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            >
              <FaShareAlt className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Screen reader live notification */}
          <span className="sr-only" aria-live="polite">
            {copied ? 'Article link copied to clipboard' : ''}
          </span>
        </div>

        {/* Document & Syndication Actions (Print / PDF & RSS) */}
        <div className="flex items-center gap-2">
          {/* Save as PDF Button */}
          <button
            type="button"
            onClick={handlePrintPdf}
            aria-label="Save or print this article as PDF"
            title="Save or print article as PDF"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:white transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-xs font-medium cursor-pointer"
          >
            <FaFilePdf className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>Save as PDF</span>
          </button>

          {/* RSS Feed Link */}
          <a
            href="/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Subscribe to AIRI news via RSS feed"
            title="RSS Feed"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 dark:hover:bg-orange-950/40 dark:hover:text-orange-400 dark:hover:border-orange-700 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 text-xs font-medium"
          >
            <FaRss className="w-3.5 h-3.5 text-orange-500" />
            <span>RSS</span>
          </a>
        </div>
      </div>
    </div>
  );
}
