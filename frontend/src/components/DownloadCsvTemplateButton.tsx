import React from 'react';
import type { Employee } from '../types';
import { DAYS_OF_WEEK, SHIFT_TYPES } from '../types';
import { Button } from '@mui/material';

interface DownloadCsvTemplateButtonProps {
  employees: Employee[];
}

const DownloadCsvTemplateButton: React.FC<DownloadCsvTemplateButtonProps> = ({ employees }) => {
  const handleDownloadExampleCsv = () => {
    if (employees.length === 0) {
      alert("No employees loaded to generate an example CSV.");
      return;
    }

    const headers = ['Employee'];
    DAYS_OF_WEEK.forEach(day => {
      SHIFT_TYPES.forEach(type => {
        headers.push(`${day}_${type}`);
      });
    });

    let csvContent = '\uFEFF' + headers.join(',') + '\n';

    employees.forEach(employee => {
      const row = [employee.name];
      for (let i = 1; i < headers.length; i++) {
        row.push('');
      }
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'constraints_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outlined" onClick={handleDownloadExampleCsv} disabled={employees.length === 0}>
      Download Example CSV
    </Button>
  );
};

export default DownloadCsvTemplateButton;