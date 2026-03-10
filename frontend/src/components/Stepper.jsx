import React from 'react';
import { Check } from 'lucide-react';

const Step = ({ number, label, isCompleted, isActive }) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
          ${isCompleted ? 'bg-blue-600 text-white' : ''}
          ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-600/30' : ''}
          ${!isCompleted && !isActive ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
        `}
      >
        {isCompleted && !isActive ? <Check size={24} /> : number}
      </div>
      <p className={`mt-2 text-xs font-semibold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
        {label}
      </p>
    </div>
  );
};

const Connector = ({ isCompleted }) => {
  return (
    <div className="flex-1 h-1 mx-2 bg-gray-200 dark:bg-gray-700 rounded-full">
      <div
        className={`h-full bg-blue-600 rounded-full transition-all duration-500`}
        style={{ width: isCompleted ? '100%' : '0%' }}
      ></div>
    </div>
  );
};

export default function Stepper({ currentStep, isDarkMode }) {
  const steps = [
    { number: 1, label: 'UPLOAD FILE' },
    { number: 2, label: 'KONFIGURASI KRITERIA' },
    { number: 3, label: 'HASIL AKHIR' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto flex items-center justify-center p-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <Step
            number={step.number}
            label={step.label}
            isCompleted={currentStep > step.number}
            isActive={currentStep === step.number}
          />
          {index < steps.length - 1 && (
            <Connector isCompleted={currentStep > step.number} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
