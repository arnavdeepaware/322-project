import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function SuperUserDashboard() {
  const [users, setUsers] = useState([]);
  const [blacklistRequests, setBlacklistRequests] = useState([]);
  const [blacklistedWords, setBlacklistedWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [newWord, setNewWord] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchBlacklistRequests();
    fetchBlacklistedWords();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clear error message after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function fetchUsers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email !== 'arshanand2524@gmail.com') {
        setError('Unauthorized access');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;
      setUsers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBlacklistRequests() {
    try {
      const { data, error } = await supabase
        .from('blacklist_requests')
        .select('*');

      if (error) throw error;
      setBlacklistRequests(data || []);
    } catch (error) {
      setError(error.message);
    }
  }

  async function fetchBlacklistedWords() {
    try {
      const { data, error } = await supabase
        .from('blacklist')
        .select('*');

      if (error) throw error;
      setBlacklistedWords(data || []);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      // First delete any document access entries
      const { error: accessError } = await supabase
        .from('document_access')
        .delete()
        .eq('user_id', userId);

      if (accessError) throw accessError;

      // Then delete any documents owned by the user
      const { error: docError } = await supabase
        .from('documents')
        .delete()
        .eq('owner_id', userId);

      if (docError) throw docError;

      // Delete the user from the users table using RPC
      const { error: userError } = await supabase.rpc('delete_user', { user_id: userId });

      if (userError) throw userError;

      setSuccessMessage('User successfully deleted');
      fetchUsers();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveBlacklistRequest(word) {
    try {
      setLoading(true);
      
      // Add to blacklist table
      const { error: blacklistError } = await supabase
        .from('blacklist')
        .insert([{ word: word }]);

      if (blacklistError) throw blacklistError;

      // Remove from requests table
      const { error: requestError } = await supabase
        .from('blacklist_requests')
        .delete()
        .eq('word', word);

      if (requestError) throw requestError;

      setSuccessMessage('Word successfully added to blacklist');
      fetchBlacklistRequests();
      fetchBlacklistedWords();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRejectBlacklistRequest(word) {
    if (!window.confirm(`Are you sure you want to reject "${word}" from being blacklisted?`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('blacklist_requests')
        .delete()
        .eq('word', word);

      if (error) throw error;

      setSuccessMessage('Word request rejected');
      fetchBlacklistRequests();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveBlacklistedWord(word) {
    if (!window.confirm(`Are you sure you want to remove "${word}" from the blacklist?`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('blacklist')
        .delete()
        .eq('word', word);

      if (error) throw error;

      setSuccessMessage('Word successfully removed from blacklist');
      fetchBlacklistedWords();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = blacklistRequests.filter(request => 
    request.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWords = blacklistedWords.filter(word => 
    word.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !users.length) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Super User Dashboard</h1>
        <div className="space-y-2">
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block p-4 text-lg font-medium ${
                activeTab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 text-lg font-medium ${
                activeTab === 'blacklist'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('blacklist')}
            >
              Blacklist Management
            </button>
          </li>
        </ul>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={`Search ${activeTab === 'users' ? 'users' : 'blacklisted words'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.tokens} tokens
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blacklist Tab */}
      {activeTab === 'blacklist' && (
        <div className="space-y-8">
          {/* Blacklist Requests Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Blacklist Requests</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.word} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.word}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                          <button
                            onClick={() => handleApproveBlacklistRequest(request.word)}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectBlacklistRequest(request.word)}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRequests.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No pending blacklist requests</p>
                )}
              </div>
            </div>
          </div>

          {/* Current Blacklist Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Blacklist</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWords.map((item) => (
                      <tr key={item.word} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.word}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleRemoveBlacklistedWord(item.word)}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredWords.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No blacklisted words found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperUserDashboard; 