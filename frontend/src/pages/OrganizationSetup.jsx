import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';

const OrganizationSetup = () => {
  const [orgName, setOrgName] = useState('');
  const { createOrganization, currentOrg } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if user already has an organization
  useEffect(() => {
    if (currentOrg) {
      navigate('/dashboard');
    }
  }, [currentOrg, navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) {
      return;
    }
    
    const result = await createOrganization(orgName);
    if (result.success) {
      navigate('/dashboard');
    } else {
      alert(result.error || 'Failed to create organization');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Create your organization
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Get started by creating your organization
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleCreate}>
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Organization Name
              </label>
              <input
                id="orgName"
                name="orgName"
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Acme Inc."
              />
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Create Organization
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSetup;

