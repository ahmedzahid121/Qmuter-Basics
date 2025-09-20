'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/api";

import SearchPanel from "@/components/route/SearchPanel";
import SuggestionsPanel from "@/components/route/SuggestionsPanel";
import ReviewPanel from "@/components/route/ReviewPanel";
import LiveRouteStatus from "@/components/route/LiveRouteStatus";
import BookingStatus from "@/components/route/BookingStatus";
import RoleToggle from "@/components/route/RoleToggle";

interface Route {
  id: number;
  checkpointStopIds: string[];
  stops: string[];
  eta: { min: number; max: number };
  traffic: 'light' | 'medium' | 'heavy';
  distanceKm: number;
  zones: number;
  price: number;
  availableSeats: number | null;
}

interface SearchState {
  origin: any;
  destination: any;
  snappedOrigin: any;
  snappedDestination: any;
}

interface Booking {
  id: string;
  status: 'HELD' | 'CONFIRMED';
  routeInstance: any;
  boardStopId: string;
  alightStopId: string;
}

export default function PlanRoute() {
  const [userRole, setUserRole] = useState<'driver' | 'rider'>(() => 
    (typeof window !== 'undefined' && localStorage.getItem('qmuter_role') as 'driver' | 'rider') || 'rider'
  );
  const [searchState, setSearchState] = useState<SearchState>({
    origin: null,
    destination: null,
    snappedOrigin: null,
    snappedDestination: null
  });
  const [suggestions, setSuggestions] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [appState, setAppState] = useState<'idle' | 'results' | 'live' | 'booked'>('idle');
  const [activeRoute, setActiveRoute] = useState<any>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('qmuter_role', userRole);
    }
  }, [userRole]);

  const handleSearch = async (searchData: SearchState) => {
    setIsSearching(true);
    setSearchState(searchData);
    
    try {
      // Call backend API to get route suggestions
      const response = await apiService.getRoutes({
        lat: searchData.origin.lat,
        lng: searchData.origin.lng,
        radius: 5000
      });

      if (response.success && response.data) {
        setSuggestions(response.data || []);
        setAppState('results');
      } else {
        // Fallback to mock data if API fails
        const mockSuggestions: Route[] = [
          {
            id: 1,
            checkpointStopIds: ["s100", "s134", "s167", "s240"],
            stops: ["Queen St", "Karangahape Rd", "Ponsonby", "Grey Lynn"],
            eta: { min: 23, max: 28 },
            traffic: 'light',
            distanceKm: 15.3,
            zones: 5,
            price: 8.0,
            availableSeats: userRole === 'rider' ? Math.floor(Math.random() * 4) + 1 : null
          },
          {
            id: 2,
            checkpointStopIds: ["s100", "s120", "s180", "s240"],
            stops: ["Queen St", "Newton", "Eden Terrace", "Grey Lynn"],
            eta: { min: 27, max: 35 },
            traffic: 'medium',
            distanceKm: 16.8,
            zones: 5,
            price: 8.5,
            availableSeats: userRole === 'rider' ? Math.floor(Math.random() * 3) + 1 : null
          },
          {
            id: 3,
            checkpointStopIds: ["s100", "s150", "s190", "s240"],
            stops: ["Queen St", "Symonds St", "Grafton", "Grey Lynn"],
            eta: { min: 31, max: 40 },
            traffic: 'heavy',
            distanceKm: 18.2,
            zones: 5,
            price: 9.0,
            availableSeats: userRole === 'rider' ? Math.floor(Math.random() * 2) + 1 : null
          }
        ];
        setSuggestions(mockSuggestions);
        setAppState('results');
      }
    } catch (error) {
      console.error('Error searching routes:', error);
      // Fallback to mock data
      const mockSuggestions: Route[] = [
        {
          id: 1,
          checkpointStopIds: ["s100", "s134", "s167", "s240"],
          stops: ["Queen St", "Karangahape Rd", "Ponsonby", "Grey Lynn"],
          eta: { min: 23, max: 28 },
          traffic: 'light',
          distanceKm: 15.3,
          zones: 5,
          price: 8.0,
          availableSeats: userRole === 'rider' ? Math.floor(Math.random() * 4) + 1 : null
        },
        {
          id: 2,
          checkpointStopIds: ["s100", "s120", "s180", "s240"],
          stops: ["Queen St", "Newton", "Eden Terrace", "Grey Lynn"],
          eta: { min: 27, max: 35 },
          traffic: 'medium',
          distanceKm: 16.8,
          zones: 5,
          price: 8.5,
          availableSeats: userRole === 'rider' ? Math.floor(Math.random() * 3) + 1 : null
        },
        {
          id: 3,
          checkpointStopIds: ["s100", "s150", "s190", "s240"],
          stops: ["Queen St", "Symonds St", "Grafton", "Grey Lynn"],
          eta: { min: 31, max: 40 },
          traffic: 'heavy',
          distanceKm: 18.2,
          zones: 5,
          price: 9.0,
          availableSeats: userRole === 'rider' ? Math.floor(Math.random() * 2) + 1 : null
        }
      ];
      setSuggestions(mockSuggestions);
      setAppState('results');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
  };

  const handleDriverGoLive = async (routeData: any) => {
    try {
      // Call backend API to create live route
      const response = await apiService.createRoute({
        checkpointStopIds: selectedRoute?.checkpointStopIds || [],
        seatsTotal: routeData.seatsTotal,
        startTime: routeData.startTime,
        price: routeData.price,
        notes: routeData.notes
      });

      if (response.success && response.data) {
        setActiveRoute(response.data);
        setAppState('live');
      } else {
        // Fallback to mock data
        setActiveRoute({
          id: `route_${Date.now()}`,
          ...selectedRoute,
          seatsTotal: routeData.seatsTotal,
          startTime: routeData.startTime,
          price: routeData.price,
          notes: routeData.notes,
          status: 'LIVE'
        });
        setAppState('live');
      }
    } catch (error) {
      console.error('Error creating live route:', error);
      // Fallback to mock data
      setActiveRoute({
        id: `route_${Date.now()}`,
        ...selectedRoute,
        seatsTotal: routeData.seatsTotal,
        startTime: routeData.startTime,
        price: routeData.price,
        notes: routeData.notes,
        status: 'LIVE'
      });
      setAppState('live');
    }
  };

  const handleRiderConfirm = async (bookingData: any) => {
    try {
      // Call backend API to create booking
      const response = await apiService.createBooking({
        routeInstanceId: selectedRoute?.id,
        boardStopId: bookingData.boardStopId,
        alightStopId: bookingData.alightStopId
      });

      if (response.success && response.data) {
        setActiveBooking(response.data);
        setAppState('booked');
      } else {
        // Fallback to mock data
        setActiveBooking({
          id: `booking_${Date.now()}`,
          status: 'HELD',
          routeInstance: selectedRoute,
          boardStopId: bookingData.boardStopId,
          alightStopId: bookingData.alightStopId
        });
        setAppState('booked');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      // Fallback to mock data
      setActiveBooking({
        id: `booking_${Date.now()}`,
        status: 'HELD',
        routeInstance: selectedRoute,
        boardStopId: bookingData.boardStopId,
        alightStopId: bookingData.alightStopId
      });
      setAppState('booked');
    }
  };

  const resetToSearch = () => {
    setSuggestions([]);
    setSelectedRoute(null);
    setActiveRoute(null);
    setActiveBooking(null);
    setAppState('idle');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {appState !== 'idle' && (
              <Button
                variant="ghost"
                onClick={resetToSearch}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <h1 className="text-2xl font-bold text-slate-800">Plan & Confirm Route</h1>
          </div>
          <RoleToggle userRole={userRole} onRoleChange={setUserRole} />
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {appState === 'live' && activeRoute && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LiveRouteStatus route={activeRoute} onEndRoute={resetToSearch} />
            </motion.div>
          )}

          {appState === 'booked' && activeBooking && (
            <motion.div
              key="booked"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BookingStatus booking={activeBooking} onCancel={resetToSearch} />
            </motion.div>
          )}

          {appState === 'idle' || appState === 'results' ? (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid lg:grid-cols-3 gap-6"
            >
              {/* Search Panel */}
              <SearchPanel
                onSearch={handleSearch}
                searchState={searchState}
                isSearching={isSearching}
                userRole={userRole}
              />

              {/* Suggestions Panel */}
              {appState === 'results' && suggestions.length > 0 && (
                <SuggestionsPanel
                  suggestions={suggestions}
                  selectedRoute={selectedRoute}
                  onRouteSelect={handleRouteSelect}
                  userRole={userRole}
                />
              )}

              {/* Review Panel */}
              {selectedRoute && (
                <ReviewPanel
                  route={selectedRoute}
                  userRole={userRole}
                  onDriverGoLive={handleDriverGoLive}
                  onRiderConfirm={handleRiderConfirm}
                  searchState={searchState}
                />
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
