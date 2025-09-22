// src/Home.js
import React from 'react';
import { 
  LayoutGrid, 
  ArrowRight
} from 'lucide-react';

const HomePage = ({ onNavigate }) => {
  const dashboards = [
    {
      id: 'engineering',
      title: 'Engineering',
      description: 'Analytics Hub for Engineering Projects',
      icon: LayoutGrid,
      color: 'blue'
    },
    {
      id: 'operations',
      title: 'Operations',
      description: 'Operational Management and Control Center',
      icon: LayoutGrid,
      color: 'green'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to BSF Dashboard
          </h1>
          <p className="text-base text-gray-600">
            Command Control Center - Select a dashboard to continue
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dashboards.map((dashboard) => {
            const Icon = dashboard.icon;
            return (
              <div
                key={dashboard.id}
                onClick={() => onNavigate(dashboard.id)}
                className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-100"
              >
                {/* Icon Container */}
                <div className="mb-4">
                  <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center
                    bg-gradient-to-br from-blue-500 to-blue-600
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {dashboard.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {dashboard.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-600">
                    {dashboard.stats}
                  </span>
                  <ArrowRight className="
                    w-4 h-4 text-gray-400 
                    group-hover:text-blue-600 
                    group-hover:translate-x-1 
                    transition-all duration-300
                  " />
                </div>

                {/* Hover Effect Overlay */}
                <div className="
                  absolute inset-0 rounded-2xl 
                  bg-gradient-to-br from-blue-500/0 to-purple-500/0 
                  group-hover:from-blue-500/5 group-hover:to-purple-500/5 
                  transition-all duration-300 pointer-events-none
                "></div>
              </div>
            );
          })}


        </div>
      </div>
    </div>
  );
};

export default HomePage;