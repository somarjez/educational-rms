import React, { useState, useEffect } from 'react';
import {
  createSimulationScenario,
  runSimulationScenario,
  getSimulationSystemSnapshot,
} from '../../../services/simulationApi';
import './styles/Simulation.css';

const Simulation = () => {
  const [formData, setFormData] = useState({
    name: 'New Simulation',
    description: 'Queueing simulation scenario',
    room_id: '',
    equipment_id: '',
    arrival_model: 'poisson',
    arrival_rate: 6,
    service_distribution: 'exponential',
    service_rate: 8,
    service_time: 0.125,
    num_servers: 1,
    simulation_hours: 8,
    num_replications: 200,
    prng: 'mt19937',
    seed: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [snapshot, setSnapshot] = useState({ rooms: [], equipment: [], booking_summary: [] });
  const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' });
  const [startedAt, setStartedAt] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [lastDurationMs, setLastDurationMs] = useState(null);
  const [lastReplications, setLastReplications] = useState(null);
  const [runMode, setRunMode] = useState('estimate');

  const selectedRoom = snapshot.rooms.find((r) => r.id === Number(formData.room_id));
  const selectedEquipment = snapshot.equipment.find((e) => e.id === Number(formData.equipment_id));
  const selectedSummary = snapshot.booking_summary?.find((s) => s.room_id === Number(formData.room_id));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const loadSnapshot = async () => {
    setError(null);
    try {
      const data = await getSimulationSystemSnapshot(dateRange.start_date, dateRange.end_date);
      setSnapshot(data);
    } catch (err) {
      setError('Failed to load system snapshot');
    }
  };

  useEffect(() => {
    loadSnapshot();
  }, []);

  useEffect(() => {
    if (!loading) {
      setElapsedMs(0);
      return undefined;
    }

    const start = Date.now();
    setStartedAt(start);
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 500);

    return () => clearInterval(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    try {
      setLoading(true);
      const requestedReps = Number(formData.num_replications);
      const safeReps = Number.isFinite(requestedReps) && requestedReps >= 100 ? requestedReps : 100;

      const payload = {
        name: formData.name,
        description: formData.description,
        num_replications: safeReps,
        room_id: formData.room_id ? Number(formData.room_id) : undefined,
        equipment_id: formData.equipment_id ? Number(formData.equipment_id) : undefined,
        arrival_model: formData.arrival_model,
        arrival_rate: Number(formData.arrival_rate),
        service_distribution: formData.service_distribution,
        service_rate: formData.service_distribution === 'exponential' ? Number(formData.service_rate) : undefined,
        service_time: formData.service_distribution === 'fixed' ? Number(formData.service_time) : undefined,
        num_servers: Number(formData.num_servers),
        simulation_hours: Number(formData.simulation_hours),
        prng: formData.prng,
        seed: formData.seed === '' ? null : Number(formData.seed),
      };

      const scenario = await createSimulationScenario(payload);
      const runResult = await runSimulationScenario(scenario.id, {
        num_replications: payload.num_replications,
        mode: runMode,
      });

      setResult(runResult.metrics || runResult);
      if (startedAt) {
        const duration = Date.now() - startedAt;
        setLastDurationMs(duration);
        setLastReplications(payload.num_replications);
      }
    } catch (err) {
      const responseData = err.response?.data;
      let message = 'Failed to run simulation';
      if (responseData) {
        if (typeof responseData === 'string') {
          message = responseData;
        } else if (responseData.detail) {
          message = responseData.detail;
        } else if (responseData.error) {
          message = responseData.error;
        } else if (typeof responseData === 'object') {
          message = Object.entries(responseData)
            .map(([field, msgs]) => {
              const list = Array.isArray(msgs) ? msgs : [msgs];
              return `${field}: ${list.join(', ')}`;
            })
            .join(' | ');
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const estimatedMs = lastDurationMs && lastReplications && runMode === 'simulate'
    ? (lastDurationMs / lastReplications) * Math.max(1, Number(formData.num_replications) || 1)
    : null;

  const progressPercent = estimatedMs
    ? Math.min(95, Math.round((elapsedMs / estimatedMs) * 100))
    : 15;

  return (
    <div className="simulation-container">
      <div className="simulation-header">
        <h1>Monte Carlo Simulation</h1>
        <p>Configure stochastic arrivals, service distributions, and PRNGs. Run 1000+ replications.</p>
      </div>

      <div className="simulation-content">
        <form className="simulation-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>System Start Date (optional)</label>
              <input type="date" name="start_date" value={dateRange.start_date} onChange={handleDateChange} />
            </div>
            <div className="form-group">
              <label>System End Date (optional)</label>
              <input type="date" name="end_date" value={dateRange.end_date} onChange={handleDateChange} />
            </div>
          </div>
          <button className="btn btn-secondary" type="button" onClick={loadSnapshot}>
            Load Current System Data
          </button>

          <div className="form-row">
            <div className="form-group">
              <label>Scenario Name</label>
              <input name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input name="description" value={formData.description} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Room</label>
              <select name="room_id" value={formData.room_id || ''} onChange={handleChange}>
                <option value="">Select room</option>
                {snapshot.rooms.map((room) => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
              {selectedRoom && (
                <small className="hint">Capacity: {selectedRoom.capacity}</small>
              )}
            </div>
            <div className="form-group">
              <label>Equipment</label>
              <select name="equipment_id" value={formData.equipment_id || ''} onChange={handleChange}>
                <option value="">Select equipment</option>
                {snapshot.equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                ))}
              </select>
              {selectedEquipment && (
                <small className="hint">Quantity: {selectedEquipment.quantity}</small>
              )}
            </div>
          </div>

          {selectedRoom && selectedRoom.equipment?.length > 0 && (
            <div className="room-equipment-summary">
              <strong>Room Equipment:</strong>
              <ul>
                {selectedRoom.equipment.map((eq) => (
                  <li key={eq.id}>{eq.name}: {eq.quantity}</li>
                ))}
              </ul>
            </div>
          )}

          {selectedSummary && (
            <div className="room-equipment-summary">
              <strong>Booking Summary (selected range):</strong>
              <ul>
                <li>Total bookings: {selectedSummary.total_bookings}</li>
                <li>Total scheduled hours: {selectedSummary.total_hours.toFixed(2)}</li>
              </ul>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const hours = Math.max(selectedSummary.total_hours, 1);
                  const rate = selectedSummary.total_bookings / hours;
                  setFormData((prev) => ({
                    ...prev,
                    arrival_rate: rate.toFixed(2),
                    simulation_hours: hours.toFixed(2),
                  }));
                }}
              >
                Use booking rate
              </button>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Arrival Model</label>
              <select name="arrival_model" value={formData.arrival_model} onChange={handleChange}>
                <option value="poisson">Poisson</option>
                <option value="exponential">Exponential</option>
              </select>
            </div>
            <div className="form-group">
              <label>Arrival Rate (per hour)</label>
              <input type="number" step="0.01" name="arrival_rate" value={formData.arrival_rate} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Service Distribution</label>
              <select name="service_distribution" value={formData.service_distribution} onChange={handleChange}>
                <option value="exponential">Exponential</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            {formData.service_distribution === 'exponential' ? (
              <div className="form-group">
                <label>Service Rate (per hour)</label>
                <input type="number" step="0.01" name="service_rate" value={formData.service_rate} onChange={handleChange} required />
              </div>
            ) : (
              <div className="form-group">
                <label>Service Time (hours)</label>
                <input type="number" step="0.01" name="service_time" value={formData.service_time} onChange={handleChange} required />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Servers</label>
              <input type="number" name="num_servers" value={formData.num_servers} onChange={handleChange} min="1" required />
            </div>
            <div className="form-group">
              <label>Simulation Hours</label>
              <input type="number" step="0.1" name="simulation_hours" value={formData.simulation_hours} onChange={handleChange} min="0.1" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>PRNG</label>
              <select name="prng" value={formData.prng} onChange={handleChange}>
                <option value="mt19937">MT19937</option>
                <option value="system">SystemRandom</option>
              </select>
            </div>
            <div className="form-group">
              <label>Seed (optional)</label>
              <input type="number" name="seed" value={formData.seed} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Replications</label>
              <input type="number" name="num_replications" value={formData.num_replications} onChange={handleChange} min="100" required />
              <small className="hint">100+ recommended for faster tests. 1000+ for high accuracy.</small>
              <div className="quick-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFormData((prev) => ({ ...prev, num_replications: 100 }))}
                >
                  Quick run (100)
                </button>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Run Mode</label>
              <div className="toggle-row">
                <label className="toggle-option">
                  <input
                    type="radio"
                    name="run_mode"
                    value="simulate"
                    checked={runMode === 'simulate'}
                    onChange={() => setRunMode('simulate')}
                  />
                  Full simulation
                </label>
                <label className="toggle-option">
                  <input
                    type="radio"
                    name="run_mode"
                    value="estimate"
                    checked={runMode === 'estimate'}
                    onChange={() => setRunMode('estimate')}
                  />
                  Fast estimate (M/M/c)
                </label>
              </div>
              {runMode === 'estimate' && (
                <small className="hint">
                  Uses analytical M/M/c formula. Fixed service uses $\mu = 1 / service\_time$.
                </small>
              )}
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading && (
            <div className="run-status">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="run-meta">
                <span>Running... Elapsed {formatDuration(elapsedMs)}</span>
                {estimatedMs && <span>ETA {formatDuration(Math.max(estimatedMs - elapsedMs, 0))}</span>}
              </div>
              <small className="hint">
                {runMode === 'estimate'
                  ? 'Estimate runs instantly on the server.'
                  : 'Simulation runs on the server. Progress is estimated.'}
              </small>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Running Simulation...' : 'Run Simulation'}
          </button>
        </form>

        <div className="simulation-results">
          <h2>Results</h2>
          {!result ? (
            <div className="empty-state">Run a simulation to see results.</div>
          ) : (
            <div className="results-grid">
              <div className="result-card">
                <span>Average Queue Length</span>
                <strong>{Number(result.avg_queue_length).toFixed(3)}</strong>
              </div>
              <div className="result-card">
                <span>Average Waiting Time</span>
                <strong>{Number(result.avg_waiting_time).toFixed(3)} hrs</strong>
              </div>
              <div className="result-card">
                <span>Average System Time</span>
                <strong>{Number(result.avg_system_time).toFixed(3)} hrs</strong>
              </div>
              <div className="result-card">
                <span>Server Utilization</span>
                <strong>{Number(result.server_utilization * 100).toFixed(1)}%</strong>
              </div>
              <div className="result-card">
                <span>Max Queue Length</span>
                <strong>{Number(result.max_queue_length).toFixed(0)}</strong>
              </div>
              <div className="result-card">
                <span>Avg Served Count</span>
                <strong>{Number(result.served_count_avg || 0).toFixed(0)}</strong>
              </div>
              <div className="result-card">
                <span>Replications</span>
                <strong>{Number(result.num_replications || 0).toFixed(0)}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulation;

