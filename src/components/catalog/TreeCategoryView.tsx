import { useState } from "react";
import { ChevronRight, ChevronDown, FolderOpen, Folder, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Category } from "@/hooks/useCategories";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
            <TreeCategoryItemWrapper
              key={child.id}
              node={child}
              isSelected={isSelected}
              positionCount={positionCount}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              canDrag={canDrag}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Wrapper component to handle selection for children
interface TreeCategoryItemWrapperProps extends Omit<TreeCategoryItemProps, 'isSelected' | 'positionCount' | 'onSelect' | 'onEdit' | 'onDelete' | 'onAddChild'> {
  isSelected: boolean;
  positionCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: () => void;
}

function TreeCategoryItemWrapper(props: TreeCategoryItemWrapperProps) {
  return <TreeCategoryItem {...props} />;
}

interface TreeCategoryViewProps {
  categories: Category[];
  selectedCategoryId: string | null;
  positionCounts: Record<string, number>;
  onSelectCategory: (id: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onAddChildCategory: (parentId: string) => void;
  editMode: boolean;
}

export function TreeCategoryView({
  categories,
  selectedCategoryId,
  positionCounts,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
  onAddChildCategory,
  editMode,
}: TreeCategoryViewProps) {
  // Build tree structure
  const buildTree = (categories: Category[]): TreeNode[] => {
    const categoryMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create nodes
    categories.forEach((category) => {
      categoryMap.set(category.id, {
        ...category,
        children: [],
        level: 0,
      });
    });

    // Build tree
    categories.forEach((category) => {
      const node = categoryMap.get(category.id);
      if (!node) return;

      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          node.level = parent.level + 1;
          parent.children.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const treeData = buildTree(categories);

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
        onAddChild={() => onAddChildCategory(node.id)}
        canDrag={editMode}
      />
    ));
  };

  return (
    <div className="space-y-1">
      {treeData.length > 0 ? (
        renderTree(treeData)
      ) : (
        <div className="text-center text-sm text-muted-foreground py-8">
          Категории не найдены
        </div>
      )}
    </div>
  );
}
