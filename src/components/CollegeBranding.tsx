
import React from 'react';
import { Card } from '@/components/ui/card';

interface CollegeData {
  code: string;
  name: string;
  logo: string;
  primary_color: string;
  secondary_color: string;
}

interface CollegeBrandingProps {
  college: CollegeData;
}

const CollegeBranding = ({ college }: CollegeBrandingProps) => {
  return (
    <Card className="p-4 bg-gradient-to-r from-white to-gray-50 border-l-4 shadow-md" 
          style={{ borderLeftColor: college.primary_color }}>
      <div className="flex items-center space-x-4">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, ${college.primary_color}, ${college.secondary_color})`,
            color: 'white'
          }}
        >
          {college.logo}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{college.name}</h3>
          <p className="text-sm text-gray-600">Institution Code: {college.code}</p>
          <div className="flex items-center mt-2">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: college.primary_color }}
            />
            <span className="text-xs text-gray-500">Verified Institution</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CollegeBranding;
