import { useEffect, useState } from 'react'
import { DndContext, closestCorners, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import api from '../../lib/api.js'

const COLUMNS = [
  { id: 'TODO', label: 'К выполнению', color: 'bg-gray-100 text-gray-700' },
  { id: 'IN_WORK', label: 'В работе', color: 'bg-blue-100 text-blue-700' },
  { id: 'REVIEW', label: 'Проверка', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'DONE', label: 'Готово', color: 'bg-green-100 text-green-700' },
]

const PRIORITY_DOT = { LOW: 'bg-green-400', MEDIUM: 'bg-yellow-400', HIGH: 'bg-orange-400', CRITICAL: 'bg-red-500' }

function TaskCard({ task, overlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white border border-gray-200 rounded-lg p-3 cursor-grab active:cursor-grabbing select-none ${overlay ? 'shadow-lg rotate-1' : 'hover:border-brand-300 transition-colors'}`}
    >
      <div className="flex items-start gap-2">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            {task.assignee ? (
              <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{task.assignee.name}</span>
            ) : (
              <span className="text-xs text-gray-300">Не назначен</span>
            )}
            {task.dueDate && (
              <span className="text-xs text-gray-400">{new Date(task.dueDate).toLocaleDateString('ru')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const [board, setBoard] = useState({ TODO: [], IN_WORK: [], REVIEW: [], DONE: [] })
  const [activeTask, setActiveTask] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [staff, setStaff] = useState([])
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', assigneeId: '' })

  const load = async () => {
    const { data } = await api.get('/tasks')
    setBoard(data)
  }

  useEffect(() => {
    load()
    api.get('/users/staff').then(({ data }) => setStaff(data)).catch(() => {})
  }, [])

  const allTasks = Object.values(board).flat()

  const handleDragStart = ({ active }) => {
    setActiveTask(allTasks.find(t => t.id === active.id))
  }

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null)
    if (!over) return
    const taskId = active.id
    const overId = over.id

    // Determine target column
    const targetColumn = COLUMNS.find(c => c.id === overId)?.id
      || COLUMNS.find(c => board[c.id]?.some(t => t.id === overId))?.id

    if (!targetColumn) return
    const task = allTasks.find(t => t.id === taskId)
    if (!task || task.status === targetColumn) return

    // Optimistic update
    setBoard(prev => {
      const newBoard = { ...prev }
      newBoard[task.status] = prev[task.status].filter(t => t.id !== taskId)
      newBoard[targetColumn] = [...prev[targetColumn], { ...task, status: targetColumn }]
      return newBoard
    })

    await api.patch(`/tasks/${taskId}`, { status: targetColumn }).catch(() => load())
  }

  const createTask = async (e) => {
    e.preventDefault()
    await api.post('/tasks', { ...form, assigneeId: form.assigneeId || undefined })
    setForm({ title: '', description: '', priority: 'MEDIUM', assigneeId: '' })
    setShowForm(false)
    load()
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Канбан-доска</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Задача</button>
      </div>

      {showForm && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Новая задача</h2>
          <form onSubmit={createTask} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Название</label>
              <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Описание</label>
              <textarea rows={2} className="input resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Приоритет</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Низкий</option>
                <option value="MEDIUM">Средний</option>
                <option value="HIGH">Высокий</option>
                <option value="CRITICAL">Критичный</option>
              </select>
            </div>
            <div>
              <label className="label">Исполнитель</label>
              <select className="input" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                <option value="">Не назначен</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Создать</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Отмена</button>
            </div>
          </form>
        </div>
      )}

      <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
          {COLUMNS.map(col => (
            <div key={col.id} className="flex flex-col">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-3 ${col.color}`}>
                <span className="font-medium text-sm">{col.label}</span>
                <span className="ml-auto text-xs font-bold">{board[col.id]?.length || 0}</span>
              </div>
              <SortableContext items={(board[col.id] || []).map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div id={col.id} className="flex-1 space-y-2 min-h-20 p-2 rounded-lg bg-gray-50 border-2 border-dashed border-transparent hover:border-gray-200 transition-colors">
                  {(board[col.id] || []).map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} overlay />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
