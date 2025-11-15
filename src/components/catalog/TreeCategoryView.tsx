import { useState } from "react";
import { ChevronRight, ChevronDown, FolderOpen, Folder, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Category } from "@/hooks/useCategories";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface TreeNode extends Category {
  children: TreeNode[];
  level: number;
}

interface TreeCategoryItemProps {
  node: TreeNode;
  isSelected: boolean;
  positionCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  canDrag: boolean;
}

function TreeCategoryItem({
  node,
  isSelected,
  positionCount,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  canDrag,
}: TreeCategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const paddingLeft = node.level * 24;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "group flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent transition-colors",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${paddingLeft + 12}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-5" />
        )}

        {/* Drag Handle */}
        {canDrag && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Icon */}
        {hasChildren ? (
          <FolderOpen className="h-4 w-4 text-primary" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}

        {/* Category Name */}
        <button
          className="flex-1 text-left text-sm truncate"
          onClick={onSelect}
        >
          {node.name}
        </button>

        {/* Position Count Badge */}
        <Badge variant="secondary" className="text-xs">
          {positionCount}
        </Badge>

        {/* Action Buttons */}
        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild();
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeCategoryItemWrapper key={child.id} {...child} />
          ))}
        </div>
      )}
    </div>
  );
}

// Wrapper to handle props passing correctly
function TreeCategoryItemWrapper(props: any) {
  return <TreeCategoryItem {...props} />;
}

interface TreeCategoryViewProps {
  categories: Category[];
  selectedCategoryId: string | null;
  positionCounts: Record<string, number>;
  onSelectCategory: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onUpdateCategory: (id: string, updates: { parent_id?: string | null; position?: number }) => void;
  editMode?: boolean;
}

export function TreeCategoryView({
  categories,
  selectedCategoryId,
  positionCounts,
  onSelectCategory,
  onAddChild,
  onEditCategory,
  onDeleteCategory,
  onUpdateCategory,
  editMode = false,
}: TreeCategoryViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const activeCategory = categories.find(c => c.id === active.id);
    const overCategory = categories.find(c => c.id === over.id);
    
    if (!activeCategory || !overCategory) return;

    // Update parent_id if dropped on a different category
    if (activeCategory.parent_id !== overCategory.parent_id) {
      onUpdateCategory(activeCategory.id, { 
        parent_id: overCategory.parent_id,
        position: overCategory.position 
      });
    } else {
      // Just reorder within the same parent
      const siblings = categories.filter(c => c.parent_id === activeCategory.parent_id);
      const oldIndex = siblings.findIndex(c => c.id === active.id);
      const newIndex = siblings.findIndex(c => c.id === over.id);
      
      if (oldIndex !== newIndex) {
        onUpdateCategory(activeCategory.id, { position: newIndex });
      }
    }
  };

  const buildTree = (items: Category[]): TreeNode[] => {
    const itemMap = new Map<string, TreeNode>();
    const rootItems: TreeNode[] = [];

    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [], level: 0 });
    });

    items.forEach(item => {
      const node = itemMap.get(item.id)!;
      if (item.parent_id && itemMap.has(item.parent_id)) {
        const parent = itemMap.get(item.parent_id)!;
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        rootItems.push(node);
      }
    });

    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(node => ({
          ...node,
          children: sortNodes(node.children)
        }));
    };

    return sortNodes(rootItems);
  };

  const renderTree = (nodes: TreeNode[]) => {
    return nodes.map((node) => (
      <TreeCategoryItem
        key={node.id}
        node={node}
        isSelected={selectedCategoryId === node.id}
        positionCount={positionCounts[node.id] || 0}
        onSelect={() => onSelectCategory(node.id)}
        onEdit={() => onEditCategory(node)}
        onDelete={() => onDeleteCategory(node)}
        onAddChild={() => onAddChild(node.id)}
        canDrag={editMode}
      />
    ));
  };

  const tree = buildTree(categories);

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Категории не найдены
      </div>
    );
  }

  const allIds = categories.map(c => c.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {renderTree(tree)}
        </div>
      </SortableContext>
    </DndContext>
  );
}
