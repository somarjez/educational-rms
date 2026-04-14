import React, { useEffect, useRef, useState } from 'react';
import { FiTrendingUp, FiRefreshCw, FiDownload } from 'react-icons/fi';
import './styles/ModelingModule.css';
import api from '../../services/api';
import { exportElementToPdf } from '../../utils/pdfExport';

const formatForecastDate = (baseDate, offsetDays) => {
  const date = new Date(baseDate);
  if (Number.isNaN(date.getTime())) {
    return `Day +${offsetDays}`;
  }

  date.setDate(date.getDate() + offsetDays);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDemandStatus = (forecast, maxValue) => {
  if (!maxValue) {
    return 'Low Demand';
  }

  const ratio = forecast / maxValue;
  if (ratio >= 0.75) {
    return 'High Demand';
  }
  if (ratio >= 0.45) {
    return 'Moderate Demand';
  }
  return 'Low Demand';
};

const DemandForecasting = () => {
  const exportContainerRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('semester');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState('');

  useEffect(() => {
    fetchForecastData();
  }, [timeframe]);

  const forecastScaleMax = data?.forecast?.length
    ? Math.max(...data.forecast.map((item) => item.confidence[1] || 0), 1)
    : 1;

  const fetchForecastData = async () => {
    setLoading(true);
    setError(null);
    try {
      const days = timeframe === 'week' ? 28 : timeframe === 'year' ? 365 : 180;
      const [trendResp, peakResp, currentUtilResp] = await Promise.all([
        api.get('/capacity/trend_analysis/', { params: { days } }),
        api.get('/capacity/peak_hours/', { params: { days: Math.min(days, 60) } }),
        api.get('/capacity/current_utilization/'),
      ]);

      const trendData = trendResp.data?.trend_data || [];
      const bookings = trendData.map((item) => Number(item.bookings || 0));
      const avgBookings = bookings.length
        ? bookings.reduce((sum, val) => sum + val, 0) / bookings.length
        : 0;
      const peakBookings = bookings.length ? Math.max(...bookings) : 0;

      const midpoint = Math.max(1, Math.floor(bookings.length / 2));
      const early = bookings.slice(0, midpoint);
      const late = bookings.slice(midpoint);
      const avgEarly = early.length ? early.reduce((s, v) => s + v, 0) / early.length : 0;
      const avgLate = late.length ? late.reduce((s, v) => s + v, 0) / late.length : 0;
      const growthPct = avgEarly > 0 ? ((avgLate - avgEarly) / avgEarly) * 100 : 0;

      const horizon = timeframe === 'week' ? 4 : 6;
      const base = avgLate || avgBookings || 1;
      const trendSlope = growthPct / 100 / horizon;
      const forecast = Array.from({ length: horizon }).map((_, idx) => {
        const projected = Math.max(0, base * (1 + trendSlope * (idx + 1)));
        const low = Math.max(0, projected * 0.85);
        const high = projected * 1.15;
        const dateStep = timeframe === 'week' ? 7 : timeframe === 'year' ? 30 : 14;
        const lastTrendDate = trendData.length ? trendData[trendData.length - 1].date : new Date().toISOString();
        return {
          week: timeframe === 'week' ? `Week ${idx + 1}` : `Period ${idx + 1}`,
          date: formatForecastDate(lastTrendDate, dateStep * (idx + 1)),
          forecast: Number(projected.toFixed(1)),
          confidence: [Number(low.toFixed(1)), Number(high.toFixed(1))],
        };
      });

      const peakSlots = peakResp.data?.peak_slots || [];
      const underutilizedSlots = peakResp.data?.underutilized_slots || [];
      const seasonalPatterns = [
        {
          season: 'Peak Slot Intensity',
          growth: peakSlots.length ? Number((peakSlots[0].booking_count || 0).toFixed(1)) : 0,
        },
        {
          season: 'Low Slot Intensity',
          growth: underutilizedSlots.length ? Number((underutilizedSlots[0].booking_count || 0).toFixed(1)) : 0,
        },
        { season: 'Trend Growth', growth: Number(growthPct.toFixed(1)) },
        { season: 'Avg Daily Demand', growth: Number(avgBookings.toFixed(1)) },
      ];

      const roomUtilization = currentUtilResp.data?.room_utilization || [];
      const topDemandRooms = [...roomUtilization]
        .sort((a, b) => Number(b.booked_slots || 0) - Number(a.booked_slots || 0))
        .slice(0, 5)
        .map((room) => ({
          room_name: room.room_name,
          booked_slots: Number(room.booked_slots || 0),
          total_slots: Number(room.total_slots || 0),
          utilization_pct: Number(room.utilization_pct || 0),
        }));

      const totalForecastRequests = forecast.reduce((sum, item) => sum + Number(item.forecast || 0), 0);
      const strongestPeak = peakSlots.length ? peakSlots[0] : null;

      setData({
        summary: {
          avgBookingsPerDay: Number(avgBookings.toFixed(1)),
          peakDayBookings: peakBookings,
          forecastedGrowth: `${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%`,
          confidenceLevel: days >= 180 ? 'High' : days >= 90 ? 'Medium' : 'Low',
        },
        forecast,
        seasonalPatterns,
        predictedRoomDemand: {
          totalForecastRequests: Number(totalForecastRequests.toFixed(1)),
          strongestPeakSlot: strongestPeak?.time_slot || 'No peak period yet',
          strongestPeakCount: Number(strongestPeak?.booking_count || 0),
          highDemandRooms: topDemandRooms,
        },
      });
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load demand forecast data.');
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
        fileName: `demand_forecast_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
      setExportNotice('Demand forecast report downloaded successfully.');
    } catch (err) {
      setExportNotice('Failed to export demand forecast report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="modeling-container" ref={exportContainerRef}>
      <div className="modeling-header">
        <div className="header-content">
          <h1>
            <FiTrendingUp /> Demand Forecasting Model
          </h1>
          <p>Predict future booking demand based on historical patterns</p>
        </div>
        <button className="btn-refresh" onClick={fetchForecastData} disabled={loading}>
          <FiRefreshCw /> {loading ? 'Loading...' : 'Refresh'}
        </button>
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

      <div className="card predicted-room-demand-card">
        <div className="card-header">
          <div>
            <h2>Predicted Room Demand</h2>
            <p className="predicted-room-demand-subtitle">
              Forecasted booking pressure, peak demand windows, and high-demand rooms.
            </p>
          </div>
        </div>

        {loading && !data ? (
          <div className="predicted-room-demand-loading">
            <p>Loading predicted room demand...</p>
          </div>
        ) : data ? (
          <div className="predicted-room-demand-content">
            <div className="predicted-demand-summary-grid">
              <div className="predicted-demand-summary-item">
                <span className="summary-label">Forecasted Requests</span>
                <strong className="summary-value">
                  {data.predictedRoomDemand.totalForecastRequests}
                </strong>
                <span className="summary-caption">Across forecast horizon</span>
              </div>
              <div className="predicted-demand-summary-item">
                <span className="summary-label">Peak Demand Period</span>
                <strong className="summary-value">
                  {data.predictedRoomDemand.strongestPeakSlot}
                </strong>
                <span className="summary-caption">
                  {data.predictedRoomDemand.strongestPeakCount} bookings in recent peak window
                </span>
              </div>
              <div className="predicted-demand-summary-item">
                <span className="summary-label">High-Demand Rooms</span>
                <strong className="summary-value">
                  {data.predictedRoomDemand.highDemandRooms.length}
                </strong>
                <span className="summary-caption">Rooms with highest booked slots today</span>
              </div>
            </div>

            <div className="predicted-demand-grid">
              <div className="predicted-demand-panel">
                <h3>Demand by Forecast Date</h3>
                <div className="predicted-demand-bars">
                  {data.forecast.map((item, idx) => (
                    <div key={`${item.week}-${idx}`} className="predicted-demand-bar-row">
                      <div className="predicted-demand-meta">
                        <span>{item.date}</span>
                        <strong>{item.forecast} bookings</strong>
                      </div>
                      <div className="predicted-demand-track">
                        <div
                          className="predicted-demand-fill"
                          style={{ width: `${Math.min(100, (item.forecast / forecastScaleMax) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="predicted-demand-panel">
                <h3>High-Demand Rooms Snapshot</h3>
                <div className="predicted-demand-table-wrap">
                  <table className="forecast-table predicted-demand-table">
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>Booked Slots</th>
                        <th>Utilization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.predictedRoomDemand.highDemandRooms.map((room, idx) => (
                        <tr key={`${room.room_name}-${idx}`}>
                          <td>{room.room_name}</td>
                          <td>{room.booked_slots} / {room.total_slots}</td>
                          <td className="value">{room.utilization_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {data && (
        <div className="modeling-content">
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="card summary-card">
              <div className="card-value">{data.summary.avgBookingsPerDay}</div>
              <div className="card-label">Avg Bookings/Day</div>
            </div>
            <div className="card summary-card">
              <div className="card-value">{data.summary.peakDayBookings}</div>
              <div className="card-label">Peak Day Bookings</div>
            </div>
            <div className="card summary-card">
              <div className="card-value">{data.summary.forecastedGrowth}</div>
              <div className="card-label">Forecasted Growth</div>
            </div>
            <div className="card summary-card">
              <div className="card-value">{data.summary.confidenceLevel}</div>
              <div className="card-label">Confidence Level</div>
            </div>
          </div>

          {/* Forecast Controls */}
          <div className="card">
            <div className="card-header">
              <h2>Forecast Settings</h2>
            </div>
            <div className="control-group">
              <label>Timeframe:</label>
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                <option value="week">Weekly</option>
                <option value="semester">Semester</option>
                <option value="year">Annual</option>
              </select>
            </div>
          </div>

          {/* Forecast Table */}
          <div className="card">
            <div className="card-header">
              <h2>Weekly Demand Forecast</h2>
              <button className="btn-export" onClick={handleExport} disabled={isExporting || loading}>
                <FiDownload /> {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Forecast</th>
                  <th>Confidence Range</th>
                  <th>Visualization</th>
                </tr>
              </thead>
              <tbody>
                {data.forecast.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div>{item.week}</div>
                      <small className="forecast-date-label">{item.date}</small>
                    </td>
                    <td className="value">{item.forecast} bookings</td>
                    <td className="range">{item.confidence[0]} - {item.confidence[1]}</td>
                    <td>
                      <div className="forecast-visualization-panel">
                        <div className="visualization-status">
                          <span className="visualization-status-badge">
                            {getDemandStatus(item.forecast, forecastScaleMax)}
                          </span>
                        </div>
                        <div className="visualization-metrics" aria-label="Demand confidence metrics">
                          <div className="metric-item">
                            <span className="metric-label">L</span>
                            <span className="metric-value">{item.confidence[0]}</span>
                          </div>
                          <div className="metric-item">
                            <span className="metric-label">M</span>
                            <span className="metric-value">{item.forecast}</span>
                          </div>
                          <div className="metric-item">
                            <span className="metric-label">H</span>
                            <span className="metric-value">{item.confidence[1]}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Seasonal Patterns */}
          <div className="card">
            <div className="card-header">
              <h2>Seasonal Patterns</h2>
            </div>
            <div className="pattern-grid">
              {data.seasonalPatterns.map((pattern, idx) => (
                <div key={idx} className="pattern-item">
                  <div className="pattern-name">{pattern.season}</div>
                  <div className={`pattern-value ${pattern.growth >= 0 ? 'positive' : 'negative'}`}>
                    {pattern.growth >= 0 ? '+' : ''}{pattern.growth}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Info */}
          <div className="card info-card">
            <h3>Forecasting Methods</h3>
            <ul>
              <li><strong>Moving Average:</strong> Smooths out short-term fluctuations</li>
              <li><strong>Linear Trend:</strong> Identifies long-term growth patterns</li>
              <li><strong>Seasonal Adjustment:</strong> Accounts for semester-based variations</li>
              <li><strong>Factors Considered:</strong>
                <ul>
                  <li>Exam weeks (increased demand)</li>
                  <li>Enrollment size</li>
                  <li>Previous semester growth rate</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandForecasting;

