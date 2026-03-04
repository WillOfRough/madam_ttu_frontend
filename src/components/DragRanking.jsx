import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import styles from './DragRanking.module.css';

function SortableItem({ id, label, icon, rank }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.item} {...attributes}>
      <span className={styles.rank}>{rank}</span>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
      <button type="button" className={styles.grip} {...listeners}>
        <GripVertical size={18} />
      </button>
    </div>
  );
}

export default function DragRanking({ items, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={styles.list}>
          {items.map((item, idx) => (
            <SortableItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              rank={idx + 1}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
