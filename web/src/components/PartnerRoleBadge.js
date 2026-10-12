'use client';

import React from 'react';
import {
  FaCrown,
  FaGem,
  FaAward,
  FaMedal,
  FaHandshake,
} from 'react-icons/fa';

export const PARTNER_ROLE_CONFIGS = {
  Strategic: {
    label: 'Strategic',
    icon: FaCrown,
    colorName: 'red',
    badgeClass:
      'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/80',
    cardBorder:
      'border-red-300 hover:border-red-500 dark:border-red-500/60 dark:hover:border-red-400',
    cardRing: 'ring-1 ring-red-500/20',
    dotColor: 'bg-red-500',
    accentText: 'text-red-600 dark:text-red-400',
    description: 'Strategic Partner',
  },
  Diamond: {
    label: 'Diamond',
    icon: FaGem,
    colorName: 'sky',
    badgeClass:
      'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/80',
    cardBorder:
      'border-sky-300 hover:border-sky-500 dark:border-sky-500/60 dark:hover:border-sky-400',
    cardRing: 'ring-1 ring-sky-500/20',
    dotColor: 'bg-sky-400',
    accentText: 'text-sky-600 dark:text-sky-400',
    description: 'Diamond Partner',
  },
  Platinum: {
      label: 'Platinum',
      icon: FaAward,
      colorName: 'indigo',
      badgeClass:
        'bg-gradient-to-r from-indigo-50 via-slate-50 to-violet-100 text-indigo-950 border-indigo-300 dark:from-indigo-950/80 dark:via-slate-900/80 dark:to-violet-950/80 dark:text-indigo-200 dark:border-indigo-400/60 shadow-sm shadow-indigo-500/10',
      cardBorder:
        'border-indigo-300 hover:border-indigo-500 dark:border-indigo-400/60 dark:hover:border-indigo-300',
      cardRing: 'ring-1 ring-indigo-500/25 shadow-md shadow-indigo-500/5',
      dotColor: 'bg-indigo-400',
      accentText: 'text-indigo-600 dark:text-indigo-300',
      description: 'Platinum Partner',
  },
  Gold: {
    label: 'Gold',
    icon: FaMedal,
    colorName: 'amber',
    badgeClass:
      'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/80',
    cardBorder:
      'border-amber-300 hover:border-amber-500 dark:border-amber-500/60 dark:hover:border-amber-400',
    cardRing: 'ring-1 ring-amber-500/20',
    dotColor: 'bg-amber-400',
    accentText: 'text-amber-600 dark:text-amber-400',
    description: 'Gold Partner',
  },
  Partner: {
    label: 'Partner',
    icon: FaHandshake,
    colorName: 'zinc',
    badgeClass:
      'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700/80',
    cardBorder:
      'border-zinc-300 hover:border-zinc-500 dark:border-zinc-500/60 dark:hover:border-zinc-300',
    cardRing: 'ring-1 ring-zinc-400/15',
    dotColor: 'bg-zinc-400',
    accentText: 'text-zinc-600 dark:text-zinc-400',
    description: 'Collaborating Partner',
  },
};

export function getPartnerRoleConfig(rawRole) {
  const normalized = (rawRole || '').toString().trim().toLowerCase();
  if (normalized === 'strategic') return PARTNER_ROLE_CONFIGS.Strategic;
  if (normalized === 'diamond') return PARTNER_ROLE_CONFIGS.Diamond;
  if (normalized === 'platinum') return PARTNER_ROLE_CONFIGS.Platinum;
  if (normalized === 'gold') return PARTNER_ROLE_CONFIGS.Gold;
  return PARTNER_ROLE_CONFIGS.Partner;
}

export default function PartnerRoleBadge({
  role,
  size = 'sm',
  showIcon = true,
  className = '',
}) {
  const config = getPartnerRoleConfig(role);
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1 font-semibold tracking-wide',
    sm: 'text-xs px-2.5 py-1 gap-1.5 font-semibold tracking-wide',
    md: 'text-sm px-3.5 py-1.5 gap-2 font-bold tracking-wide',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5 shrink-0',
    sm: 'w-3 h-3 shrink-0',
    md: 'w-3.5 h-3.5 shrink-0',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border uppercase transition-colors select-none ${config.badgeClass} ${sizeClasses[size] || sizeClasses.sm} ${className}`}
      title={config.description}
    >
      {showIcon && Icon && <Icon className={iconSizes[size] || iconSizes.sm} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}
