import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModelStore } from '../store/modelStore';
import { ModelDefinition, ModelField } from '../types';
import { Plus, Trash2, Save } from 'lucide-react';

export default function ModelBuilder() {
  const navigate = useNavigate();
  const { createModel } = useModelStore();
  
  const [modelName, setModelName] = useState('');
  const [ownerField, setOwnerField] = useState('');
  const [fields, setFields] = useState<ModelField[]>([
    { name: 'id', type: 'string', required: true }
  ]);
  const [rbac, setRbac] = useState({
    ADMIN: ['all'],
    MANAGER: ['create', 'read', 'update'],
    VIEWER: ['read']
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addField = () => {
    setFields([...fields, { name: '', type: 'string', required: false }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<ModelField>) => {
    setFields(fields.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const model: ModelDefinition = {
        name: modelName,
        fields,
        ownerField: ownerField || undefined,
        rbac
      };

      await createModel(model);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create model');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Model Builder</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Model Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model Name *
          </label>
          <input
            type="text"
            required
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Product, Employee, Student"
          />
        </div>

        {/* Owner Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Owner Field (optional)
          </label>
          <input
            type="text"
            value={ownerField}
            onChange={(e) => setOwnerField(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., ownerId, userId"
          />
          <p className="mt-1 text-sm text-gray-500">
            If specified, users can only modify their own records (except Admin)
          </p>
        </div>

        {/* Fields */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Fields *
            </label>
            <button
              type="button"
              onClick={addField}
              className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              <Plus size={16} />
              <span>Add Field</span>
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={index} className="flex space-x-3 items-start p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    value={field.name}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Field name"
                  />
                </div>
                <div className="w-32">
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, { type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                  </select>
                </div>
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    className="rounded"
                  />
                  <span>Required</span>
                </label>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RBAC Permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Role-Based Permissions
          </label>
          <div className="space-y-3">
            {Object.entries(rbac).map(([role, permissions]) => (
              <div key={role} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                <div className="w-24 font-medium text-sm">{role}</div>
                <div className="flex space-x-3">
                  {['create', 'read', 'update', 'delete'].map((perm) => (
                    <label key={perm} className="flex items-center space-x-1 text-sm">
                      <input
                        type="checkbox"
                        checked={permissions.includes('all') || permissions.includes(perm)}
                        disabled={permissions.includes('all')}
                        onChange={(e) => {
                          const newPerms = e.target.checked
                            ? [...permissions, perm]
                            : permissions.filter((p) => p !== perm);
                          setRbac({ ...rbac, [role]: newPerms });
                        }}
                        className="rounded"
                      />
                      <span>{perm}</span>
                    </label>
                  ))}
                  <label className="flex items-center space-x-1 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={permissions.includes('all')}
                      onChange={(e) => {
                        const newPerms = e.target.checked ? ['all'] : ['read'];
                        setRbac({ ...rbac, [role]: newPerms });
                      }}
                      className="rounded"
                    />
                    <span>All</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save size={18} />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Model'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
