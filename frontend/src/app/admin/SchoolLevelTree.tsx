import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { SchoolLevel, FormGrade, Subject, Topic, Subtopic } from '@/lib/api';
import apiClient from '@/lib/apiClient';

// API types are imported from api.ts
interface TreeSubtopic { id: number; name: string; }
interface TreeTopic { id: number; name: string; subtopics: TreeSubtopic[]; }
interface TreeSubject { id: number; name: string; topics: TreeTopic[]; }
interface TreeFormGrade { id: number; name: string; subjects: TreeSubject[]; }
interface TreeSchoolLevel { id: number; name: string; formsGrades: TreeFormGrade[]; }

interface SchoolLevelTreeProps {
  onSelect?: (type: string, id: number, name: string) => void;
  onAdd?: (type: string, parentId?: number) => void;
  onEdit?: (type: string, id: number, data: any) => void;
  onDelete?: (type: string, id: number) => void;
  mini?: boolean;
}

// Recursive Tree Node
function TreeNode({ 
  label, 
  children, 
  onAdd, 
  onEdit, 
  onDelete, 
  onSelect,
  defaultOpen = false,
  mini = false 
}: {
  label: string;
  children?: React.ReactNode;
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
  defaultOpen?: boolean;
  mini?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const iconSize = mini ? 12 : 16;
  const buttonSize = mini ? 'sm' : 'icon';
  
  return (
    <div className={`ml-2 my-1 ${mini ? 'my-0.5' : ''}`}>
      <div className={`flex items-center space-x-1 group hover:bg-gray-50 rounded px-1 ${mini ? 'text-xs' : ''}`}>
        {children ? (
          <button 
            onClick={() => setOpen((o) => !o)} 
            className="focus:outline-none hover:bg-gray-100 rounded p-0.5"
          >
            {open ? <ChevronDown size={iconSize} /> : <ChevronRight size={iconSize} />}
          </button>
        ) : (
          <span className={`inline-block ${mini ? 'w-3' : 'w-4'}`} />
        )}
        <span 
          className={`font-medium text-gray-800 cursor-pointer hover:text-blue-600 flex-1 ${mini ? 'text-xs' : ''}`}
          onClick={onSelect}
        >
          {label}
        </span>
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex space-x-0.5`}>
          {onAdd && (
            <Button 
              size={buttonSize} 
              variant="ghost" 
              onClick={onAdd}
              className={`h-6 w-6 ${mini ? 'h-5 w-5' : ''}`}
            >
              <Plus size={iconSize - 2} />
            </Button>
          )}
          {onEdit && (
            <Button 
              size={buttonSize} 
              variant="ghost" 
              onClick={onEdit}
              className={`h-6 w-6 ${mini ? 'h-5 w-5' : ''}`}
            >
              <Edit size={iconSize - 2} />
            </Button>
          )}
          {onDelete && (
            <Button 
              size={buttonSize} 
              variant="ghost" 
              onClick={onDelete}
              className={`h-6 w-6 text-red-600 hover:text-red-800 ${mini ? 'h-5 w-5' : ''}`}
            >
              <Trash2 size={iconSize - 2} />
            </Button>
          )}
        </div>
      </div>
      {open && children && (
        <div className={`ml-4 border-l border-gray-200 pl-2 ${mini ? 'ml-3 pl-1' : ''}`}>
          {children}
        </div>
      )}
    </div>
  );
}

// Main Tree Component
export default function SchoolLevelTree({ 
  onSelect, 
  onAdd, 
  onEdit, 
  onDelete,
  mini = false 
}: SchoolLevelTreeProps) {
  const [data, setData] = useState<TreeSchoolLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  const fetchHierarchyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch school levels with nested data
      const response = await apiClient.get('/api/v1/admin/hierarchy');
      
      if (response.success) {
        setData(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch data');
      }
    } catch (err: any) {
      console.error('Error fetching hierarchy data:', err);
      setError(err.message || 'Failed to load hierarchy data');
      
      // Fallback mock data for development
      setData([
        {
          id: 1,
          name: 'Primary',
          formsGrades: [
            {
              id: 1,
              name: 'Grade 1',
              subjects: [
                {
                  id: 1,
                  name: 'Mathematics',
                  topics: [
                    {
                      id: 1,
                      name: 'Numbers',
                      subtopics: [
                        { id: 1, name: 'Counting' },
                        { id: 2, name: 'Addition' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2 text-sm text-gray-600">Loading hierarchy...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p className="text-sm">Error: {error}</p>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={fetchHierarchyData}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`w-full ${mini ? 'text-xs' : ''}`}>
      {data.length === 0 ? (
        <div className="p-4 text-gray-500 text-center">
          <p>No school levels found</p>
          {onAdd && (
            <Button 
              size="sm" 
              onClick={() => onAdd('school-level')}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add School Level
            </Button>
          )}
        </div>
      ) : (
        data.map((school) => (
          <TreeNode
            key={school.id}
            label={school.name}
            onAdd={() => onAdd?.('form-grade', school.id)}
            onEdit={() => onEdit?.('school-level', school.id, school)}
            onDelete={() => onDelete?.('school-level', school.id)}
            onSelect={() => onSelect?.('school-level', school.id, school.name)}
            mini={mini}
          >
            {school.formsGrades?.map((form) => (
              <TreeNode
                key={form.id}
                label={form.name}
                onAdd={() => onAdd?.('subject', form.id)}
                onEdit={() => onEdit?.('form-grade', form.id, form)}
                onDelete={() => onDelete?.('form-grade', form.id)}
                onSelect={() => onSelect?.('form-grade', form.id, form.name)}
                mini={mini}
              >
                {form.subjects?.map((subject) => (
                  <TreeNode
                    key={subject.id}
                    label={subject.name}
                    onAdd={() => onAdd?.('topic', subject.id)}
                    onEdit={() => onEdit?.('subject', subject.id, subject)}
                    onDelete={() => onDelete?.('subject', subject.id)}
                    onSelect={() => onSelect?.('subject', subject.id, subject.name)}
                    mini={mini}
                  >
                    {subject.topics?.map((topic) => (
                      <TreeNode
                        key={topic.id}
                        label={topic.name}
                        onAdd={() => onAdd?.('subtopic', topic.id)}
                        onEdit={() => onEdit?.('topic', topic.id, topic)}
                        onDelete={() => onDelete?.('topic', topic.id)}
                        onSelect={() => onSelect?.('topic', topic.id, topic.name)}
                        mini={mini}
                      >
                        {topic.subtopics?.map((sub) => (
                          <TreeNode
                            key={sub.id}
                            label={sub.name}
                            onEdit={() => onEdit?.('subtopic', sub.id, sub)}
                            onDelete={() => onDelete?.('subtopic', sub.id)}
                            onSelect={() => onSelect?.('subtopic', sub.id, sub.name)}
                            mini={mini}
                          />
                        ))}
                      </TreeNode>
                    ))}
                  </TreeNode>
                ))}
              </TreeNode>
            ))}
          </TreeNode>
        ))
      )}
    </div>
  );
} 