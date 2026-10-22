'use client'

import { coverage } from '@/app/page-content'
import { MapPin, Zap, Users } from 'lucide-react'

export default function JijiCoverageSection() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-block px-4 py-2 rounded-full bg-[#1E90FF] bg-opacity-10 border border-[#1E90FF] border-opacity-30">
            <span className="text-[#1E90FF] font-semibold text-sm">Our Coverage</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#003D7A]">
            Connected Across East Africa
          </h2>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Three countries, strategic hubs, and efficient logistics network.
          </p>
        </div>

       

        {/* Key Stats - Professional layout */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 py-8 bg-gradient-to-r from-[#F5F7FA] to-white rounded-xl px-8">
          <div className="text-center">
           
            <div className="text-2xl font-bold text-[#003D7A]">{coverage.hubs.length}+</div>
            <div className="text-sm text-gray-600">Distribution Hubs</div>
          </div>
          
          <div className="text-center">
            
            <div className="text-2xl font-bold text-[#003D7A]">24/7</div>
            <div className="text-sm text-gray-600">Round-the-clock Service</div>
          </div>

          <div className="text-center">
          
            <div className="text-2xl font-bold text-[#003D7A]">99.2%</div>
            <div className="text-sm text-gray-600">On-Time Delivery</div>
          </div>
        </div>

        {/* Hubs Table - Simplified */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#1E90FF] bg-[#F5F7FA]">
                <th className="text-left py-3 px-4 font-bold text-[#003D7A]">Hub</th>
                <th className="text-left py-3 px-4 font-bold text-[#003D7A]">Location</th>
                <th className="text-left py-3 px-4 font-bold text-[#003D7A]">Type</th>
                <th className="text-left py-3 px-4 font-bold text-[#003D7A]">Status</th>
              </tr>
            </thead>
            <tbody>
              {coverage.hubs.map((hub, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 hover:bg-[#F5F7FA] transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-[#003D7A]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#FFD700]"></div>
                      {hub.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 text-xs">{hub.city}, {hub.country}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-[#1E90FF] bg-opacity-10 text-[#1E90FF]">
                      {hub.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-600"> Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
