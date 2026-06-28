import type { EditableFoodItem } from '@/lib/scanner/editable-food-item';
import { editableFoodItemToFoodItem } from '@/lib/scanner/editable-food-item';
import { FoodItemRowView } from '@/components/design/FoodItemRowView';

interface FoodItemRowProps {
  item: EditableFoodItem;
  onEdit?: () => void;
}

export function FoodItemRow({ item, onEdit }: FoodItemRowProps) {
  return (
    <FoodItemRowView
      item={editableFoodItemToFoodItem(item)}
      flagged={item.isFlagged}
      onEdit={onEdit}
    />
  );
}
