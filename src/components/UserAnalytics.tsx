import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Clock, Trophy, TrendingUp, Eye } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface AnalyticsOverview {
  totalSessions: number;
  totalUsers: number;
  averageScore: number;
  totalPlayTime: number;
  dailyActiveUsers: Array<{
    date: string;
    activeUsers: number;
  }>;
}

interface PerformanceData {
  level: number;
  gameMode: string;
  totalSessions: number;
  averageScore: number;
  averageTime: number;
  accuracyRate: number;
}

interface TopPerformer {
  _id: string;
  username: string;
  email: string;
  totalScore: number;
  totalSessions: number;
  totalTime: number;
  averageScore: number;
  accuracyRate: number;
}

interface UserDetail {
  user: {
    _id: string;
    username: string;
    email: string;
    created_at: string;
  };
  sessions: Array<any>;
  progress: Array<any>;
  levelScores: Array<any>;
  statistics: {
    totalSessions: number;
    totalScore: number;
    totalTime: number;
    correctAnswers: number;
    averageScore: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const UserAnalytics: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'performance' | 'top-performers' | 'user-detail'>('overview');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeView === 'overview') {
      fetchOverview();
    } else if (activeView === 'performance') {
      fetchPerformance();
    } else if (activeView === 'top-performers') {
      fetchTopPerformers();
    }
  }, [activeView]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/analytics/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOverview(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch overview data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/analytics/performance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPerformance(data.data.performanceByLevel);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPerformers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/analytics/top-performers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTopPerformers(data.data.topPerformers);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch top performers data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (userId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/analytics/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUserDetail(data.data);
        setActiveView('user-detail');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{overview?.totalSessions || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{overview?.totalUsers || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{overview?.averageScore?.toFixed(1) || 0}</p>
            </div>
            <Trophy className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Play Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(overview?.totalPlayTime || 0)}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Daily Active Users Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Daily Active Users (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={overview?.dailyActiveUsers || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Performance by Level &amp; Game Mode</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={performance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={(item) => `L${item.level} ${item.gameMode}`} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="averageScore" fill="#8884d8" name="Average Score" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Accuracy Rate by Level</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={(item) => `L${item.level}`} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Accuracy Rate']} />
              <Bar dataKey="accuracyRate" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Average Time by Level</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={(item) => `L${item.level}`} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}s`, 'Average Time']} />
              <Bar dataKey="averageTime" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderTopPerformers = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Top Performers</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {topPerformers.map((performer, index) => (
              <tr key={performer._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {performer.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {performer.totalScore}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {performer.totalSessions}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {performer.averageScore}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {performer.accuracyRate}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTime(performer.totalTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => fetchUserDetail(performer._id)}
                    className="text-blue-600 hover:text-blue-900 flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUserDetail = () => {
    if (!userDetail) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">User Details: {userDetail.user.username}</h3>
          <button
            onClick={() => setActiveView('top-performers')}
            className="text-blue-600 hover:text-blue-900"
          >
            ← Back to Top Performers
          </button>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-sm font-medium text-gray-600">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{userDetail.statistics.totalSessions}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-sm font-medium text-gray-600">Total Score</p>
            <p className="text-2xl font-bold text-gray-900">{userDetail.statistics.totalScore}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-sm font-medium text-gray-600">Average Score</p>
            <p className="text-2xl font-bold text-gray-900">{userDetail.statistics.averageScore?.toFixed(1)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-sm font-medium text-gray-600">Total Time</p>
            <p className="text-2xl font-bold text-gray-900">{formatTime(userDetail.statistics.totalTime)}</p>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-semibold">Recent Sessions</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userDetail.sessions.slice(0, 10).map((session, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.played_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Level {session.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.game_mode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.time_spent}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        session.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {session.is_correct ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('performance')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeView === 'performance'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveView('top-performers')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeView === 'top-performers'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Top Performers
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeView === 'overview' && renderOverview()}
      {activeView === 'performance' && renderPerformance()}
      {activeView === 'top-performers' && renderTopPerformers()}
      {activeView === 'user-detail' && renderUserDetail()}
    </div>
  );
};

export default UserAnalytics;