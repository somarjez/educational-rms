import React from 'react';
import SectionCard from '../SectionCard';
import EquipmentSaturationTable from '../EquipmentSaturationTable';

const EquipmentSection = ({
  levels,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}) => {
  return (
    <SectionCard title="Equipment Saturation Levels">
      <EquipmentSaturationTable
        levels={levels}
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={onPrev}
        onNext={onNext}
      />
    </SectionCard>
  );
};

export default EquipmentSection;
