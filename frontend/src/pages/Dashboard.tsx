import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useModelStore } from '../store/modelStore';
import { useAuthStore } from '../store/authStore';
import { Database, Trash2, Plus } from 'lucide-react';

export default function Dashboard() {
  const { models, fetchModels, deleteModel, isLoading } = useModelStore();
  const { user } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      await fetchModels();
    } catch (err: any) {
      setError('Failed to load models');
    }
  };

  const handleDelete = async (modelName: string) => {
    if (!confirm(`Are you sure you want to delete the ${modelName} model?`)) {
      return;
    }

    try {
      await deleteModel(modelName);
    } catch (err: any) {
      setError(`Failed to delete model: ${err.response?.data?.error || err.message}`);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Models</h1>
        {user?.role === 'ADMIN' && (
          <Link
            to="/model-builder"
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            <Plus size={20} />
            <span>Create Model</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {models.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No models yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            {user?.role === 'ADMIN'
              ? 'Get started by creating a new model.'
              : 'Ask an admin to create models.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <div key={model.name} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{model.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{model.fields.length} fields</p>
                </div>
                <Database className="h-8 w-8 text-indigo-600" />
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fields:</h4>
                <div className="space-y-1">
                  {model.fields.slice(0, 3).map((field) => (
                    <div key={field.name} className="text-sm text-gray-600">
                      <span className="font-mono">{field.name}</span>
                      <span className="text-gray-400 ml-2">({field.type})</span>
                    </div>
                  ))}
                  {model.fields.length > 3 && (
                    <p className="text-sm text-gray-400">
                      +{model.fields.length - 3} more
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/data/${model.name}`}
                  className="flex-1 bg-indigo-100 text-indigo-700 px-4 py-2 rounded text-center text-sm font-medium hover:bg-indigo-200"
                >
                  Manage Data
                </Link>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDelete(model.name)}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm font-medium hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
