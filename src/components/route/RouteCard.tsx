import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Navigation, Zap, ArrowRight } from "lucide-react";

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

interface RouteCardProps {
  route: Route;
  isSelected: boolean;
  onSelect: () => void;
  userRole: 'driver' | 'rider';
  index: number;
}

export default function RouteCard({ route, isSelected, onSelect, userRole, index }: RouteCardProps) {
  const hasAvailableSeats = route.availableSeats && route.availableSeats > 0;
  
  const trafficIndicator = {
    light: {
      color: 'bg-green-500',
      label: 'Light traffic'
    },
    medium: {
      color: 'bg-orange-400',
      label: 'Medium traffic'
    },
    heavy: {
      color: 'bg-red-500',
      label: 'Heavy traffic'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected
            ? 'ring-2 ring-blue-500 bg-blue-50/50 border-blue-200'
            : 'hover:bg-slate-50/50 border-slate-200'
        }`}
        onClick={onSelect}
      >
        <CardContent className="p-4 space-y-3">
          {/* Stops */}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <Badge variant="outline" className="bg-white/80">{route.stops[0]}</Badge>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            <Badge variant="outline" className="bg-white/80">{route.stops[route.stops.length - 1]}</Badge>
          </div>

          {/* Core Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-1.5" title={trafficIndicator[route.traffic].label}>
                <div className={`w-2.5 h-2.5 rounded-full ${trafficIndicator[route.traffic].color}`}></div>
                <span>{route.eta.min}-{route.eta.max} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4" />
                <span>{route.distanceKm} km</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-800">
                ${route.price.toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* CTA and Status */}
          <div className="flex items-center justify-between pt-2">
            {userRole === 'rider' ? (
              <div className="flex items-center gap-2">
                {route.availableSeats !== null ? (
                    hasAvailableSeats ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <Zap className="w-3 h-3 mr-1" />
                      {route.availableSeats} seat{route.availableSeats === 1 ? '' : 's'} left
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      Route Full
                    </Badge>
                  )
                ) : (
                    <Badge variant="outline" className="text-slate-600">Notify Me</Badge>
                )}
              </div>
            ) : (
              <Badge variant="outline" className="text-slate-600">
                Suggested Route
              </Badge>
            )}
            
            <Button
              size="sm"
              variant={isSelected ? "default" : "outline"}
              className={isSelected ? "bg-blue-500 hover:bg-blue-600" : ""}
              disabled={userRole === 'rider' && route.availableSeats === 0}
            >
              {userRole === 'rider' 
                ? hasAvailableSeats ? 'Join' : 'Notify'
                : 'Select'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
