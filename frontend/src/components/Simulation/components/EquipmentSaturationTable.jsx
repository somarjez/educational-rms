import React from 'react';
import PaginationToolbar from './PaginationToolbar';

const EquipmentSaturationTable = ({
  levels,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}) => {
  if (!levels.length) {
    return <p className="empty-state">No equipment data available for saturation analysis.</p>;
  }

  return (
    <>
      <div className="timeline-table-wrap">
        <table className="timeline-table">
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Units</th>
              <th>Actual Saturation</th>
              <th>Simulated Saturation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td className="value numeric">{item.units}</td>
                <td className="value numeric">{item.actualSaturation.toFixed(1)}%</td>
                <td className="value numeric">{item.simulatedSaturation.toFixed(1)}%</td>
                <td className="value">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationToolbar
        className="timeline-toolbar-padded"
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={onPrev}
        onNext={onNext}
      />
    </>
  );
};

export default EquipmentSaturationTable;
