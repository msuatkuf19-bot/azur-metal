'use client';

import { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  const generatedId = useId();
  const id = props.id || generatedId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full bg-white px-3.5 py-2.5 text-sm border rounded-xl shadow-sm transition-colors placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          error ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'
        } ${className}`}
        {...props}
      />
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className = '', ...props }: TextAreaProps) {
  const generatedId = useId();
  const id = props.id || generatedId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full bg-white px-3.5 py-2.5 text-sm border rounded-xl shadow-sm transition-colors placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          error ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'
        } ${className}`}
        rows={4}
        {...props}
      />
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  const generatedId = useId();
  const id = props.id || generatedId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full bg-white px-3.5 py-2.5 text-sm border rounded-xl shadow-sm transition-colors placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          error ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'
        } ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
