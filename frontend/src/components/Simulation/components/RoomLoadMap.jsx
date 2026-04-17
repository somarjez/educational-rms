import React from 'react';

const RoomLoadMap = ({ roomLoad, getRelativePressureClass }) => {
  if (!roomLoad.length) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Room Simulation Load Map</h2>
      </div>
      <div className="room-sim-grid">
        {roomLoad.map((room) => (
          <div key={room.roomId} className="room-sim-card">
            <div className="room-sim-header">
              <h3>{room.roomName}</h3>
              <span className={`room-pressure room-pressure-${room.pressure}`}>{room.pressure}</span>
            </div>
            <div className="room-metrics">
              <span>Capacity: {room.roomCapacity}</span>
              <span>History bookings: {room.historicalBookings}</span>
              <span>Projected bookings: {room.projectedBookings}</span>
              <span>Relative pressure: {room.relativePressure}%</span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${getRelativePressureClass(room.relativePressure || 0)}`}
                style={{ width: `${Math.max(2, Number(room.relativePressure || room.loadPct || 0))}%` }}
              />
            </div>
            <div className="room-load-value">
              {room.loadPct}% projected slot load • {room.relativePressure}% relative pressure
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomLoadMap;
