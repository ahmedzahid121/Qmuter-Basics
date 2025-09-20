import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { zonePricingService, Zone, FareCalculation, Location } from '@/lib/zone-pricing';
import { useToast } from '@/hooks/use-toast';
import { MapPin, DollarSign, Clock, TrendingUp, Car, Loader2 } from 'lucide-react';

interface ZonePricingDisplayProps {
  origin?: Location;
  destination?: Location;
  onFareCalculated?: (fare: FareCalculation) => void;
  className?: string;
}

export function ZonePricingDisplay({ origin, destination, onFareCalculated, className }: ZonePricingDisplayProps) {
  const [fareCalculation, setFareCalculation] = useState<FareCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator');
  const [zones, setZones] = useState<Zone[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (origin && destination) {
      calculateFare();
    }
  }, [origin, destination]);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const allZones = await zonePricingService.getAllZones();
      setZones(allZones);
    } catch (error) {
      console.error('Failed to load zones:', error);
    }
  };

  const calculateFare = async () => {
    if (!origin || !destination) return;

    try {
      setLoading(true);
      const calculation = await zonePricingService.calculateFare(origin, destination);
      setFareCalculation(calculation);
      
      if (onFareCalculated) {
        onFareCalculated(calculation);
      }
    } catch (error) {
      console.error('Failed to calculate fare:', error);
      toast({
        title: "Error",
        description: "Failed to calculate fare",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    calculateFare();
  };

  const renderFareCalculation = () => {
    if (!fareCalculation) {
      return (
        <div className="text-center py-8 text-gray-500">
          Enter origin and destination to calculate fare
        </div>
      );
    }

    const breakdown = zonePricingService.getFareBreakdown(fareCalculation);
    const isValid = zonePricingService.validateFareCalculation(fareCalculation);

    return (
      <div className="space-y-4">
        {/* Zone Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-sm text-gray-600">From</div>
            <div 
              className="w-4 h-4 rounded-full mx-auto my-2"
              style={{ backgroundColor: fareCalculation.originZone.color }}
            />
            <div className="font-medium">{fareCalculation.originZone.name}</div>
            <div className="text-xs text-gray-500">{fareCalculation.originZone.description}</div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <div className="text-sm text-gray-600">To</div>
            <div 
              className="w-4 h-4 rounded-full mx-auto my-2"
              style={{ backgroundColor: fareCalculation.destinationZone.color }}
            />
            <div className="font-medium">{fareCalculation.destinationZone.name}</div>
            <div className="text-xs text-gray-500">{fareCalculation.destinationZone.description}</div>
          </div>
        </div>

        {/* Fare Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-lg">{breakdown.totalFare}</span>
            </div>
            <Badge variant={isValid ? "default" : "destructive"}>
              {isValid ? "Valid" : "Check Distance"}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Zones Crossed</div>
              <div className="font-medium">{breakdown.zoneCrossing}</div>
            </div>
            <div>
              <div className="text-gray-600">Distance</div>
              <div className="font-medium">{fareCalculation.distance.toFixed(1)} km</div>
            </div>
            <div>
              <div className="text-gray-600">Est. Time</div>
              <div className="font-medium">{fareCalculation.estimatedTime} min</div>
            </div>
            <div>
              <div className="text-gray-600">vs Uber</div>
              <div className="font-medium text-green-600">Save {breakdown.savings}</div>
            </div>
          </div>
        </div>

        {/* Trip Description */}
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">{fareCalculation.description}</div>
        </div>
      </div>
    );
  };

  const renderPricingTable = () => {
    const pricing = zonePricingService.getPricingStructure();

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Qmuter Zone Pricing</h3>
          <p className="text-sm text-gray-600">Fixed pricing based on zones crossed</p>
        </div>

        <div className="grid gap-3">
          {pricing.map((price) => (
            <div key={price.zonesCrossed} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                  {price.zonesCrossed}
                </div>
                <div>
                  <div className="font-medium">
                    {price.zonesCrossed} zone{price.zonesCrossed > 1 ? 's' : ''} crossed
                  </div>
                  <div className="text-sm text-gray-600">{price.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  {zonePricingService.formatFare(price.fare)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-800">Why Zone Pricing?</span>
          </div>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Predictable, fixed pricing</li>
            <li>• No surge pricing or hidden fees</li>
            <li>• Affordable for solo riders</li>
            <li>• Simple to understand</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderZoneMap = () => {
    if (zones.length === 0) {
      return (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
          <div className="text-sm text-gray-600">Loading zones from GTFS data...</div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Auckland Zones (GTFS-Based)</h3>
          <p className="text-sm text-gray-600">Zones created from Auckland Transport stop data</p>
        </div>

        <div className="grid gap-3">
          {zones.map((zone) => (
            <div key={zone.id} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: zone.color }}
                />
                <div className="flex-1">
                  <div className="font-medium">{zone.name}</div>
                  <div className="text-sm text-gray-600">{zone.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {zone.stops.length} GTFS stops • {zone.boundaryStops.length} boundary stops
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {zone.id}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-800">GTFS Zone System Benefits</span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Based on actual Auckland Transport stop data</li>
            <li>• Accurate zone boundaries using real stop locations</li>
            <li>• Covers entire Auckland region with GTFS coverage</li>
            <li>• Fair pricing based on real transport infrastructure</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Qmuter Zone Pricing (GTFS-Based)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calculator">Fare Calculator</TabsTrigger>
              <TabsTrigger value="pricing">Pricing Table</TabsTrigger>
              <TabsTrigger value="zones">GTFS Zones</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calculator" className="mt-4">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Calculating fare using GTFS data...</div>
                </div>
              ) : (
                renderFareCalculation()
              )}
            </TabsContent>
            
            <TabsContent value="pricing" className="mt-4">
              {renderPricingTable()}
            </TabsContent>
            
            <TabsContent value="zones" className="mt-4">
              {renderZoneMap()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for displaying just the fare calculation
interface FareDisplayProps {
  fare: FareCalculation;
  className?: string;
}

export function FareDisplay({ fare, className }: FareDisplayProps) {
  const breakdown = zonePricingService.getFareBreakdown(fare);

  return (
    <div className={className}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{breakdown.totalFare}</span>
            </div>
            <Badge variant="outline">{breakdown.zoneCrossing}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-600">Distance</div>
              <div className="font-medium">{fare.distance.toFixed(1)} km</div>
            </div>
            <div>
              <div className="text-gray-600">Est. Time</div>
              <div className="font-medium">{fare.estimatedTime} min</div>
            </div>
            <div>
              <div className="text-gray-600">From</div>
              <div className="font-medium">{fare.originZone.name}</div>
            </div>
            <div>
              <div className="text-gray-600">To</div>
              <div className="font-medium">{fare.destinationZone.name}</div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-green-600">
              Save {breakdown.savings} vs Uber
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 