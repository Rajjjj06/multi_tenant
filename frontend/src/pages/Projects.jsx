import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { projectAPI, memberAPI } from '../services/api';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

const Projects = () => {
  const { currentOrg } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
  });
  const [editProject, setEditProject] = useState({
    name: '',
    description: '',
  });
  const [newMember, setNewMember] = useState({
    email: '',
    role: 'member',
  });

  // Fetch projects on mount
  useEffect(() => {
    if (currentOrg?._id) {
      fetchProjects();
    }
  }, [currentOrg]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectAPI.getProjects(currentOrg._id);
      if (response.success) {
        setProjects(response.data || []);
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

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await projectAPI.createProject(
        newProject.name,
        newProject.description,
        currentOrg._id
      );
      if (response.success) {
        setProjects([...projects, response.data]);
        setNewProject({ name: '', description: '' });
        setShowCreateModal(false);
      } else {
        setError(response.message || 'Failed to create project');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create project');
      console.error('Error creating project:', err);
    }
  };

  const handleViewMembers = async (project) => {
    setSelectedProject(project);
    setShowMembersModal(true);
    await fetchMembers(project._id);
  };

  const fetchMembers = async (projectId) => {
    try {
      setMembersLoading(true);
      setError(null);
      const response = await memberAPI.getMembers(currentOrg._id, projectId);
      if (response.success) {
        setMembers(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch members');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch members');
      console.error('Error fetching members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await memberAPI.addMember(
        currentOrg._id,
        selectedProject._id,
        newMember.email,
        newMember.role
      );
      if (response.success) {
        // Refresh members list
        await fetchMembers(selectedProject._id);
        setNewMember({ email: '', role: 'member' });
      } else {
        setError(response.message || 'Failed to add member');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add member');
      console.error('Error adding member:', err);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    try {
      setError(null);
      const response = await memberAPI.deleteMember(
        currentOrg._id,
        selectedProject._id,
        memberId
      );
      if (response.success) {
        // Refresh members list
        await fetchMembers(selectedProject._id);
      } else {
        setError(response.message || 'Failed to remove member');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove member');
      console.error('Error deleting member:', err);
    }
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setEditProject({
      name: project.name,
      description: project.description || '',
    });
    setShowUpdateModal(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await projectAPI.updateProject(
        selectedProject._id,
        editProject.name,
        editProject.description
      );
      if (response.success) {
        // Update project in list
        setProjects(projects.map(p => 
          p._id === selectedProject._id ? response.data : p
        ));
        setShowUpdateModal(false);
        setSelectedProject(null);
        setEditProject({ name: '', description: '' });
      } else {
        setError(response.message || 'Failed to update project');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update project');
      console.error('Error updating project:', err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    try {
      setError(null);
      const response = await projectAPI.deleteProject(projectId);
      if (response.success) {
        // Remove project from list
        setProjects(projects.filter(p => p._id !== projectId));
      } else {
        setError(response.message || 'Failed to delete project');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete project');
      console.error('Error deleting project:', err);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  if (!currentOrg) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <EmptyState
            icon="🏢"
            title="No Organization"
            description="Please create an organization first to manage projects"
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage and track all your organization's projects
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            + New Project
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {projects.length === 0 ? (
          <EmptyState
            icon="📁"
            title="No projects yet"
            description="Get started by creating your first project"
            action={
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Project
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description || 'No description'}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>{project.createdBy?.name || 'Owner'}</span>
                  <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewMembers(project)}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Members
                  </button>
                  <button
                    onClick={() => handleEditProject(project)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Members Modal */}
        <Modal
          isOpen={showMembersModal}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedProject(null);
            setMembers([]);
            setNewMember({ email: '', role: 'member' });
          }}
          title={`Members - ${selectedProject?.name || ''}`}
        >
          <div className="space-y-4">
            {/* Add Member Form */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Add Member</h3>
              <form onSubmit={handleAddMember} className="space-y-3">
                <div>
                  <label
                    htmlFor="memberEmail"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Email Address
                  </label>
                  <input
                    id="memberEmail"
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="member@example.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="memberRole"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Role
                  </label>
                  <select
                    id="memberRole"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="owner">Owner</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Add Member
                </button>
              </form>
            </div>

            {/* Members List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Project Members</h3>
              {membersLoading ? (
                <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading members...</div>
              ) : members.length === 0 ? (
                <div className="text-center py-4 text-gray-600 dark:text-gray-400">No members yet</div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
                            {member.user?.name?.charAt(0).toUpperCase() || member.user?.email?.charAt(0).toUpperCase() || 'M'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {member.user?.name || 'Unknown'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {member.user?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            member.role === 'owner'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                              : member.role === 'member'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {member.role}
                        </span>
                        {member.role !== 'owner' && (
                          <button
                            onClick={() => handleDeleteMember(member._id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>

        {/* Create Project Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Project"
        >
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label
                htmlFor="projectName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="My Awesome Project"
              />
            </div>
            <div>
              <label
                htmlFor="projectDescription"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description
              </label>
              <textarea
                id="projectDescription"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your project..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
              >
                Create Project
              </button>
            </div>
          </form>
        </Modal>

        {/* Update Project Modal */}
        <Modal
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedProject(null);
            setEditProject({ name: '', description: '' });
          }}
          title="Update Project"
        >
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <div>
              <label
                htmlFor="editProjectName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Project Name
              </label>
              <input
                id="editProjectName"
                type="text"
                value={editProject.name}
                onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="My Awesome Project"
              />
            </div>
            <div>
              <label
                htmlFor="editProjectDescription"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description
              </label>
              <textarea
                id="editProjectDescription"
                value={editProject.description}
                onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your project..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedProject(null);
                  setEditProject({ name: '', description: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
              >
                Update Project
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Projects;

