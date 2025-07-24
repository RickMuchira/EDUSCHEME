import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EntityDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  initialValues?: any;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

// TODO: Replace with real form components for each entity type
export default function EntityDialog({ 
  open, 
  onClose, 
  entityType, 
  initialValues, 
  onSubmit, 
  loading = false 
}: EntityDialogProps) {
  const [value, setValue] = React.useState(initialValues?.name || '');

  React.useEffect(() => {
    setValue(initialValues?.name || '');
  }, [initialValues]);

  const handleSubmit = () => {
    onSubmit({ name: value });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialValues ? `Edit ${entityType}` : `Add ${entityType}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={`Enter ${entityType} name`}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !value.trim()}>
            {loading ? 'Saving...' : (initialValues ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 