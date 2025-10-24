import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModelStore } from '../store/modelStore';
import api from '../lib/api';
import { DynamicRecord } from '../types';
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';

export default function DataManager() {
  const { modelName } = useParams<{ modelName: string }>();
  const navigate = useNavigate();
  const { currentModel, fetchModel } = useModelStore();

  const [records, setRecords] = useState<DynamicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DynamicRecord | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (modelName) {
      loadModel();
      loadRecords();
    }
  }, [modelName]);

  const loadModel = async () => {
    try {
      await fetchModel(modelName!);
    } catch (err: any) {
      setError('Failed to load model');
    }
  };

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/${modelName}`);
      setRecords(response.data.data);
    } catch (err: any) {
      setError('Failed to load records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/${modelName}`, formData);
      await loadRecords();
      setShowForm(false);
      setFormData({});
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create record');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    try {
      await api.put(`/${modelName}/${editingRecord.id}`, formData);
      await loadRecords();
      setEditingRecord(null);
      setFormData({});
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update record');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      await api.delete(`/${modelName}/${id}`);
      await loadRecords();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete record');
    }
  };

  const openCreateForm = () => {
    setFormData({});
    setEditingRecord(null);
    setShowForm(true);
  };

  const openEditForm = (record: DynamicRecord) => {
    setFormData(record.data);
    setEditingRecord(record);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({});
  };

  if (!currentModel) {
    return <div className="text-center py-8">Loading model...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{currentModel.name} Data</h1>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          <Plus size={20} />
          <span>Add Record</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingRecord ? 'Edit Record' : 'Create Record'}
            </h2>
            
            <form onSubmit={editingRecord ? handleUpdate : handleCreate} className="space-y-4">
              {currentModel.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.name} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.type === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={formData[field.name] || false}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                      className="rounded"
                    />
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  ) : field.type === 'date' ? (
                    <input
                      type="date"
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <input
                      type="text"
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {editingRecord ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Records Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading records...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No records yet. Create your first one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {currentModel.fields.map((field) => (
                    <th
                      key={field.name}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {field.name}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id}>
                    {currentModel.fields.map((field) => (
                      <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof record.data[field.name] === 'boolean'
                          ? record.data[field.name] ? '✓' : '✗'
                          : String(record.data[field.name] || '-')}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditForm(record)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
