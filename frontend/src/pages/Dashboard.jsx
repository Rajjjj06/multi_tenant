import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { projectAPI, taskAPI, memberAPI } from '../services/api';

const Dashboard = () => {
  const { currentOrg, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect to organization-setup if user has no organization (and auth has finished loading)
  useEffect(() => {
    if (!authLoading && !currentOrg) {
      navigate('/organization-setup');
    }
  }, [currentOrg, authLoading, navigate]);

  useEffect(() => {
    if (currentOrg?._id) {
      fetchDashboardData();
    }
  }, [currentOrg]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch projects
      const projectsResponse = await projectAPI.getProjects(currentOrg._id);
      const fetchedProjects = projectsResponse.success ? (projectsResponse.data || []) : [];

      setProjects(fetchedProjects);

      // Fetch tasks from all projects and aggregate
      const allTasks = [];
      if (fetchedProjects.length > 0) {
        const taskPromises = fetchedProjects.map(project => 
          taskAPI.getTasks(currentOrg._id, project._id).catch(err => {
            console.error(`Error fetching tasks for project ${project._id}:`, err);
            return { success: false, data: [] };
          })
        );
        
        const taskResponses = await Promise.all(taskPromises);
        taskResponses.forEach(response => {
          if (response.success && response.data) {
            allTasks.push(...response.data);
          }
        });
      }
      setTasks(allTasks);

      // Fetch members from all projects and aggregate unique users
      const uniqueMemberUsers = new Set();
      if (fetchedProjects.length > 0) {
        const memberPromises = fetchedProjects.map(project => 
          memberAPI.getMembers(currentOrg._id, project._id).catch(err => {
            console.error(`Error fetching members for project ${project._id}:`, err);
            return { success: false, data: [] };
          })
        );
        
        const memberResponses = await Promise.all(memberPromises);
        memberResponses.forEach(response => {
          if (response.success && response.data) {
            response.data.forEach(member => {
              if (member.user?._id) {
                uniqueMemberUsers.add(member.user._id.toString());
              }
            });
          }
        });
      }
      setMembers(Array.from(uniqueMemberUsers));

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sort tasks by creation date (most recent first) and take top 5
  const recentTasks = [...tasks]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    })
    .slice(0, 5);

  const stats = [
    {
      name: 'Total Projects',
      value: projects.length,
      icon: '📁',
      change: '',
      changeType: 'neutral',
    },
    {
      name: 'Total Tasks',
      value: tasks.length,
      icon: '✓',
      change: '',
      changeType: 'neutral',
    },
    {
      name: 'Active Users',
      value: members.length,
      icon: '👥',
      change: '',
      changeType: 'neutral',
    },
    {
      name: 'Organization',
      value: currentOrg?.name || 'Not Set',
      icon: '🏢',
      change: '',
      changeType: 'neutral',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Welcome back! Here's what's happening with your organization.
            </p>
          </div>
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading dashboard data...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your organization.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{stat.name}</p>
                  <p className="mt-2 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">
                    {stat.value}
                  </p>
                  {stat.change && (
                    <p
                      className={`mt-1 text-xs sm:text-sm ${
                        stat.changeType === 'positive'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {stat.change} from last month
                    </p>
                  )}
                </div>
                <div className="text-2xl sm:text-4xl ml-2 flex-shrink-0">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Recent Tasks</h2>
          </div>
          <div className="p-4 sm:p-6">
            {recentTasks.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                        {task.name}
                      </h3>
                      {task.description && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-2 sm:flex-shrink-0">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          task.status === 'done'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : task.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {task.status || 'todo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center py-6 sm:py-8">
                No recent tasks
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
