import React, { useEffect, useRef, useState } from 'react';
import { FiTool, FiRefreshCw, FiDownload } from 'react-icons/fi';
import './styles/ModelingModule.css';
import api from '../../services/api';
import { exportElementToPdf } from '../../utils/pdfExport';

const EquipmentUsageModel = () => {
  const exportContainerRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState('');

  const fetchEquipmentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/capacity/current_utilization/', {
        params: { date: selectedDate },
      });

      const equipment = (response.data?.equipment_usage || []).map((eq) => {
        const stress = Number(eq.assignment_pct || 0);
        const status = stress > 75 ? 'overused' : stress < 40 ? 'idle' : 'optimal';
        return {
          id: eq.equipment_id,
          name: eq.equipment_name,
          assignedQuantity: Number(eq.assigned_quantity || 0),
          availableQuantity: Number(eq.available_quantity || 0),
          totalQuantity: Number(eq.total_quantity || 0),
          roomAssignments: Number(eq.room_assignments || 0),
          stress,
          status,
        };
      });

      setData({
        summary: {
          totalEquipment: equipment.length,
          idle: equipment.filter((item) => item.status === 'idle').length,
          optimal: equipment.filter((item) => item.status === 'optimal').length,
          overused: equipment.filter((item) => item.status === 'overused').length,
        },
        equipment,
      });
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load equipment usage data.');
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
        fileName: `equipment_usage_${selectedDate}.pdf`,
      });
      setExportNotice('Equipment usage report downloaded successfully.');
    } catch (err) {
      setExportNotice('Failed to export equipment usage report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    fetchEquipmentData();
  }, [selectedDate]);

  const getStressColor = (stress) => {
    if (stress > 75) return '#ef4444';
    if (stress > 50) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="modeling-container" ref={exportContainerRef}>
      <div className="modeling-header">
        <div className="header-content">
          <h1>
            <FiTool /> Equipment Usage Model
          </h1>
          <p>Analyze equipment wear, demand, and shortages</p>
        </div>
        <button className="btn-refresh" onClick={fetchEquipmentData} disabled={loading}>
          <FiRefreshCw /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="card">
        <div className="params-grid">
          <div className="param-input">
            <label>Date</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
        </div>
      </div>

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

      {data && (
        <div className="modeling-content">
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="card summary-card">
              <div className="card-value">{data.summary.totalEquipment}</div>
              <div className="card-label">Total Equipment</div>
            </div>
            <div className="card summary-card underutilized">
              <div className="card-value">{data.summary.idle}</div>
              <div className="card-label">Idle Equipment</div>
            </div>
            <div className="card summary-card optimal">
              <div className="card-value">{data.summary.optimal}</div>
              <div className="card-label">Optimal Usage</div>
            </div>
            <div className="card summary-card overutilized">
              <div className="card-value">{data.summary.overused}</div>
              <div className="card-label">Overused</div>
            </div>
          </div>

          {/* Equipment Table */}
          <div className="card">
            <div className="card-header">
              <h2>Equipment Status & Usage</h2>
              <button className="btn-export" onClick={handleExport} disabled={isExporting || loading}>
                <FiDownload /> {isExporting ? 'Exporting...' : 'Export Report'}
              </button>
            </div>
            <table className="equipment-table">
              <thead>
                <tr>
                  <th>Equipment Name</th>
                  <th>Assigned Qty</th>
                  <th>Available Qty</th>
                  <th>Assignment Stress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.equipment.map((item) => (
                  <tr key={item.id} className={item.status}>
                    <td>{item.name}</td>
                    <td className="value">{item.assignedQuantity} / {item.totalQuantity}</td>
                    <td className="value">{item.availableQuantity}</td>
                    <td>
                      <div className="stress-indicator">
                        <div className="stress-bar">
                          <div
                            className="stress-fill"
                            style={{
                              width: `${item.stress}%`,
                              backgroundColor: getStressColor(item.stress)
                            }}
                          />
                        </div>
                        <span>{item.stress.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommendations */}
          <div className="card recommendations-card">
            <h3>Recommendations</h3>
            <div className="recommendation-items">
              {data.equipment.filter((item) => item.status === 'overused').slice(0, 3).map((item) => (
                <div className="rec-item high-priority" key={`over-${item.id}`}>
                  <strong>High Priority:</strong> {item.name} is heavily assigned ({item.stress.toFixed(1)}%).
                </div>
              ))}
              {data.equipment.filter((item) => item.status === 'idle').slice(0, 3).map((item) => (
                <div className="rec-item medium-priority" key={`idle-${item.id}`}>
                  <strong>Medium Priority:</strong> {item.name} has low assignment ({item.stress.toFixed(1)}%).
                </div>
              ))}
              {!data.equipment.some((item) => item.status === 'overused') && (
                <div className="rec-item low-priority">
                  <strong>Low Priority:</strong> No equipment is currently over-assigned.
                </div>
              )}
            </div>
          </div>

          {/* Model Info */}
          <div className="card info-card">
            <h3>Equipment Usage Metrics</h3>
            <ul>
              <li><strong>Checkout Frequency:</strong> Total number of times equipment was used</li>
              <li><strong>Average Usage/Day:</strong> Hours of daily usage averaged over period</li>
              <li><strong>Equipment Stress Index:</strong> Combination of usage frequency and duration
                <ul>
                  <li>&lt; 50%: Idle or optimal</li>
                  <li>50% - 75%: Balanced usage</li>
                  <li>&gt; 75%: High stress, maintenance needed</li>
                </ul>
              </li>
              <li><strong>Degradation Tracking:</strong> Monitor wear patterns for predictive maintenance</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentUsageModel;

