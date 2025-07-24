'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';
import SchoolLevelTree from './SchoolLevelTree';
import EntityDialog from './EntityDialog';
import apiClient from '@/lib/apiClient';

// Types for selected node
interface SelectedNode {
  type: string;
  id: number;
  name: string;
  data?: any;
}

export default function AdminDashboard() {
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'add' | 'edit'>('add');
  const [dialogEntityType, setDialogEntityType] = useState<string>('');
  const [dialogParentId, setDialogParentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handler for selecting a node in the tree
  const handleSelect = (type: string, id: number, name: string) => {
    setSelected({ type, id, name });
  };

  // Handler for add action from tree
  const handleAdd = (type: string, parentId?: number) => {
    setDialogType('add');
    setDialogEntityType(type);
    setDialogParentId(parentId || null);
    setDialogOpen(true);
  };

  // Handler for edit action from tree
  const handleEdit = (type: string, id: number, data: any) => {
    setSelected({ type, id, name: data.name, data });
    setDialogType('edit');
    setDialogEntityType(type);
    setDialogOpen(true);
  };

  // Handler for delete action from tree
  const handleDelete = async (type: string, id: number) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      setLoading(true);
      const endpoint = getApiEndpoint(type);
      await apiClient.delete(`${endpoint}/${id}`);
      
      // Refresh the tree
      setRefreshKey(prev => prev + 1);
      
      // Clear selection if deleted item was selected
      if (selected?.id === id && selected?.type === type) {
        setSelected(null);
      }
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert(`Failed to delete ${type}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get API endpoint for entity type
  const getApiEndpoint = (type: string) => {
    switch (type) {
      case 'school-level': return '/api/v1/admin/school-levels';
      case 'form-grade': return '/api/v1/admin/forms-grades';
      case 'subject': return '/api/v1/admin/subjects';
      case 'topic': return '/api/v1/admin/topics';
      case 'subtopic': return '/api/v1/admin/subtopics';
      default: return '/api/v1/admin/entities';
    }
  };

  // Handler for dialog submit
  const handleDialogSubmit = async (values: any) => {
    try {
      setLoading(true);
      const endpoint = getApiEndpoint(dialogEntityType);
      
      // Add parent ID for new entities
      if (dialogType === 'add' && dialogParentId) {
        if (dialogEntityType === 'form-grade') {
          values.school_level_id = dialogParentId;
        } else if (dialogEntityType === 'subject') {
          values.form_grade_id = dialogParentId;
        } else if (dialogEntityType === 'topic') {
          values.subject_id = dialogParentId;
        } else if (dialogEntityType === 'subtopic') {
          values.topic_id = dialogParentId;
        }
      }
      
      if (dialogType === 'edit' && selected) {
        await apiClient.put(`${endpoint}/${selected.id}`, values);
      } else {
        await apiClient.post(endpoint, values);
      }
      
      setDialogOpen(false);
      setRefreshKey(prev => prev + 1); // Refresh the tree
    } catch (error: any) {
      console.error('Save failed:', error);
      alert(`Failed to save ${dialogEntityType}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar: Hierarchy Tree */}
      <aside className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Curriculum Hierarchy</h2>
          <Button 
            size="sm" 
            onClick={() => handleAdd('school-level')}
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        <SchoolLevelTree 
          key={refreshKey}
          onSelect={handleSelect}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </aside>

      {/* Main Panel: Details */}
      <main className="flex-1 p-6">
        {selected ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{selected.name}</span>
                    <Badge variant="outline">{selected.type}</Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">ID: {selected.id}</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEdit(selected.type, selected.id, selected.data || selected)}
                    disabled={loading}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(selected.type, selected.id)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.type === 'school-level' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAdd('form-grade', selected.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Form/Grade
                      </Button>
                    )}
                    {selected.type === 'form-grade' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAdd('subject', selected.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Subject
                      </Button>
                    )}
                    {selected.type === 'subject' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAdd('topic', selected.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Topic
                      </Button>
                    )}
                    {selected.type === 'topic' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAdd('subtopic', selected.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Subtopic
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Additional details can be added here */}
                {selected.data && (
                  <div>
                    <h4 className="font-medium mb-2">Details</h4>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(selected.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No item selected</p>
              <p className="text-sm">Select an item from the hierarchy to view details and manage it.</p>
            </div>
          </div>
        )}
      </main>

      {/* Entity Dialog for Add/Edit */}
      <EntityDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        entityType={dialogEntityType}
        initialValues={dialogType === 'edit' ? selected?.data || selected : undefined}
        onSubmit={handleDialogSubmit}
        loading={loading}
      />
    </div>
  );
} 