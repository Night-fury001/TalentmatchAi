import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Tags, MapPin, Sparkles, Plus, Pencil, Trash2, Power } from 'lucide-react';
import { adminTaxonomyService } from '../../services/adminTaxonomyService';
import { getErrorMessage } from '../../utils/axiosInstance';
import { adminCategorySchema, adminLocationSchema, adminSkillSchema } from '../../utils/schemas';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';

const TABS = [
  {
    key: 'categories',
    label: 'Categories',
    icon: Tags,
    schema: adminCategorySchema,
    list: adminTaxonomyService.listCategories,
    create: adminTaxonomyService.createCategory,
    update: adminTaxonomyService.updateCategory,
    remove: adminTaxonomyService.deleteCategory,
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'icon', label: 'Icon (optional)' },
      { name: 'description', label: 'Description (optional)', type: 'textarea' },
    ],
    itemLabel: (item) => item.name,
    itemSub: (item) => `${item._count?.jobs || 0} jobs`,
  },
  {
    key: 'locations',
    label: 'Locations',
    icon: MapPin,
    schema: adminLocationSchema,
    list: adminTaxonomyService.listLocations,
    create: adminTaxonomyService.createLocation,
    update: adminTaxonomyService.updateLocation,
    remove: adminTaxonomyService.deleteLocation,
    fields: [
      { name: 'city', label: 'City' },
      { name: 'state', label: 'State / region (optional)' },
      { name: 'country', label: 'Country' },
    ],
    itemLabel: (item) => [item.city, item.state, item.country].filter(Boolean).join(', '),
    itemSub: (item) => `${(item._count?.jobs || 0) + (item._count?.companies || 0)} references`,
  },
  {
    key: 'skills',
    label: 'Skills',
    icon: Sparkles,
    schema: adminSkillSchema,
    list: adminTaxonomyService.listSkills,
    create: adminTaxonomyService.createSkill,
    update: adminTaxonomyService.updateSkill,
    remove: adminTaxonomyService.deleteSkill,
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'category', label: 'Category (optional)' },
    ],
    itemLabel: (item) => item.name,
    itemSub: (item) => `${(item._count?.users || 0) + (item._count?.jobs || 0)} references`,
  },
];

export default function TaxonomyPage() {
  const [activeTab, setActiveTab] = useState('categories');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tab = TABS.find((t) => t.key === activeTab);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(tab.schema) });

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const key = activeTab; // categories | locations | skills
      const data = await tab.list();
      setItems(data[key]);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load this list.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const openCreate = () => {
    setEditing(null);
    const blank = {};
    tab.fields.forEach((f) => {
      blank[f.name] = '';
    });
    reset(blank);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    const values = {};
    tab.fields.forEach((f) => {
      values[f.name] = item[f.name] || '';
    });
    reset(values);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (editing) {
        await tab.update(editing.id, data);
        toast.success('Saved.');
      } else {
        await tab.create(data);
        toast.success('Created.');
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save this item.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await tab.update(item.id, { isActive: !item.isActive });
      toast.success(item.isActive ? 'Deactivated.' : 'Activated.');
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update this item.'));
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${tab.itemLabel(item)}"? This cannot be undone.`)) return;
    try {
      await tab.remove(item.id);
      toast.success('Deleted.');
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this item.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900">Taxonomy</h1>
          <p className="text-sm text-ink-500 mt-1">Manage the categories, locations, and skills used across the platform.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          Add {tab.label.slice(0, -1).toLowerCase()}
        </Button>
      </div>

      <div className="inline-flex rounded-2xl border border-ink-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={clsx(
              'flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              activeTab === t.key ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : items.length === 0 ? (
        <EmptyState icon={tab.icon} title={`No ${tab.label.toLowerCase()} yet`} description="Add the first one to get started." />
      ) : (
        <div className="surface divide-y divide-ink-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink-900 truncate">{tab.itemLabel(item)}</p>
                  {!item.isActive && <Badge variant="rose">Inactive</Badge>}
                </div>
                <p className="text-xs text-ink-400 mt-0.5">{tab.itemSub(item)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggleActive(item)}
                  className="rounded-full p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  aria-label="Toggle active"
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="rounded-full p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  aria-label="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="rounded-full p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${tab.label.slice(0, -1).toLowerCase()}` : `Add ${tab.label.slice(0, -1).toLowerCase()}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {tab.fields.map((field) =>
            field.type === 'textarea' ? (
              <TextArea key={field.name} label={field.label} rows={3} error={errors[field.name]?.message} {...register(field.name)} />
            ) : (
              <Input key={field.name} label={field.label} error={errors[field.name]?.message} {...register(field.name)} />
            )
          )}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {editing ? 'Save changes' : 'Create'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
