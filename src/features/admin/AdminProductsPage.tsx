import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeProducts, saveProduct } from '../../services/admin.service';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { Button } from '../../components/ui/Button';
import type { Product } from '../../types';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('PCS');
  const [packetsPerBox, setPacketsPerBox] = useState<number>(100);
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeProducts((list) => {
      setProducts(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setDefaultUnit('PCS');
    setPacketsPerBox(100);
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name || '');
    setSku(prod.sku || '');
    setDefaultUnit(prod.defaultUnit || 'PCS');
    setPacketsPerBox(prod.packetsPerBox || 100);
    setActive(prod.active !== false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (prodId: string, prodName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${prodName}"? This action cannot be undone and may affect historical calculations.`)) return;
    try {
      await deleteDoc(doc(db, 'products', prodId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || packetsPerBox <= 0) {
      setFormError('Please fill out all fields with valid values.');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      await saveProduct(editingProduct ? editingProduct.id : null, {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        defaultUnit,
        active,
        packetsPerBox
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-dark-bg pb-6">
      <MobileHeader title="Product Catalog" />

      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">Active Products</h2>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Assigned to operators for production logs</p>
          </div>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="!rounded-2xl"
          >
            + New Product
          </Button>
        </div>

        {/* Products List */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-8 text-center text-gray-400 dark:text-gray-500">
            <p className="text-sm font-medium">No products registered yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-gray-900 dark:text-emerald-50">{prod.name}</h4>
                    {!prod.active && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/40 text-red-600 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-0.5">SKU: {prod.sku} • Unit: {prod.defaultUnit}</p>
                  
                  <div className="mt-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-800/10 px-3 py-1.5 rounded-xl inline-flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Packets Per Box:</span>
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">{prod.packetsPerBox || 100}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(prod)}
                    className="bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border text-gray-500 dark:text-gray-400 p-2.5 rounded-2xl active:scale-[0.95] transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(prod.id, prod.name)}
                    className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-2.5 rounded-2xl active:scale-[0.95] transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl overflow-hidden relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">
                  {editingProduct ? 'Edit Product' : 'New Product'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400">
                    {formError}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Product Name*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paper Cup 250ml"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">SKU / Code*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PC-250"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Packets Per Box*</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={packetsPerBox}
                    onChange={(e) => setPacketsPerBox(Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  />
                  <span className="text-[8px] text-gray-400 dark:text-gray-500 leading-tight">Used to automatically calculate total packets: Box × Packets Per Box.</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Default Unit</label>
                  <select
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  >
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="BOX">Boxes (BOX)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="product-active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="product-active" className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-emerald-100/70 select-none">
                    Product Active / Available
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full !rounded-2xl mt-4"
                >
                  {submitting ? 'Saving...' : 'Save Product'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
