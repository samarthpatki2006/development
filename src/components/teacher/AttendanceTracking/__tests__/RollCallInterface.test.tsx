import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import RollCallInterface from '../RollCallInterface';
import { Student } from '../types';

// Mock the useTextToSpeech hook
vi.mock('../hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({
    speak: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    isSupported: true,
    isSpeaking: false,
    isPaused: false,
    error: null,
  }),
}));

const mockStudents: Student[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    roll_number: '001',
    attendance_status: 'pending',
    attendance_percentage: 85,
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    roll_number: '002',
    attendance_status: 'pending',
    attendance_percentage: 92,
  },
];

const defaultProps = {
  students: mockStudents,
  currentIndex: 0,
  isActive: false,
  onStart: vi.fn(),
  onPause: vi.fn(),
  onStop: vi.fn(),
  onNext: vi.fn(),
  onPrevious: vi.fn(),
  onCurrentIndexChange: vi.fn(),
};

describe('RollCallInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with supported browser', () => {
    render(<RollCallInterface {...defaultProps} />);
    
    expect(screen.getByText('Roll Call Interface')).toBeInTheDocument();
    expect(screen.getByText('Current Student')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Roll Number: 001')).toBeInTheDocument();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('shows start button when not active', () => {
    render(<RollCallInterface {...defaultProps} />);
    
    expect(screen.getByText('Start Roll Call')).toBeInTheDocument();
    expect(screen.queryByText('Pause')).not.toBeInTheDocument();
    expect(screen.queryByText('Stop')).not.toBeInTheDocument();
  });

  it('shows pause and stop buttons when active', () => {
    render(<RollCallInterface {...defaultProps} isActive={true} />);
    
    expect(screen.queryByText('Start Roll Call')).not.toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('Stop')).toBeInTheDocument();
  });

  it('calls onStart when start button is clicked', () => {
    render(<RollCallInterface {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Start Roll Call'));
    expect(defaultProps.onStart).toHaveBeenCalled();
  });

  it('calls onPause when pause button is clicked', () => {
    render(<RollCallInterface {...defaultProps} isActive={true} />);
    
    fireEvent.click(screen.getByText('Pause'));
    expect(defaultProps.onPause).toHaveBeenCalled();
  });

  it('calls onStop when stop button is clicked', () => {
    render(<RollCallInterface {...defaultProps} isActive={true} />);
    
    fireEvent.click(screen.getByText('Stop'));
    expect(defaultProps.onStop).toHaveBeenCalled();
  });

  it('calls onNext when next button is clicked', () => {
    render(<RollCallInterface {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Next'));
    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it('calls onPrevious when previous button is clicked', () => {
    render(<RollCallInterface {...defaultProps} currentIndex={1} />);
    
    fireEvent.click(screen.getByText('Previous'));
    expect(defaultProps.onPrevious).toHaveBeenCalled();
  });

  it('disables previous button at first student', () => {
    render(<RollCallInterface {...defaultProps} currentIndex={0} />);
    
    expect(screen.getByText('Previous')).toBeDisabled();
  });

  it('disables next button at last student', () => {
    render(<RollCallInterface {...defaultProps} currentIndex={1} />);
    
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('displays current student information correctly', () => {
    render(<RollCallInterface {...defaultProps} currentIndex={1} />);
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Roll Number: 002')).toBeInTheDocument();
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
  });

  it('shows status indicators correctly', () => {
    render(<RollCallInterface {...defaultProps} isActive={true} />);
    
    expect(screen.getByText(/Roll Call: Active/)).toBeInTheDocument();
    expect(screen.getByText(/Speech: Ready/)).toBeInTheDocument();
  });

  it('disables start button when no students', () => {
    render(<RollCallInterface {...defaultProps} students={[]} />);
    
    expect(screen.getByText('Start Roll Call')).toBeDisabled();
  });
});

// Note: Unsupported browser scenario is handled by the component's fallback UI
// when useTextToSpeech returns isSupported: false