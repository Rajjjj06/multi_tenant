import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { taskAPI, projectAPI, memberAPI } from '../services/api';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

const Tasks = () => {
  const { currentOrg } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    projectId: '',
    memberIds: []
  });

  // Fetch projects on mount
  useEffect(() => {
    if (currentOrg?._id) {
      fetchProjects();
    }
  }, [currentOrg]);

  // Fetch tasks when project is selected
  useEffect(() => {
    if (selectedProject?._id && currentOrg?._id) {
      fetchTasks(selectedProject._id);
      fetchMembers(selectedProject._id);
    }
  }, [selectedProject, currentOrg]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectAPI.getProjects(currentOrg._id);
      if (response.success) {
        setProjects(response.data || []);
        // Auto-select first project if available
        if (response.data && response.data.length > 0 && !selectedProject) {
          setSelectedProject(response.data[0]);
        }
      } else {
        setError(response.message || 'Failed to fetch projects');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      setTasksLoading(true);
      setError(null);
      const response = await taskAPI.getTasks(currentOrg._id, projectId);
      if (response.success) {
        setTasks(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchMembers = async (projectId) => {
    try {
      setMembersLoading(true);
      const response = await memberAPI.getMembers(currentOrg._id, projectId);
      if (response.success) {
        setMembers(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.name || !newTask.projectId) {
      setError('Task name and project are required');
      return;
    }
    try {
      setError(null);
      const memberIds = newTask.memberIds.length > 0 ? newTask.memberIds : null;
      const response = await taskAPI.createTask(
        newTask.name,
        newTask.projectId,
        currentOrg._id,
        memberIds,
        newTask.description || null
      );
      if (response.success) {
        // Refresh tasks
        await fetchTasks(newTask.projectId);
        // Reset form
        setNewTask({ name: '', description: '', projectId: selectedProject._id || '', memberIds: [] });
        setShowCreateModal(false);
      } else {
        setError(response.message || 'Failed to create task');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create task');
      console.error('Error creating task:', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      setError(null);
      const response = await taskAPI.updateTaskStatus(taskId, newStatus);
      if (response.success) {
        // Update task in list
        setTasks(tasks.map(task => 
          task._id === taskId ? { ...task, status: newStatus } : task
        ));
      } else {
        setError(response.message || 'Failed to update task status');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update task status');
      console.error('Error updating task status:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    try {
      setError(null);
      const response = await taskAPI.deleteTask(taskId);
      if (response.success) {
        setTasks(tasks.filter(task => task._id !== taskId));
      } else {
        setError(response.message || 'Failed to delete task');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const toggleMemberSelection = (memberId) => {
    setNewTask(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter(id => id !== memberId)
        : [...prev.memberIds, memberId]
    }));
  };

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-700' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/20' },
    { id: 'done', title: 'Done', color: 'bg-green-100 dark:bg-green-900/20' },
  ];

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status || (!task.status && status === 'todo'));
  };

  if (!currentOrg) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <EmptyState
            icon="🏢"
            title="No Organization"
            description="Please create an organization first to manage tasks"
          />
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading projects...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage and organize all your tasks
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Project Selector */}
            {projects.length > 0 && (
              <select
                value={selectedProject?._id || ''}
                onChange={(e) => {
                  const project = projects.find(p => p._id === e.target.value);
                  setSelectedProject(project);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Table
              </button>
            </div>
            {selectedProject && (
              <button
                onClick={() => {
                  setNewTask({ name: '', projectId: selectedProject._id, memberIds: [] });
                  setShowCreateModal(true);
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                + New Task
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {!selectedProject ? (
          <EmptyState
            icon="📁"
            title="No project selected"
            description="Please select a project to view its tasks"
          />
        ) : tasksLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading tasks...</div>
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="✓"
            title="No tasks yet"
            description="Create your first task to get started"
            action={
              <button
                onClick={() => {
                  setNewTask({ name: '', description: '', projectId: selectedProject._id, memberIds: [] });
                  setShowCreateModal(true);
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Task
              </button>
            }
          />
        ) : viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
              <div key={column.id} className="space-y-4">
                <div className={`${column.color} p-4 rounded-lg`}>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {column.title} ({getTasksByStatus(column.id).length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {getTasksByStatus(column.id).map((task) => (
                    <div
                      key={task._id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {task.name}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm ml-2"
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex space-x-2">
                          {column.id !== 'todo' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task._id, 'todo')}
                              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              To Do
                            </button>
                          )}
                          {column.id !== 'in-progress' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task._id, 'in-progress')}
                              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30"
                            >
                              In Progress
                            </button>
                          )}
                          {column.id !== 'done' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task._id, 'done')}
                              className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/30"
                            >
                              Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {task.name}
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={task.status || 'todo'}
                        onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                        className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Task Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setNewTask({ name: '', description: '', projectId: selectedProject?._id || '', memberIds: [] });
          }}
          title="Create New Task"
        >
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label
                htmlFor="taskName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Task Name
              </label>
              <input
                id="taskName"
                type="text"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter task name"
              />
            </div>

            <div>
              <label
                htmlFor="taskDescription"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description (Optional)
              </label>
              <textarea
                id="taskDescription"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter task description..."
              />
            </div>

            <div>
              <label
                htmlFor="taskProject"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Project
              </label>
              <select
                id="taskProject"
                value={newTask.projectId}
                onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {members.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign Members (Optional - leave empty to assign all members)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-700/50 space-y-2">
                  {membersLoading ? (
                    <div className="text-sm text-gray-600 dark:text-gray-400">Loading members...</div>
                  ) : (
                    members.map((member) => (
                      <label
                        key={member._id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={newTask.memberIds.includes(member._id)}
                          onChange={() => toggleMemberSelection(member._id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {member.user?.name || member.user?.email || 'Unknown Member'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({member.role})
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {newTask.memberIds.length === 0 
                    ? 'All members will be assigned to this task'
                    : `${newTask.memberIds.length} member(s) selected`
                  }
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTask({ name: '', description: '', projectId: selectedProject?._id || '', memberIds: [] });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
              >
                Create Task
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
