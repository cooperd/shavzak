import React, { useRef } from 'react';
import { Button, CircularProgress } from '@mui/material';

interface CsvImportButtonProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  buttonText?: string;
  // loadingText prop is not used here as CircularProgress handles visual loading state
}

const CsvImportButton: React.FC<CsvImportButtonProps> = ({
  onFileSelected,
  isLoading = false,
  isDisabled = false,
  buttonText = 'Load Constraints from CSV',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
      // Clear the file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button variant="contained" onClick={handleButtonClick} disabled={isLoading || isDisabled} sx={{ mr: 1 }}>
        {isLoading ? <CircularProgress size={24} /> : buttonText}
      </Button>
    </>
  );
};

export default CsvImportButton;