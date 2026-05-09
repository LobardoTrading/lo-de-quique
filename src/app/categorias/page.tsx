'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { getCategories } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, Tag } from 'lucide-react'
import type { Category } from '@/types/database'

interface CategoryForm {
  name: string
  color: string
  sort_order: string
}

const emptyForm: CategoryForm = {
  name: '',
  color: '#3ec96c',
  sort_order: '0',
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const { toast } = useToast()

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch {
      toast('Error al cargar categorias', 'error')
    }
  }, [toast])

  const loadProductCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category_id')
        .eq('is_active', true)
      if (error) throw error
      const counts: Record<string, number> = {}
      data?.forEach((p) => {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1
        }
      })
      setProductCounts(counts)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    async function init() {
      await Promise.all([loadCategories(), loadProductCounts()])
      setLoading(false)
    }
    init()
  }, [loadCategories, loadProductCounts])

  function openNew() {
    setEditingCategory(null)
    setForm({
      ...emptyForm,
      sort_order: String(categories.length + 1),
    })
    setModalOpen(true)
  }

  function openEdit(category: Category) {
    setEditingCategory(category)
    setForm({
      name: category.name,
      color: category.color,
      sort_order: String(category.sort_order),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast('Ingresa el nombre de la categoria', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        color: form.color,
        icon: '',
        sort_order: Number(form.sort_order) || 0,
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id)
        if (error) throw error
        toast('Categoria actualizada')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(payload)
        if (error) throw error
        toast('Categoria creada')
      }

      setModalOpen(false)
      loadCategories()
    } catch {
      toast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteTarget.id)
      if (error) throw error
      toast('Categoria eliminada')
      setDeleteTarget(null)
      loadCategories()
      loadProductCounts()
    } catch {
      toast('Error al eliminar. Puede tener productos asociados.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-[var(--bg-card2)] rounded-[var(--radius)] animate-pulse" />
        <div className="h-64 bg-[var(--bg-card2)] rounded-[var(--radius)] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--green-dim)]">
            <Tag size={22} className="text-[var(--green)]" />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Categorias</h1>
            <Badge color="green">{categories.length}</Badge>
          </div>
        </div>
        <Button size="md" onClick={openNew}>
          <Plus size={18} />
          Nueva Categoria
        </Button>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: cat.color + '20', color: cat.color }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </span>
          ))}
        </div>
      )}

      {/* Table or empty state */}
      {categories.length === 0 ? (
        <EmptyState
          icon={<Tag size={36} />}
          title="Sin categorias"
          description="Crea tu primera categoria para organizar los productos"
          action={
            <Button onClick={openNew}>
              <Plus size={18} /> Nueva Categoria
            </Button>
          }
        />
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Nombre
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Color
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Productos
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Orden
                  </th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-card2)] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {cat.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-[var(--border)]"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs font-mono text-[var(--text-secondary)]">
                          {cat.color}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {productCounts[cat.id] || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {cat.sort_order}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-2 rounded-lg hover:bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--green)] transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="p-2 rounded-lg hover:bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar categoria"
        message={`Se va a eliminar "${deleteTarget?.name}". Los productos asociados quedaran sin categoria.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Category Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Editar Categoria' : 'Nueva Categoria'}
        size="sm"
      >
        <div className="space-y-5">
          <Input
            label="Nombre"
            placeholder="Ej: Lacteos"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[var(--text-secondary)]">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-[var(--border)] bg-transparent cursor-pointer p-0.5"
              />
              <Input
                placeholder="#3ec96c"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="font-mono"
              />
              <span
                className="w-8 h-8 rounded-full shrink-0 border border-[var(--border)]"
                style={{ backgroundColor: form.color }}
              />
            </div>
          </div>

          <Input
            label="Orden"
            type="number"
            min="0"
            placeholder="0"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              size="md"
              className="flex-1 border border-[var(--border)]"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="md"
              className="flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : editingCategory ? 'Guardar cambios' : 'Crear categoria'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
