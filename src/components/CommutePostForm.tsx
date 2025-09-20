
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Clock, Users, Send, DollarSign } from "lucide-react";
import { GTFSStopSelector } from "@/components/GTFSStopSelector";
import { EnhancedAddressSelector } from "@/components/EnhancedAddressSelector";
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete";
import { GTFSStop } from "@/lib/gtfs-service";
import { zonePricingService, FareCalculation, Location } from "@/lib/zone-pricing";
import { FareDisplay } from "@/components/ZonePricingDisplay";
import { useToast } from "@/hooks/use-toast";
import { LocationSearch, CurrentLocationButton } from "@/components/PlacesAutocomplete";
import { LazyRoutePreview } from "@/components/LazyMap";

const formSchema = z.object({
  origin: z.string().min(5, { message: "Please enter a valid origin address." }),
  destination: z.string().min(5, { message: "Please enter a valid destination address." }),
  description: z.string().optional(),
  totalSeats: z.number().min(1).max(8),
  pricePerSeat: z.number().min(0),
  currency: z.string().default("NZD"),
  schedule: z.object({
    type: z.enum(["recurring", "one-time"]),
    days: z.array(z.string()).optional(),
    time: z.string(),
    timezone: z.string().default("Pacific/Auckland"),
  }),
});

type FormData = z.infer<typeof formSchema>;

interface CommutePostFormProps {
  onSubmit: (data: FormData) => void;
  loading?: boolean;
  className?: string;
}

