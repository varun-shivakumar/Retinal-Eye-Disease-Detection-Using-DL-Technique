// import React, { useState, useEffect, useRef } from 'react';
// import { motion } from 'framer-motion';
// import { 
//   MapPin, Phone, Clock, Star, Navigation, Calendar, Search
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { useLanguage } from '@/contexts/LanguageContext';
// import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

// interface Doctor {
//   id: string;
//   name: string;
//   lat: number;
//   lng: number;
//   address: string;
//   rating?: number;
//   user_ratings_total?: number;
//   distanceKm?: number;
// }

// const containerStyle = { width: '100%', height: '100%' };

// const DoctorsPage = () => {
//   const { t } = useLanguage();
//   const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
//   const [doctors, setDoctors] = useState<Doctor[]>([]);
//   const [searchLocation, setSearchLocation] = useState('');
//   const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

//   const mapRef = useRef<google.maps.Map | null>(null);

//   const { isLoaded } = useJsApiLoader({
//     googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
//     libraries: ['places']
//   });

//   // Get user's location
//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(pos => {
//         setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
//       });
//     }
//   }, []);

//   const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
//     const toRad = (x: number) => (x * Math.PI) / 180;
//     const R = 6371; // km
//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);
//     const a =
//       Math.sin(dLat/2)**2 +
//       Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//     return R * c;
//   };

//   const fetchDoctors = () => {
//     if (!mapRef.current || !userLocation) return;

//     const service = new google.maps.places.PlacesService(mapRef.current);

//     const request: google.maps.places.PlaceSearchRequest = {
//       location: new google.maps.LatLng(userLocation.lat, userLocation.lng),
//       radius: 5000, // 5 km
//       type: ['doctor'],
//       keyword: 'ophthalmologist'
//     };

//     service.nearbySearch(request, (results, status) => {
//       if (status === google.maps.places.PlacesServiceStatus.OK && results) {
//         const formattedDoctors: Doctor[] = results.map(place => ({
//           id: place.place_id!,
//           name: place.name || 'Unnamed Clinic',
//           lat: place.geometry?.location?.lat() || 0,
//           lng: place.geometry?.location?.lng() || 0,
//           address: place.vicinity || 'Address not available',
//           rating: place.rating,
//           user_ratings_total: place.user_ratings_total,
//           distanceKm: place.geometry?.location ? haversineDistance(
//             userLocation.lat, userLocation.lng,
//             place.geometry.location.lat(),
//             place.geometry.location.lng()
//           ) : undefined
//         }));
//         setDoctors(formattedDoctors);
//       }
//     });
//   };

//   const handleBookAppointment = (doctor: Doctor) => {
//     alert(`Booking appointment with ${doctor.name}`);
//   };

//   const handleGetDirections = (doctor: Doctor) => {
//     window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(doctor.address)}`, '_blank');
//   };

//   if (!isLoaded || !userLocation) return <p>Loading map and location...</p>;

//   const center = userLocation;

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="space-y-8">
//         <div className="text-center space-y-4">
//           <h1 className="text-3xl md:text-4xl font-bold">{t('Doctors nearby')}</h1>
//           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//             Find qualified eye specialists and ophthalmologists in your area.
//           </p>
//         </div>

//         {/* Search & Fetch */}
//         <Card className="max-w-2xl mx-auto">
//           <CardContent className="flex gap-4 p-6">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
//               <Input
//                 placeholder="Enter your location (optional)"
//                 value={searchLocation}
//                 onChange={(e) => setSearchLocation(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//             <Button onClick={fetchDoctors} variant="medical">
//               <MapPin className="h-4 w-4 mr-2"/> Find Nearby Ophthalmologists
//             </Button>
//           </CardContent>
//         </Card>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* Map */}
//           <Card className="h-96 lg:h-auto">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/> Map View</CardTitle>
//               <CardDescription>Ophthalmologists near you</CardDescription>
//             </CardHeader>
//             <CardContent className="p-0 h-80 lg:h-96 rounded-lg overflow-hidden">
//               <GoogleMap
//                 mapContainerStyle={containerStyle}
//                 center={center}
//                 zoom={14}
//                 onLoad={map => mapRef.current = map}
//               >
//                 {doctors.map(doc => (
//                   <Marker
//                     key={doc.id}
//                     position={{ lat: doc.lat, lng: doc.lng }}
//                     title={doc.name}
//                     onClick={() => setSelectedDoctor(doc)}
//                   />
//                 ))}
//                 <Marker position={center} title="You are here"/>
//               </GoogleMap>
//             </CardContent>
//           </Card>

