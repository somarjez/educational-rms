import React, { useEffect, useRef, useState } from 'react';
import { FiBarChart2, FiRefreshCw, FiDownload } from 'react-icons/fi';
import './styles/ModelingModule.css';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import DecisionSupportPanel from '../../features/dashboard/sections/DecisionSupportPanel';
import UtilizationCharts from './UtilizationCharts';
import { exportElementToPdf } from '../../utils/pdfExport';

const createFallbackResources = (resourceType) => {
  if (resourceType === 'equipment') {
    return [
      {
        id: 'equipment-fallback-1',
        name: 'Projector Kits',
        utilization: 88,
        status: 'overutilized',
        assignedQuantity: 22,
        totalQuantity: 25,
        availableQuantity: 3,
        metaA: '22 assigned / 25 total',
        metaB: '3 available',
      },
      {
        id: 'equipment-fallback-2',
        name: 'Wireless Mics',
        utilization: 71,
        status: 'optimal',
        assignedQuantity: 17,
        totalQuantity: 24,
        availableQuantity: 7,
        metaA: '17 assigned / 24 total',
        metaB: '7 available',
      },
      {
        id: 'equipment-fallback-3',
        name: 'Laptops',
        utilization: 63,
        status: 'optimal',
        assignedQuantity: 19,
        totalQuantity: 30,
        availableQuantity: 11,
        metaA: '19 assigned / 30 total',
        metaB: '11 available',
      },
      {
        id: 'equipment-fallback-4',
        name: 'Tripods',
        utilization: 39,
        status: 'underutilized',
        assignedQuantity: 7,
        totalQuantity: 18,
        availableQuantity: 11,
        metaA: '7 assigned / 18 total',
        metaB: '11 available',
      },
      {
        id: 'equipment-fallback-5',
        name: 'Audio Interfaces',
        utilization: 24,
        status: 'underutilized',
        assignedQuantity: 3,
        totalQuantity: 12,
        availableQuantity: 9,
        metaA: '3 assigned / 12 total',
        metaB: '9 available',
      },
    ];
  }

  return [
    {
      id: 'room-fallback-1',
      name: 'Lecture Hall A',
      utilization: 92,
      status: 'overutilized',
      bookedSlots: 34,
      totalSlots: 37,
      capacity: 120,
      metaA: '34 / 37 slots',
      metaB: 'Cap 120',
    },
    {
      id: 'room-fallback-2',
      name: 'Seminar Room 2',
      utilization: 78,
      status: 'optimal',
      bookedSlots: 28,
      totalSlots: 36,
      capacity: 80,
      metaA: '28 / 36 slots',
      metaB: 'Cap 80',
    },
    {
      id: 'room-fallback-3',
      name: 'Lab B',
      utilization: 64,
      status: 'optimal',
      bookedSlots: 23,
      totalSlots: 36,
      capacity: 60,
      metaA: '23 / 36 slots',
      metaB: 'Cap 60',
    },
    {
      id: 'room-fallback-4',
      name: 'Conference Room',
      utilization: 41,
      status: 'underutilized',
      bookedSlots: 15,
      totalSlots: 36,
      capacity: 40,
      metaA: '15 / 36 slots',
      metaB: 'Cap 40',
    },
    {
      id: 'room-fallback-5',
      name: 'Studio C',
      utilization: 27,
      status: 'underutilized',
      bookedSlots: 10,
      totalSlots: 37,
      capacity: 30,
      metaA: '10 / 37 slots',
      metaB: 'Cap 30',
    },
  ];
};

const buildFallbackSnapshot = (resourceType, selectedDate, reason = '') => {
  const resources = createFallbackResources(resourceType);
  const summary = {
    totalResources: resources.length,
    optimal: resources.filter((resource) => resource.status === 'optimal').length,
    underutilized: resources.filter((resource) => resource.status === 'underutilized').length,
    overutilized: resources.filter((resource) => resource.status === 'overutilized').length,
  };

  const usedUnits = resourceType === 'equipment'
    ? resources.reduce((sum, resource) => sum + Number(resource.assignedQuantity || 0), 0)
    : resources.reduce((sum, resource) => sum + Number(resource.bookedSlots || 0), 0);
  const totalUnits = resourceType === 'equipment'
    ? resources.reduce((sum, resource) => sum + Number(resource.totalQuantity || 0), 0)
    : resources.reduce((sum, resource) => sum + Number(resource.totalSlots || 0), 0);

  return {
    summary,
    resources,
    overallUtilizationPct: totalUnits > 0 ? (usedUnits / totalUnits) * 100 : 0,
    usedUnits,
    totalUnits,
    unitLabel: resourceType === 'equipment' ? 'units' : 'slots',
    usedLabel: resourceType === 'equipment' ? 'assigned' : 'booked',
    availableLabel: 'available',
    selectedDate,
    resourceType,
    source: 'fallback',
    isFallback: true,
    fallbackReason: reason,
  };
};

