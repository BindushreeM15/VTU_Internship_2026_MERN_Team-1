import GoogleMapReact from 'google-map-react';

const Marker = ({ text }) => (
  <div style={{
    color: 'white',
    background: 'red',
    padding: '5px 10px',
    display: 'inline-flex',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)'
  }}>
    📍
  </div>
);

const MapComponent = ({ latitude, longitude, projectName }) => {
  const defaultProps = {
    center: {
      lat: latitude || 12.9716,
      lng: longitude || 77.5946
    },
    zoom: 15
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY }}
        defaultCenter={defaultProps.center}
        defaultZoom={defaultProps.zoom}
      >
        {latitude && longitude && (
          <Marker
            lat={latitude}
            lng={longitude}
            text={projectName}
          />
        )}
      </GoogleMapReact>
    </div>
  );
};

export default MapComponent;