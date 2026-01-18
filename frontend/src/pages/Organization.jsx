import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { memberAPI } from '../services/api';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

const Organization = () => {
  const { currentOrg, organizations, switchOrganization } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(currentOrg?._id || '');

  useEffect(() => {
    if (currentOrg?._id) {
      fetchOrganizationMembers();
    }
  }, [currentOrg]);

  const fetchOrganizationMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await memberAPI.getOrganizationMembers(currentOrg._id);
      if (response.success) {
        setMembers(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch members');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch members');
      console.error('Error fetching organization members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = (e) => {
    e.preventDefault();
    // Dummy invite - just close modal
    setShowInviteModal(false);
    setInviteEmail('');
    alert('Invitation sent! (This is a demo)');
  };

  const handleSwitchOrg = (orgId) => {
    switchOrganization(orgId);
    setSelectedOrg(orgId);
  };

  if (!currentOrg) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <EmptyState
            icon="🏢"
            title="No Organization"
            description="Please create an organization first"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organization</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your organization settings and members
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Organization Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Organization Details
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Organization Name
                </label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                  {currentOrg?.name || 'No organization selected'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created At
                </label>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {currentOrg?.createdAt
                    ? new Date(currentOrg.createdAt).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Switch Organization */}
        {organizations.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Switch Organization
              </h2>
            </div>
            <div className="p-6">
              <select
                value={selectedOrg}
                onChange={(e) => handleSwitchOrg(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                {organizations.map((org) => (
                  <option key={org._id || org.id} value={org._id || org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Members */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Members</h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Invite Member
            </button>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-6 text-gray-600 dark:text-gray-400">
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No members yet"
                description="Invite team members to get started"
              />
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-medium">
                          {member.user?.name?.charAt(0).toUpperCase() || 
                           member.user?.email?.charAt(0).toUpperCase() || 
                           'M'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {member.user?.name || 'Unknown'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.user?.email || 'No email'}
                        </p>
                        {member.projects && member.projects.length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Projects: {member.projects.map(p => p.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          member.role === 'owner'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                            : member.role === 'member'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {member.role}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Joined {new Date(member.addedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Invite Modal */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite Team Member"
        >
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label
                htmlFor="inviteEmail"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>
              <input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="colleague@example.com"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
              >
                Send Invitation
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Organization;