const buildEmptySnapshot = (resourceType, selectedDate, reason = '') => ({
  summary: {
    totalResources: 0,
    optimal: 0,
    underutilized: 0,
    overutilized: 0,
  },
  resources: [],
  overallUtilizationPct: 0,
  usedUnits: 0,
  totalUnits: 0,
  unitLabel: resourceType === 'equipment' ? 'units' : 'slots',
  usedLabel: resourceType === 'equipment' ? 'assigned' : 'booked',
  availableLabel: 'available',
  selectedDate,
  resourceType,
  source: 'empty',
  isFallback: false,
  fallbackReason: reason,
  totalBookedSlots: 0,
  totalAvailableSlots: 0,
});

const normalizeStatus = (utilization) => {
  if (utilization < 40) {
    return 'underutilized';
  }

  if (utilization > 75) {
    return 'overutilized';
  }

  return 'optimal';
};

const ResourceUtilization = () => {
  const { user } = useAuthStore();
  const exportContainerRef = useRef(null);
  const [data, setData] = useState(() => buildEmptySnapshot('rooms', new Date().toISOString().slice(0, 10)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedResource, setSelectedResource] = useState('rooms');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState('');

  useEffect(() => {
    fetchUtilizationData();
  }, [selectedResource, selectedDate]);

  const fetchUtilizationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const utilResponse = await api.get('/capacity/current_utilization/', { params: { date: selectedDate } });
      const roomResources = (utilResponse.data.room_utilization || []).map((room) => {
        const util = Number(room.utilization_pct || 0);
        return {
          id: `room-${room.room_id}`,
          name: `${room.room_name} (${room.room_type || 'N/A'})`,
          utilization: util,
          status: normalizeStatus(util),
          bookedSlots: Number(room.booked_slots || 0),
          totalSlots: Number(room.total_slots || 0),
          capacity: Number(room.capacity || 0),
          metaA: `${room.booked_slots} / ${room.total_slots} slots`,
          metaB: `Cap ${room.capacity}`,
        };
      });

      const equipmentResources = (utilResponse.data.equipment_usage || []).map((eq) => {
        const util = Number(eq.assignment_pct || 0);
        return {
          id: `eq-${eq.equipment_id}`,
          name: eq.equipment_name,
          utilization: util,
          status: normalizeStatus(util),
          assignedQuantity: Number(eq.assigned_quantity || 0),
          totalQuantity: Number(eq.total_quantity || 0),
          availableQuantity: Number(eq.available_quantity || 0),
          metaA: `${eq.assigned_quantity} assigned / ${eq.total_quantity}`,
          metaB: `${eq.available_quantity} available`,
        };
      });

      const resources = selectedResource === 'equipment' ? equipmentResources : roomResources;
      const summary = {
        totalResources: resources.length,
        optimal: resources.filter((r) => r.status === 'optimal').length,
        underutilized: resources.filter((r) => r.status === 'underutilized').length,
        overutilized: resources.filter((r) => r.status === 'overutilized').length,
      };

      const usedUnits = selectedResource === 'equipment'
        ? resources.reduce((sum, resource) => sum + Number(resource.assignedQuantity || 0), 0)
        : resources.reduce((sum, resource) => sum + Number(resource.bookedSlots || 0), 0);
      const totalUnits = selectedResource === 'equipment'
        ? resources.reduce((sum, resource) => sum + Number(resource.totalQuantity || 0), 0)
        : resources.reduce((sum, resource) => sum + Number(resource.totalSlots || 0), 0);

      setData({
        summary,
        resources,
        overallUtilizationPct: totalUnits > 0
          ? (usedUnits / totalUnits) * 100
          : Number(utilResponse.data?.overall_utilization_pct || 0),
        usedUnits,
        totalUnits,
        unitLabel: selectedResource === 'equipment' ? 'units' : 'slots',
        usedLabel: selectedResource === 'equipment' ? 'assigned' : 'booked',
        availableLabel: 'available',
        totalBookedSlots: Number(utilResponse.data?.total_booked_slots || 0),
        totalAvailableSlots: Number(utilResponse.data?.total_available_slots || 0),
        source: 'live',
        isFallback: false,
        fallbackReason: '',
      });
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load utilization data.');
      setData(buildEmptySnapshot(selectedResource, selectedDate, 'Live utilization data could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExportNotice('');
    setIsExporting(true);

    try {
      await exportElementToPdf({
        element: exportContainerRef.current,
        fileName: `resource_utilization_${selectedDate}.pdf`,
      });
      setExportNotice('Resource utilization report downloaded successfully.');
    } catch (err) {
      setExportNotice('Failed to export resource utilization report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'optimal': return '#10b981';
      case 'underutilized': return '#f59e0b';
      case 'overutilized': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="modeling-container" ref={exportContainerRef}>
      <div className="modeling-header">
        <div className="header-content">
          <h1>
            <FiBarChart2 /> Resource Utilization Model
          </h1>
          <p>Measure how much each resource is used vs available</p>
        </div>
        <button className="btn-refresh" onClick={fetchUtilizationData} disabled={loading}>
          <FiRefreshCw /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="card">
        <div className="params-grid">
          <div className="param-input">
            <label>Data Type</label>
            <select value={selectedResource} onChange={(e) => setSelectedResource(e.target.value)}>
              <option value="rooms">Room Utilization</option>
              <option value="equipment">Equipment Allocation</option>
            </select>
          </div>
          <div className="param-input">
            <label>Date</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
        </div>
      </div>

      <DecisionSupportPanel userRole={user?.role} />

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      {exportNotice ? (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <p style={{ margin: 0 }}>{exportNotice}</p>
        </div>
      ) : null}

      <div className="modeling-content">
        <UtilizationCharts
          data={data}
          resourceType={selectedResource}
          loading={loading}
          isFallback={data?.isFallback}
          fallbackReason={data?.fallbackReason}
        />

        {selectedResource === 'rooms' && data.totalBookedSlots === 0 && (
          <div className="error-banner">
            <p>
              No approved or confirmed room bookings were found for {selectedDate}. Choose a different date or populate schedules for this day.
            </p>
          </div>
        )}
        {selectedResource === 'rooms' && data.totalBookedSlots > 0 && data.overallUtilizationPct >= 90 && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <p style={{ margin: 0, color: '#166534', fontWeight: 600 }}>
              High utilization detected on {selectedDate}: {data.totalBookedSlots} of {data.totalAvailableSlots} room-slots booked ({data.overallUtilizationPct}%).
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="card summary-card">
            <div className="card-value">{data.summary.totalResources}</div>
            <div className="card-label">Total Resources</div>
          </div>
          <div className="card summary-card optimal">
            <div className="card-value">{data.summary.optimal}</div>
            <div className="card-label">Optimal (40-75%)</div>
          </div>
          <div className="card summary-card underutilized">
            <div className="card-value">{data.summary.underutilized}</div>
            <div className="card-label">Underutilized (&lt;40%)</div>
          </div>
          <div className="card summary-card overutilized">
            <div className="card-value">{data.summary.overutilized}</div>
            <div className="card-label">Overutilized (&gt;75%)</div>
          </div>
        </div>

        {/* Resource Utilization Table */}
        <div className="card">
          <div className="card-header">
            <h2>Resource Utilization Details</h2>
            <button className="btn-export" onClick={handleExport} disabled={isExporting || loading}>
              <FiDownload /> {isExporting ? 'Exporting...' : 'Export Report'}
            </button>
          </div>
          <table className="utilization-table">
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>Utilization Rate</th>
                <th>Status</th>
                <th>Visualization</th>
              </tr>
            </thead>
            <tbody>
              {data.resources.map((resource) => (
                <tr key={resource.id}>
                  <td>{resource.name}</td>
                  <td className="value">{resource.utilization}%</td>
                  <td>
                    <span className="status-badge" style={{ borderColor: getStatusColor(resource.status) }}>
                      {resource.status}
                    </span>
                  </td>
                  <td>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${resource.utilization}%`,
                          backgroundColor: getStatusColor(resource.status)
                        }}
                      />
                    </div>
                    <small>{resource.metaA} • {resource.metaB}</small>
                  </td>
                </tr>
              ))}
              {data.resources.length === 0 && (
                <tr>
                  <td colSpan={4}>No utilization data available for the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Model Info */}
        <div className="card info-card">
          <h3>Model Methodology</h3>
          <ul>
            <li><strong>Available Slots:</strong> Active Rooms × Active Time Slots (for selected date)</li>
            <li><strong>Used Slots:</strong> Confirmed/Approved bookings on the selected date</li>
            <li><strong>Utilization Rate:</strong> (Used Slots / Available Slots) × 100%</li>
            <li><strong>Classification:</strong>
              <ul>
                <li>Underutilized: &lt; 40%</li>
                <li>Optimal: 40% - 75%</li>
                <li>Overutilized: &gt; 75%</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResourceUtilization;