export function CommutePostForm({ onSubmit, loading = false, className }: CommutePostFormProps) {
  const [fareCalculation, setFareCalculation] = useState<FareCalculation | null>(null);
  const [originStop, setOriginStop] = useState<GTFSStop | null>(null);
  const [destinationStop, setDestinationStop] = useState<GTFSStop | null>(null);
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "",
      destination: "",
      description: "",
      totalSeats: 4,
      pricePerSeat: 5.00,
      currency: "NZD",
      schedule: {
        type: "recurring",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        time: "08:00",
        timezone: "Pacific/Auckland",
      },
    },
  });

  // Calculate fare when stops are selected
  useEffect(() => {
    if (originStop && destinationStop) {
      const origin: Location = {
        lat: originStop.stop_lat,
        lng: originStop.stop_lon,
        address: originStop.stop_name
      };
      
      const destination: Location = {
        lat: destinationStop.stop_lat,
        lng: destinationStop.stop_lon,
        address: destinationStop.stop_name
      };

      const calculateFare = async () => {
        try {
          const calculation = await zonePricingService.calculateFare(origin, destination);
          setFareCalculation(calculation);
          
          // Update the form with the calculated price
          form.setValue("pricePerSeat", calculation.fare);
          
          toast({
            title: "Fare Calculated",
            description: `Zone-based fare: ${zonePricingService.formatFare(calculation.fare)}`,
          });
        } catch (error) {
          console.error('Failed to calculate fare:', error);
          toast({
            title: "Fare Calculation Error",
            description: "Could not calculate zone-based fare",
            variant: "destructive"
          });
        }
      };

      calculateFare();
    }
  }, [originStop, destinationStop, form, toast]);

  const handleSubmit = (data: FormData) => {
    // Include fare calculation in the submission
    const submissionData = {
      ...data,
      fareCalculation,
      originStop,
      destinationStop
    };
    
    onSubmit(submissionData);
  };

  const handleOriginStopSelect = (stop: GTFSStop) => {
    setOriginStop(stop);
    form.setValue("origin", stop.stop_name);
    setOriginLocation({
      lat: stop.stop_lat,
      lng: stop.stop_lon,
      address: stop.stop_name
    });
  };

  const handleDestinationStopSelect = (stop: GTFSStop) => {
    setDestinationStop(stop);
    form.setValue("destination", stop.stop_name);
    setDestinationLocation({
      lat: stop.stop_lat,
      lng: stop.stop_lon,
      address: stop.stop_name
    });
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Create New Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs defaultValue="route" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="route">Route Details</TabsTrigger>
                  <TabsTrigger value="fare">Fare & Pricing</TabsTrigger>
                  <TabsTrigger value="map">Map Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="route" className="space-y-4">
                  {/* Origin */}
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground"/>
                          Origin
                        </FormLabel>
                        <FormControl>
                          <PlacesAutocomplete
                            placeholder="Search for addresses, places, or landmarks..."
                            onPlaceSelect={(place) => {
                              setOriginLocation(place.location);
                              form.setValue("origin", place.address);
                            }}
                            onLocationSelect={setOriginLocation}
                            onAddressSelect={(location, address) => {
                              setOriginLocation(location);
                              form.setValue("origin", address);
                            }}
                            showCurrentLocation={true}
                            showAddressValidation={true}
                          />
                        </FormControl>
                        <FormDescription>
                          Search for Auckland Transport stops or enter a custom address.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Destination */}
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground"/>
                          Destination
                        </FormLabel>
                        <FormControl>
                          <PlacesAutocomplete
                            placeholder="Search for addresses, places, or landmarks..."
                            onPlaceSelect={(place) => {
                              setDestinationLocation(place.location);
                              form.setValue("destination", place.address);
                            }}
                            onLocationSelect={setDestinationLocation}
                            onAddressSelect={(location, address) => {
                              setDestinationLocation(location);
                              form.setValue("destination", address);
                            }}
                            showCurrentLocation={false}
                            showAddressValidation={true}
                          />
                        </FormControl>
                        <FormDescription>
                          Search for Auckland Transport stops or enter a custom address.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell passengers about your route, pickup points, or any special notes..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Help passengers understand your route better.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Schedule */}
                  <div className="space-y-4">
                    <FormLabel className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground"/>
                      Schedule
                    </FormLabel>
                    
                    <FormField
                      control={form.control}
                      name="schedule.type"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select schedule type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="recurring">Recurring (Daily/Weekly)</SelectItem>
                              <SelectItem value="one-time">One-time Trip</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("schedule.type") === "recurring" && (
                      <div className="grid grid-cols-2 gap-2">
                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                          <label key={day} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={form.watch("schedule.days")?.includes(day)}
                              onChange={(e) => {
                                const currentDays = form.watch("schedule.days") || [];
                                if (e.target.checked) {
                                  form.setValue("schedule.days", [...currentDays, day]);
                                } else {
                                  form.setValue("schedule.days", currentDays.filter(d => d !== day));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm capitalize">{day}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="schedule.time"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Seats */}
                  <FormField
                    control={form.control}
                    name="totalSeats"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground"/>
                          Available Seats
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="8"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How many passengers can you accommodate?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="fare" className="space-y-4">
                  {/* Fare Display */}
                  {fareCalculation ? (
                    <div className="space-y-4">
                      <FareDisplay fare={fareCalculation} />
                      
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Zone-Based Pricing</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Your fare is automatically calculated based on the zones crossed. 
                          This ensures fair, predictable pricing for all passengers.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select origin and destination to see fare calculation</p>
                    </div>
                  )}

                  {/* Manual Price Override */}
                  <FormField
                    control={form.control}
                    name="pricePerSeat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Seat (NZD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.50"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          {fareCalculation 
                            ? `Suggested: ${zonePricingService.formatFare(fareCalculation.fare)} (zone-based)`
                            : "Set your price per seat"
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="map" className="space-y-4">
                  {originLocation && destinationLocation ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Route Preview</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMapPreview(!showMapPreview)}
                        >
                          {showMapPreview ? 'Hide Map' : 'Show Map'}
                        </Button>
                      </div>
                      
                                             {showMapPreview && (
                         <div className="border rounded-lg overflow-hidden">
                           <LazyRoutePreview
                             origin={originLocation}
                             destination={destinationLocation}
                             height="400px"
                           />
                         </div>
                       )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="font-medium text-blue-900">Origin</div>
                          <div className="text-blue-700">{originStop?.stop_name || 'Custom location'}</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="font-medium text-green-900">Destination</div>
                          <div className="text-green-700">{destinationStop?.stop_name || 'Custom location'}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select origin and destination to see route preview</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Submit Button */}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Route...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Create Route
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
