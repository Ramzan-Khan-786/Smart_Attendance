import React, { useState, useEffect } from "react";
import api from "@/services/api";
import toast from "react-hot-toast";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
} from "react-leaflet";
import { PlusCircle, MapPin, LocateFixed } from "lucide-react";

const LocationManager = () => {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius: 100,
  });

  const fetchLocations = async () => {
    const res = await api.get("/admin/locations");
    setLocations(res.data);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setFormData({
          ...formData,
          latitude: e.latlng.lat.toFixed(6),
          longitude: e.latlng.lng.toFixed(6),
        });
      },
    });
    return null;
  };

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    toast.loading("Fetching your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Geolocation Success:", position);
        toast.dismiss();
        toast.success("Current location set!");
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        });
      },
      (error) => {
        console.error("Geolocation Error:", error);
        toast.dismiss();
        toast.error(`Error: ${error.message}`);
      }
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/locations", formData);
      toast.success("Location added!");
      fetchLocations();
      setFormData({ name: "", latitude: "", longitude: "", radius: 100 });
    } catch (err) {
      toast.error("Failed to add location.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Manage Locations
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold text-lg text-gray-700">
              Add New Location
            </h3>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 flex items-center justify-center gap-2 font-semibold"
            >
              <LocateFixed size={18} /> Use My Current Location
            </button>
            <p className="text-xs text-gray-500 text-center -my-2">
              OR fill the details manually
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                required
                placeholder="Location Name (e.g., Main Campus)"
                className="w-full mt-1 p-2 border rounded"
              />
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={onChange}
                required
                placeholder="Latitude"
                className="w-full mt-1 p-2 border rounded bg-white"
              />
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={onChange}
                required
                placeholder="Longitude"
                className="w-full mt-1 p-2 border rounded bg-white"
              />
              <input
                type="number"
                name="radius"
                value={formData.radius}
                onChange={onChange}
                required
                placeholder="Radius in meters"
                className="w-full mt-1 p-2 border rounded bg-white"
              />
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold"
              >
                <PlusCircle size={20} /> Add Location
              </button>
              <p className="text-xs text-gray-500 text-center">
                You can also click on the map to set coordinates.
              </p>
            </form>
          </div>
          <div className="mt-6 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-gray-700">
              Existing Locations ({locations.length})
            </h3>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {locations.map((loc) => (
                <li
                  key={loc._id}
                  className="flex items-center gap-2 text-gray-600"
                >
                  <MapPin size={16} className="text-red-500" />
                  {loc.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="h-96 lg:h-full rounded-lg overflow-hidden border">
          <MapContainer
            center={
              formData.latitude && formData.longitude
                ? [formData.latitude, formData.longitude]
                : [20.5937, 78.9629]
            }
            zoom={formData.latitude ? 13 : 5}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler />
            {formData.latitude && formData.longitude && (
              <Marker position={[formData.latitude, formData.longitude]} />
            )}
            {locations.map((loc) => (
              <React.Fragment key={loc._id}>
                <Marker position={[loc.latitude, loc.longitude]} />
                <Circle
                  center={[loc.latitude, loc.longitude]}
                  radius={loc.radius}
                  pathOptions={{ color: "blue" }}
                />
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default LocationManager;