//           {/* Doctors List */}
//           <div className="space-y-4 max-h-[600px] overflow-y-auto">
//             {doctors.map((doc, idx) => (
//               <motion.div key={doc.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
//                 <Card className="hover:shadow-medical transition-all cursor-pointer" onClick={() => setSelectedDoctor(doc)}>
//                   <CardContent className="p-6">
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <h3 className="text-lg font-semibold">{doc.name}</h3>
//                         <p className="text-primary font-medium">Ophthalmologist</p>
//                       </div>
//                       <div className="text-right">
//                         {doc.rating && (
//                           <div className="flex items-center gap-1">
//                             <Star className="h-4 w-4 fill-yellow-400 text-yellow-400"/>
//                             <span>{doc.rating}</span>
//                             {doc.user_ratings_total && <span className="text-sm text-muted-foreground">({doc.user_ratings_total})</span>}
//                           </div>
//                         )}
//                         {doc.distanceKm && <p className="text-sm text-muted-foreground">{doc.distanceKm.toFixed(2)} km away</p>}
//                       </div>
//                     </div>
//                     <div className="flex flex-wrap gap-2 mt-2">
//                       <Badge variant="secondary" className="text-xs">{doc.address}</Badge>
//                     </div>
//                     <div className="flex gap-2 pt-2">
//                       <Button size="sm" variant="medical" onClick={(e) => { e.stopPropagation(); handleBookAppointment(doc); }}>
//                         <Calendar className="h-4 w-4 mr-2"/> Book
//                       </Button>
//                       <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleGetDirections(doc); }}>
//                         <Navigation className="h-4 w-4 mr-2"/> Directions
//                       </Button>
//                       <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); window.open(`tel:${doc.id}`); }}>
//                         <Phone className="h-4 w-4 mr-2"/> Call
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default DoctorsPage;

// openmapapi
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Navigation, Calendar, Star } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  rating?: number;
  distanceKm?: number;
}

const DoctorsMapPage = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  // Fetch nearby clinics/doctors
  const fetchDoctors = async () => {
    if (!userLocation) return;

    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"clinic|doctors"](around:10000,${userLocation.lat},${userLocation.lng});
        way["amenity"~"clinic|doctors"](around:10000,${userLocation.lat},${userLocation.lng});
        relation["amenity"~"clinic|doctors"](around:10000,${userLocation.lat},${userLocation.lng});
      );
      out center;
    `;

    try {
      const res = await axios.get('https://overpass-api.de/api/interpreter', {
        params: { data: query },
      });

      const fetchedDoctors: Doctor[] = res.data.elements.map((el: any) => ({
        id: el.id,
        name: el.tags?.name || 'Unnamed Clinic',
        lat: el.lat || el.center?.lat,
        lng: el.lon || el.center?.lon,
        address: el.tags?.address || el.tags?.['addr:full'] || '',
      }));

      setDoctors(fetchedDoctors);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const filteredDoctors = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  // Fly map to selected doctor
  const MapMarkers = () => {
    const map = useMap();

    useEffect(() => {
      if (selectedDoctor) {
        map.flyTo([selectedDoctor.lat, selectedDoctor.lng], 16, { duration: 1 });
      }
    }, [selectedDoctor]);

    return (
      <>
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {filteredDoctors.map((doc) => (
          <Marker key={doc.id} position={[doc.lat, doc.lng]}>
            <Popup>
              <strong>{doc.name}</strong>
              <br />
              {doc.address}
            </Popup>
          </Marker>
        ))}
      </>
    );
  };

  const handleGetDirections = (doc: Doctor) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${doc.lat},${doc.lng}`, '_blank');
  };

  const handleBookAppointment = (doc: Doctor) => {
    alert(`Booking appointment with ${doc.name}`);
  };

  if (!userLocation) return <p>Loading your location...</p>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">Doctors Nearby</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find qualified eye specialists and ophthalmologists in your area.
          </p>
        </div>

        {/* Search */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex gap-4 p-6">
            <div className="relative flex-1">
              <Input
                placeholder="Enter location (optional)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-4"
              />
            </div>
            <Button onClick={fetchDoctors} variant="medical">
              <MapPin className="h-4 w-4 mr-2"/> Find Nearby Ophthalmologists
            </Button>
          </CardContent>
        </Card>

        {/* Map + List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map */}
          <Card className="h-96 lg:h-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/> Map View</CardTitle>
              <CardDescription>Ophthalmologists near you</CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-80 lg:h-96 rounded-lg overflow-hidden">
              <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <MapMarkers />
              </MapContainer>
            </CardContent>
          </Card>

          {/* Doctors List */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredDoctors.map((doc, idx) => (
              <motion.div key={doc.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="hover:shadow-medical transition-all cursor-pointer" onClick={() => setSelectedDoctor(doc)}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{doc.name}</h3>
                        <p className="text-primary font-medium">Ophthalmologist</p>
                      </div>
                      <div className="text-right">
                        {doc.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400"/>
                            <span>{doc.rating}</span>
                          </div>
                        )}
                        {doc.distanceKm && <p className="text-sm text-muted-foreground">{doc.distanceKm.toFixed(2)} km away</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">{doc.address}</Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="medical" onClick={(e) => { e.stopPropagation(); handleBookAppointment(doc); }}>
                        <Calendar className="h-4 w-4 mr-2"/> Book
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleGetDirections(doc); }}>
                        <Navigation className="h-4 w-4 mr-2"/> Directions
                      </Button>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); window.open(`tel:${doc.id}`); }}>
                        <Phone className="h-4 w-4 mr-2"/> Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DoctorsMapPage;
