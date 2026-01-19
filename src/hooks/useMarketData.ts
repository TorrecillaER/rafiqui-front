'use client';

import { useState, useEffect } from 'react';
import { marketApi, MarketAsset, MaterialStock, BackendArtPiece } from '@/lib/api';
import { materials as mockMaterials, artPieces as mockArtPieces } from '@/data/marketData';
import type { Material, ArtPiece } from '@/types';

interface UseMarketDataReturn {
  materials: Material[];
  assets: MarketAsset[];
  artPieces: ArtPiece[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Transformar categoría del backend al formato del frontend
const categoryMap: Record<string, 'nft' | 'sculpture' | 'installation'> = {
  NFT: 'nft',
  SCULPTURE: 'sculpture',
  INSTALLATION: 'installation',
};

export function useMarketData(): UseMarketDataReturn {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [artPieces, setArtPieces] = useState<ArtPiece[]>(mockArtPieces);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [materialsRes, assetsRes, artRes] = await Promise.all([
        marketApi.getMaterials(),
        marketApi.getAssets(),
        marketApi.getArt(),
      ]);

      // Transformar materiales del backend al formato del frontend
      if (materialsRes.data) {
        const cloudinaryBase = 'https://res.cloudinary.com/dszhbfyki/image/upload';
        // Mapeo de tipos en inglés a nombres de archivo en español
        const imageNames: Record<string, string> = {
          ALUMINUM: 'aluminio',
          GLASS: 'vidrio',
          SILICON: 'silicio',
          COPPER: 'cobre',
        };
        const transformedMaterials: Material[] = materialsRes.data.map((m) => ({
          id: `mat-${m.type}`,
          name: m.name,
          type: m.type.toLowerCase() as 'aluminum' | 'glass' | 'silicon' | 'copper',
          quantity: m.availableKg, // Mantener en kg
          pricePerTon: m.pricePerKg, // Precio por kg
          available: m.availableKg > 0,
          image: `${cloudinaryBase}/${imageNames[m.type] || m.type.toLowerCase()}.png`,
        }));
        setMaterials(transformedMaterials);
      }

      if (assetsRes.data) {
        setAssets(assetsRes.data);
      }

      // Transformar arte del backend al formato del frontend
      if (artRes.data && artRes.data.length > 0) {
        const transformedArt: ArtPiece[] = artRes.data.map((a) => ({
          id: a.id,
          title: a.title,
          artist: a.artist,
          description: a.description,
          price: a.price,
          image: a.imageUrl || '/art/default.jpg',
          category: categoryMap[a.category] || 'sculpture',
          isAvailable: a.isAvailable,
        }));
        setArtPieces(transformedArt);
      } else if (!artRes.error) {
        // Si no hay error pero tampoco datos, usar mock
        setArtPieces(mockArtPieces);
      }

      if (materialsRes.error || assetsRes.error) {
        console.warn('Using mock data due to API error');
        setMaterials(mockMaterials);
      }

      if (artRes.error) {
        console.warn('Using mock art data due to API error');
        setArtPieces(mockArtPieces);
      }
    } catch (err) {
      setError('Error al cargar datos del marketplace');
      // Usar datos mock como fallback
      setMaterials(mockMaterials);
      setArtPieces(mockArtPieces);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    materials,
    assets,
    artPieces,
    isLoading,
    error,
    refetch: fetchData,
  };
}
