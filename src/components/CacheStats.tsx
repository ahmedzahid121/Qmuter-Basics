"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, TrendingUp, TrendingDown } from 'lucide-react';
import { mapsCache } from '@/lib/maps-cache';

export function CacheStats() {
  const [stats, setStats] = useState(mapsCache.getStats());
  const [isVisible, setIsVisible] = useState(false);

  const updateStats = () => {
    setStats(mapsCache.getStats());
  };

  useEffect(() => {
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    mapsCache.clear();
    updateStats();
  };

  const getCacheEfficiency = () => {
    const totalRequests = stats.geocodeCacheSize + stats.directionsCacheSize + stats.placeCacheSize;
    if (totalRequests === 0) return 0;
    
    // Estimate cache hit rate based on cache size
    const estimatedHitRate = Math.min(totalRequests / 100, 0.95); // Cap at 95%
    return Math.round(estimatedHitRate * 100);
  };

  const getCostSavings = () => {
    // Estimate cost savings based on cached requests
    const totalCached = stats.geocodeCacheSize + stats.directionsCacheSize + stats.placeCacheSize;
    const estimatedSavings = totalCached * 0.001; // Rough estimate of cost per request
    return estimatedSavings.toFixed(2);
  };

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Database className="h-4 w-4 mr-2" />
        Cache Stats
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Database className="h-4 w-4 mr-2" />
            API Cache Stats
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span>Geocode Cache:</span>
            <Badge variant="secondary">{stats.geocodeCacheSize}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Directions Cache:</span>
            <Badge variant="secondary">{stats.directionsCacheSize}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Places Cache:</span>
            <Badge variant="secondary">{stats.placeCacheSize}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Session Tokens:</span>
            <Badge variant="secondary">{stats.sessionTokensSize}</Badge>
          </div>
        </div>

        <div className="border-t pt-2">
          <div className="flex items-center justify-between text-xs">
            <span>Cache Efficiency:</span>
            <div className="flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              <span className="font-medium">{getCacheEfficiency()}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Estimated Savings:</span>
            <div className="flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-blue-600" />
              <span className="font-medium">${getCostSavings()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={updateStats}
            className="flex-1 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClearCache}
            className="flex-1 text-xs"
          >
            Clear Cache
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Development-only cache monitor
export function DevCacheMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState(mapsCache.getStats());

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        setStats(mapsCache.getStats());
      }, 2000);
      return () => clearInterval(interval);
    }
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="text-xs"
      >
        <Database className="h-3 w-3 mr-1" />
        Dev Cache
      </Button>
      
      {isVisible && (
        <Card className="mt-2 w-64 shadow-lg">
          <CardContent className="p-3">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Geocode:</span>
                <span className="font-mono">{stats.geocodeCacheSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Directions:</span>
                <span className="font-mono">{stats.directionsCacheSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Places:</span>
                <span className="font-mono">{stats.placeCacheSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Sessions:</span>
                <span className="font-mono">{stats.sessionTokensSize}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 