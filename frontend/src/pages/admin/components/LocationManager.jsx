import React, { useState, useEffect } from "react";
import api from "@/services/api";
import toast from "react-hot-toast";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  Polygon,
  Circle,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import { PlusCircle, MapPin, Trash2, LocateFixed } from "lucide-react";

// Fix for a known issue with leaflet-draw icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Component to handle the "Go to My Location" button and marker
function MyLocationControl() {
  const map = useMap();
  const [position, setPosition] = useState(null);

  const handleClick = () => {
    toast.loading("Fetching your location...");
    map
      .locate()
      .on("locationfound", function (e) {
        toast.dismiss();
        toast.success("Location found!");
        setPosition(e.latlng);
        map.flyTo(e.latlng, 15);
      })
      .on("locationerror", function (e) {
        toast.dismiss();
        toast.error("Could not find your location. Please check permissions.");
      });
  };

  return (
    <>
      {/* Button is moved to the bottom-left to avoid overlapping the draw controls */}
      <div className="leaflet-bottom leaflet-left">
        <div className="leaflet-control leaflet-bar">
          <button onClick={handleClick} title="Go to my location">
            <LocateFixed className="h-5 w-5" />
          </button>
        </div>
      </div>
      {/* Renders a marker at the user's found location */}
      {position && (
        <Marker position={position}>
          <Popup>You are here</Popup>
        </Marker>
      )}
    </>
  );
}

const LocationManager = () => {
  const [locations, setLocations] = useState([]);
  const [locationName, setLocationName] = useState("");
  const [drawnShape, setDrawnShape] = useState(null);

  const fetchLocations = async () => {
    try {
      const res = await api.get("/admin/locations");
      setLocations(res.data);
    } catch (error) {
      toast.error("Could not fetch locations.");
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreated = (e) => {
    const { layerType, layer } = e;
    let shapeData = {};
    if (layerType === "polygon" || layerType === "rectangle") {
      const latlngs = layer.getLatLngs()[0];
      shapeData = {
        shapeType: "Polygon",
        path: latlngs.map((p) => ({ lat: p.lat, lng: p.lng })),
      };
    } else if (layerType === "circle") {
      const latlng = layer.getLatLng();
      shapeData = {
        shapeType: "Circle",
        center: { lat: latlng.lat, lng: latlng.lng },
        radius: layer.getRadius(),
      };
    }
    setDrawnShape(shapeData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!locationName || !drawnShape) {
      toast.error("Please provide a name and draw a shape on the map.");
      return;
    }
    try {
      const payload = {
        name: locationName,
        ...drawnShape,
      };
      await api.post("/admin/locations", payload);
      toast.success("Location added!");
      fetchLocations();
      setLocationName("");
      setDrawnShape(null);
    } catch (err) {
      toast.error("Failed to add location.");
    }
  };

  const handleDelete = async (locationId) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        await api.delete(`/admin/locations/${locationId}`);
        toast.success("Location deleted!");
        fetchLocations();
      } catch (err) {
        toast.error(err.response?.data?.msg || "Failed to delete location.");
      }
    }
  };

  // Helper function to find the center of a saved shape
  const getShapeCenter = (loc) => {
    if (loc.shapeType === "Circle" && loc.center) {
      return [loc.center.lat, loc.center.lng];
    }
    if (loc.shapeType === "Polygon" && loc.path && loc.path.length > 0) {
      // For polygons, we calculate the center of their bounding box
      const bounds = L.latLngBounds(loc.path.map((p) => [p.lat, p.lng]));
      const center = bounds.getCenter();
      return [center.lat, center.lng];
    }
    return null; // Return null if center cannot be determined
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Manage Geofence Locations
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <form
            onSubmit={handleSubmit}
            className="p-4 border rounded-lg bg-gray-50 space-y-4"
          >
            <h3 className="font-semibold text-lg text-gray-700">
              Add New Location
            </h3>
            <p className="text-sm text-gray-600">
              Use the tools on the map to draw a geofence area. Use the{" "}
              <LocateFixed className="inline h-4 w-4" /> button to find your
              current location.
            </p>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              required
              placeholder="Location Name (e.g., Main Campus)"
              className="w-full mt-1 p-2 border rounded"
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold"
            >
              <PlusCircle size={20} /> Save Location
            </button>
          </form>

          <div className="mt-6 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-gray-700">
              Existing Locations ({locations.length})
            </h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {locations.map((loc) => (
                <li
                  key={loc._id}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2 text-gray-700">
                    <MapPin size={16} className="text-red-500" />
                    {loc.name}
                  </span>
                  <button
                    onClick={() => handleDelete(loc._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-96 lg:h-[32rem] rounded-lg overflow-hidden border">
          <MapContainer
            center={[20.5937, 78.9629]} // Centered on India
            zoom={5}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <FeatureGroup>
              <EditControl
                position="topright"
                onCreated={handleCreated}
                draw={{
                  rectangle: true,
                  polygon: true,
                  circle: true,
                  marker: false,
                  polyline: false,
                  circlemarker: false,
                }}
                edit={{
                  edit: false,
                  remove: true,
                }}
              />
            </FeatureGroup>
            <MyLocationControl />
            {locations.map((loc) => {
              const center = getShapeCenter(loc);
              return (
                <React.Fragment key={loc._id}>
                  {/* Render the shape */}
                  {loc.shapeType === "Polygon" && loc.path && (
                    <Polygon positions={loc.path.map((p) => [p.lat, p.lng])} />
                  )}
                  {loc.shapeType === "Circle" && loc.center && (
                    <Circle
                      center={[loc.center.lat, loc.center.lng]}
                      radius={loc.radius}
                    />
                  )}
                  {/* Render the center marker for the shape */}
                  {center && (
                    <Marker position={center}>
                      <Popup>{loc.name}</Popup>
                    </Marker>
                  )}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default LocationManager;
