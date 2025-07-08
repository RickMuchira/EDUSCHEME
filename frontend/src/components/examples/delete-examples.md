# Enhanced Delete Dialog Usage Examples

## Basic Usage

```typescript
import { EnhancedDeleteDialog } from '@/components/ui/enhanced-delete-dialog'

function MyComponent() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDelete = async (permanent: boolean) => {
    setDeleteLoading(true)
    try {
      await myApi.delete(itemToDelete.id, !permanent) // Note: API expects softDelete boolean
      toast.success(`Item ${permanent ? 'deleted' : 'deactivated'} successfully`)
      setDeleteDialogOpen(false)
      refreshList()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => {
        setItemToDelete(item)
        setDeleteDialogOpen(true)
      }}>
        Delete
      </Button>

      {itemToDelete && (
        <EnhancedDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
          loading={deleteLoading}
          title="Delete Item"
          itemName={itemToDelete.name}
          itemType="item"
          isActive={itemToDelete.is_active}
        />
      )}
    </>
  )
}
```

## Advanced Usage with Custom Content

```typescript
<EnhancedDeleteDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  onConfirm={handleDelete}
  loading={deleteLoading}
  title="Delete Subject"
  itemName={subject.name}
  itemType="subject"
  isActive={subject.is_active}
  showSoftDeleteOption={true}
  showHardDeleteOption={true}
>
  {/* Custom content */}
  <div className="space-y-2">
    <h5 className="font-medium text-gray-900">Subject Details:</h5>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-gray-600">Code:</span>
        <span className="ml-2 font-mono">{subject.code}</span>
      </div>
      <div>
        <span className="text-gray-600">Topics:</span>
        <span className="ml-2">{subject.topics_count || 0}</span>
      </div>
    </div>
    
    {subject.topics_count > 0 && (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-700">
          This subject contains {subject.topics_count} topics that will also be affected.
        </p>
      </div>
    )}
  </div>
</EnhancedDeleteDialog>
```

## Configuration Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | boolean | - | Controls dialog visibility |
| `onOpenChange` | function | - | Called when dialog should open/close |
| `onConfirm` | function | - | Called with `(permanent: boolean)` when confirmed |
| `loading` | boolean | false | Shows loading state |
| `title` | string | - | Dialog title |
| `itemName` | string | - | Name of item being deleted |
| `itemType` | string | 'item' | Type of item (term, subject, etc.) |
| `isActive` | boolean | true | Whether item is currently active |
| `showSoftDeleteOption` | boolean | true | Show soft delete tab |
| `showHardDeleteOption` | boolean | true | Show hard delete tab |
| `children` | ReactNode | - | Custom content in dialog |

## Different Use Cases

### 1. Only Soft Delete (for important data)
```typescript
<EnhancedDeleteDialog
  // ... other props
  showSoftDeleteOption={true}
  showHardDeleteOption={false}
/>
```

### 2. Only Hard Delete (for temporary data)
```typescript
<EnhancedDeleteDialog
  // ... other props
  showSoftDeleteOption={false}
  showHardDeleteOption={true}
/>
```

### 3. Simple Delete Dialog
```typescript
import { SimpleDeleteDialog } from '@/components/ui/enhanced-delete-dialog'

<SimpleDeleteDialog
  open={open}
  onOpenChange={setOpen}
  onConfirm={handleSimpleDelete}
  loading={loading}
  title="Delete Item"
  description="Are you sure you want to delete this item?"
  itemName={item.name}
/>
```

## API Integration Notes

Most APIs expect a `soft_delete` boolean parameter:
- `soft_delete: true` = soft delete (deactivate)
- `soft_delete: false` = hard delete (permanent)

The dialog calls `onConfirm(permanent: boolean)` where:
- `permanent: false` = soft delete
- `permanent: true` = hard delete

So you typically need to invert the value:
```typescript
const handleDelete = async (permanent: boolean) => {
  await api.delete(id, !permanent) // Invert for API
}
```