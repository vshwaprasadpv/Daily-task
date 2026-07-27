import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Calendar } from 'lucide-react';

// Custom dot to make weekends red
const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const isWeekend = payload.isWeekend;
  
  if (!cx || !cy) return null;

  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={4} 
      stroke={isWeekend ? "#ef4444" : "#6366f1"} 
      strokeWidth={2} 
      fill="#1e1e2d" 
    />
  );
};

// Custom tick to make weekend labels red
const CustomTick = (props) => {
  const { x, y, payload, data } = props;
  const tickData = data.find(d => d.day === payload.value);
  const isWeekend = tickData?.isWeekend;

  return (
    <text 
      x={x} 
      y={y + 15} 
      textAnchor="middle" 
      fill={isWeekend ? "#ef4444" : "#9ca3af"} 
      fontSize={12}
    >
      {payload.value}
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-[#1e1e2d] border border-gray-800 p-3 rounded-lg shadow-xl">
        <p className="text-gray-300 font-medium mb-1">
          {new Date(dataPoint.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
        <p className="text-[#6366f1] font-bold">
          {dataPoint.hours} Hours Worked
        </p>
        {dataPoint.isWeekend && (
           <p className="text-red-500 text-xs mt-1 font-semibold">Weekend</p>
        )}
      </div>
    );
  }
  return null;
};

export default function ActivityTimeline({ employeeId = 'all' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics/timeline?employeeId=${employeeId}`);
        if (!res.ok) throw new Error('Failed to fetch timeline');
        const timelineData = await res.json();
        setData(timelineData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [employeeId]);



  if (loading) {
    return <div className="h-64 flex items-center justify-center text-gray-500">Loading timeline...</div>;
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-[#6366f1]" />
          30-Day Activity Timeline (Hours)
        </h2>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={true} horizontal={false} opacity={0.3} />
            <XAxis 
              dataKey="day" 
              tick={(props) => <CustomTick {...props} data={data} />} 
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#9ca3af', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#6366f1"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
