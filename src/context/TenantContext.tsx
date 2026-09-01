'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import defaultTenantData from '@/data/defaultTenant.json';

export interface WorkspaceCustomLabels {
  member?: string;
  category?: string;
  [key: string]: any;
}

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  primary_color: string;
  logo_url?: string | null;
  custom_labels?: WorkspaceCustomLabels;
  created_at?: string;
}

export interface TenantData {
  id?: string;
  slug: string;
  name: string;
  tagline?: string;
  primaryColor: string;
  primaryColorLight?: string;
  primaryColorDark?: string;
  logo?: string;
  logo_url?: string | null;
  custom_labels?: WorkspaceCustomLabels;
}

interface TenantContextType {
  workspace: Workspace | null;
  tenant: TenantData;
  isLoading: boolean;
  slug: string;
  setTenant: React.Dispatch<React.SetStateAction<TenantData>>;
  updateTenantColor: (newColor: string) => void;
  refetchWorkspace: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

function adjustColorBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return hex;

  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

interface TenantProviderProps {
  children: React.ReactNode;
  slug?: string;
  initialData?: TenantData;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({
  children,
  slug = 'ellos',
  initialData,
}) => {
  const [currentSlug, setCurrentSlug] = useState<string>(slug);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [tenant, setTenant] = useState<TenantData>(
    initialData || {
      slug: slug || 'ellos',
      name: defaultTenantData.name || 'Ellos Vocal',
      tagline: defaultTenantData.tagline || 'Grupo Vocal & Gestão',
      primaryColor: defaultTenantData.primaryColor || '#D4AF37',
      primaryColorLight: defaultTenantData.primaryColorLight || '#F3E5AB',
      primaryColorDark: defaultTenantData.primaryColorDark || '#AA8822',
      logo: defaultTenantData.logo || '/logo-ellos.svg',
      logo_url: defaultTenantData.logo || '/logo-ellos.svg',
      custom_labels: { member: 'Membro', category: 'Naipe' },
    }
  );

  // Injeção de CSS no DOM apenas no lado do cliente
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const color = workspace?.primary_color || tenant.primaryColor || '#D4AF37';
    document.documentElement.style.setProperty('--theme-primary', color);
    document.documentElement.style.setProperty('--theme-primary-light', adjustColorBrightness(color, 35));
    document.documentElement.style.setProperty('--theme-primary-dark', adjustColorBrightness(color, -35));
  }, [workspace?.primary_color, tenant.primaryColor]);

  // Busca o Workspace no Supabase a partir do slug
  const fetchWorkspace = useCallback(async (targetSlug: string) => {
    setIsLoading(true);
    try {
      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('slug', targetSlug)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const loadedWorkspace: Workspace = {
            id: data.id,
            slug: data.slug,
            name: data.name,
            primary_color: data.primary_color || '#D4AF37',
            logo_url: data.logo_url || null,
            custom_labels: data.custom_labels || { member: 'Membro', category: 'Naipe' },
            created_at: data.created_at,
          };

          setWorkspace(loadedWorkspace);

          const primary = loadedWorkspace.primary_color || '#D4AF37';
          setTenant({
            id: loadedWorkspace.id,
            slug: loadedWorkspace.slug,
            name: loadedWorkspace.name,
            tagline: defaultTenantData.tagline,
            primaryColor: primary,
            primaryColorLight: adjustColorBrightness(primary, 35),
            primaryColorDark: adjustColorBrightness(primary, -35),
            logo: loadedWorkspace.logo_url || defaultTenantData.logo,
            logo_url: loadedWorkspace.logo_url || null,
            custom_labels: loadedWorkspace.custom_labels,
          });
          return;
        }
      }
    } catch (err) {
      console.warn(`[TenantContext] Erro ao buscar workspace para slug "${targetSlug}":`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (slug) {
      setCurrentSlug(slug);
      fetchWorkspace(slug);
    }
  }, [slug, fetchWorkspace]);

  const updateTenantColor = (newColor: string) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-primary', newColor);
      document.documentElement.style.setProperty('--theme-primary-light', adjustColorBrightness(newColor, 35));
      document.documentElement.style.setProperty('--theme-primary-dark', adjustColorBrightness(newColor, -35));
    }
    setTenant((prev) => ({
      ...prev,
      primaryColor: newColor,
      primaryColorLight: adjustColorBrightness(newColor, 35),
      primaryColorDark: adjustColorBrightness(newColor, -35),
    }));
  };

  const refetchWorkspace = async () => {
    await fetchWorkspace(currentSlug);
  };

  return (
    <TenantContext.Provider
      value={{
        workspace,
        tenant,
        isLoading,
        slug: currentSlug,
        setTenant,
        updateTenantColor,
        refetchWorkspace,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant deve ser utilizado dentro de um TenantProvider');
  }
  return context;
}
