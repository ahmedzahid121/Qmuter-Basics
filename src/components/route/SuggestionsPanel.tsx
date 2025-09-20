import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import RouteCard from "./RouteCard";

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

interface SuggestionsPanelProps {
  suggestions: Route[];
  selectedRoute: Route | null;
  onRouteSelect: (route: Route) => void;
  userRole: 'driver' | 'rider';
}

export default function SuggestionsPanel({ suggestions, selectedRoute, onRouteSelect, userRole }: SuggestionsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 0, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800">
            {userRole === 'rider' ? 'Available Routes' : 'Route Options'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.map((route, index) => (
            <RouteCard
              key={route.id}
              route={route}
              isSelected={selectedRoute?.id === route.id}
              onSelect={() => onRouteSelect(route)}
              userRole={userRole}
              index={index}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
