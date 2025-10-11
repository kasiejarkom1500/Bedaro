import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

interface HomeStatsData {
  jumlahPenduduk: number | null;
  pertumbuhanEkonomi: number | null;
  tingkatKemiskinan: number | null;
  tingkatPengangguran: number | null;
  ipmKabupaten: number | null;
  inflasiBulanTerakhir: number | null;
}

export function useHomeStats() {
  const [stats, setStats] = useState<HomeStatsData>({
    jumlahPenduduk: null,
    pertumbuhanEkonomi: null,
    tingkatKemiskinan: null,
    tingkatPengangguran: null,
    ipmKabupaten: null,
    inflasiBulanTerakhir: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mapping indikator berdasarkan nama/pattern
  const indicatorMappings = {
    jumlahPenduduk: ['jumlah penduduk', 'penduduk'],
    pertumbuhanEkonomi: ['pertumbuhan ekonomi', 'pertumbuhan pdrb', 'pdrb'],
    tingkatKemiskinan: ['tingkat kemiskinan', 'kemiskinan'],
    tingkatPengangguran: ['tingkat pengangguran terbuka', 'pengangguran terbuka', 'tpt'],
    ipmKabupaten: ['ipm sp2020lf', 'ipm', 'indeks pembangunan manusia'],
    inflasiBulanTerakhir: ['inflasi', 'inflasi bulanan'],
  };

  const findIndicatorByPattern = (data: any[], patterns: string[]) => {
    for (const pattern of patterns) {
      const found = data.find(item => 
        item.indicator_name?.toLowerCase().includes(pattern.toLowerCase()) ||
        item.indicator_code?.toLowerCase().includes(pattern.toLowerCase())
      );
      if (found) return found;
    }
    return null;
  };

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all indicator data from different categories using public API
      const responses = await Promise.allSettled([
        fetch('/api/public/indicator-data?category=Statistik%20Demografi%20%26%20Sosial&limit=100'),
        fetch('/api/public/indicator-data?category=Statistik%20Ekonomi&limit=100'),
        fetch('/api/public/indicator-data?category=Statistik%20Lingkungan%20Hidup%20%26%20Multi-Domain&limit=100'),
      ]);

      const allData: any[] = [];
      
      for (const response of responses) {
        if (response.status === 'fulfilled') {
          try {
            const result = await response.value.json();
            if (result.success && result.data && result.data.data) {
              allData.push(...result.data.data);
            }
          } catch (err) {
            console.error('Error parsing response:', err);
          }
        }
      }

      if (allData.length === 0) {
        throw new Error('No data available');
      }

      // Group by indicator and get latest year for each
      const indicatorGroups: { [key: string]: any[] } = {};
      
      allData.forEach(item => {
        const key = item.indicator_name || item.indicator_code || 'unknown';
        if (!indicatorGroups[key]) {
          indicatorGroups[key] = [];
        }
        indicatorGroups[key].push(item);
      });

      // Get latest data for each indicator
      const latestData: any[] = [];
      Object.values(indicatorGroups).forEach(group => {
        const latest = group.sort((a, b) => b.year - a.year)[0];
        latestData.push(latest);
      });

      // Find data for each stat using patterns
      const newStats: HomeStatsData = {
        jumlahPenduduk: null,
        pertumbuhanEkonomi: null,
        tingkatKemiskinan: null,
        tingkatPengangguran: null,
        ipmKabupaten: null,
        inflasiBulanTerakhir: null,
      };

      // Match indicators based on patterns
      const jumlahPendudukData = findIndicatorByPattern(latestData, indicatorMappings.jumlahPenduduk);
      if (jumlahPendudukData && jumlahPendudukData.value !== null) {
        const value = typeof jumlahPendudukData.value === 'string' ? parseFloat(jumlahPendudukData.value) : jumlahPendudukData.value;
        newStats.jumlahPenduduk = isNaN(value) ? null : value;
      }

      const pertumbuhanEkonomiData = findIndicatorByPattern(latestData, indicatorMappings.pertumbuhanEkonomi);
      if (pertumbuhanEkonomiData && pertumbuhanEkonomiData.value !== null) {
        const value = typeof pertumbuhanEkonomiData.value === 'string' ? parseFloat(pertumbuhanEkonomiData.value) : pertumbuhanEkonomiData.value;
        newStats.pertumbuhanEkonomi = isNaN(value) ? null : value;
      }

      const tingkatKemiskinanData = findIndicatorByPattern(latestData, indicatorMappings.tingkatKemiskinan);
      if (tingkatKemiskinanData && tingkatKemiskinanData.value !== null) {
        const value = typeof tingkatKemiskinanData.value === 'string' ? parseFloat(tingkatKemiskinanData.value) : tingkatKemiskinanData.value;
        newStats.tingkatKemiskinan = isNaN(value) ? null : value;
      }

      const tingkatPengangguranData = findIndicatorByPattern(latestData, indicatorMappings.tingkatPengangguran);
      if (tingkatPengangguranData && tingkatPengangguranData.value !== null) {
        const value = typeof tingkatPengangguranData.value === 'string' ? parseFloat(tingkatPengangguranData.value) : tingkatPengangguranData.value;
        newStats.tingkatPengangguran = isNaN(value) ? null : value;
      }

      const ipmKabupatenData = findIndicatorByPattern(latestData, indicatorMappings.ipmKabupaten);
      if (ipmKabupatenData && ipmKabupatenData.value !== null) {
        const value = typeof ipmKabupatenData.value === 'string' ? parseFloat(ipmKabupatenData.value) : ipmKabupatenData.value;
        newStats.ipmKabupaten = isNaN(value) ? null : value;
      }

      const inflasiBulanTerakhirData = findIndicatorByPattern(latestData, indicatorMappings.inflasiBulanTerakhir);
      if (inflasiBulanTerakhirData && inflasiBulanTerakhirData.value !== null) {
        const value = typeof inflasiBulanTerakhirData.value === 'string' ? parseFloat(inflasiBulanTerakhirData.value) : inflasiBulanTerakhirData.value;
        newStats.inflasiBulanTerakhir = isNaN(value) ? null : value;
      }

      setStats(newStats);

      // Debug logging
      console.log('✅ Home stats loaded successfully:', {
        jumlahPenduduk: newStats.jumlahPenduduk,
        pertumbuhanEkonomi: newStats.pertumbuhanEkonomi,
        tingkatKemiskinan: newStats.tingkatKemiskinan,
        tingkatPengangguran: newStats.tingkatPengangguran,
        ipmKabupaten: newStats.ipmKabupaten,
        inflasiBulanTerakhir: newStats.inflasiBulanTerakhir,
        totalIndicators: latestData.length
      });

    } catch (error) {
      console.error('Error fetching home stats:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Set fallback data if API fails
      setStats({
        jumlahPenduduk: 365000, // Fallback value
        pertumbuhanEkonomi: 5.12,
        tingkatKemiskinan: 8.45,
        tingkatPengangguran: 4.23,
        ipmKabupaten: 69.85,
        inflasiBulanTerakhir: 2.1,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
  }, []);

  const formatValue = (value: number | null, type: 'number' | 'percentage' | 'index' = 'number'): string => {
    if (value === null || value === undefined) return 'N/A';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if it's a valid number
    if (isNaN(numValue)) return 'N/A';
    
    switch (type) {
      case 'number':
        if (numValue >= 1000000) {
          return `${(numValue / 1000000).toFixed(1)}M`;
        } else if (numValue >= 1000) {
          return `${Math.round(numValue / 1000)}K`;
        }
        return Math.round(numValue).toString();
        
      case 'percentage':
        return `${numValue.toFixed(2)}%`;
        
      case 'index':
        return numValue.toFixed(2);
        
      default:
        return numValue.toString();
    }
  };

  return {
    stats,
    loading,
    error,
    formatValue,
    refresh: fetchAllStats,
  };
}