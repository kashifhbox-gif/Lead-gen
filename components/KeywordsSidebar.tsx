"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface KeywordCategory {
  _id: string;
  name: string;
  keywords: string[];
}

interface KeywordsSidebarProps {
  onSelectKeyword: (keyword: string) => void;
}

export default function KeywordsSidebar({ onSelectKeyword }: KeywordsSidebarProps) {
  const [categories, setCategories] = useState<KeywordCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // CRUD states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addingKeywordTo, setAddingKeywordTo] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/keywords');
      const data = await res.json();
      let fetchedCategories = Array.isArray(data) ? data : [];
      
      fetchedCategories.sort((a: KeywordCategory, b: KeywordCategory) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aIsPriority = aName.includes('app development') || aName.includes('web development') || aName.includes('web application');
        const bIsPriority = bName.includes('app development') || bName.includes('web development') || bName.includes('web application');
        
        if (aIsPriority && !bIsPriority) return -1;
        if (!aIsPriority && bIsPriority) return 1;
        return a.name.localeCompare(b.name);
      });

      setCategories(fetchedCategories);
      // Auto-expand first few if any
      if (fetchedCategories.length > 0 && expandedCategories.length === 0) {
        setExpandedCategories([fetchedCategories[0]._id]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim(), keywords: [] })
      });
      if (res.ok) {
        setNewCategoryName('');
        setIsAddingCategory(false);
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await fetch(`/api/keywords/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddKeyword = async (categoryId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const category = categories.find(c => c._id === categoryId);
    if (!category) return;

    const updatedKeywords = [...category.keywords, newKeyword.trim()];
    
    try {
      const res = await fetch(`/api/keywords/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: category.name, keywords: updatedKeywords })
      });
      if (res.ok) {
        setNewKeyword('');
        setAddingKeywordTo(null);
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKeyword = async (categoryId: string, keyword: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const category = categories.find(c => c._id === categoryId);
    if (!category) return;

    const updatedKeywords = category.keywords.filter(k => k !== keyword);
    
    try {
      await fetch(`/api/keywords/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: category.name, keywords: updatedKeywords })
      });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    keywords: cat.keywords.filter(kw => kw.toLowerCase().includes(searchFilter.toLowerCase()))
  })).filter(cat => cat.name.toLowerCase().includes(searchFilter.toLowerCase()) || cat.keywords.length > 0);

  return (
    <div className="flex flex-col h-full bg-[#0b0f19]/80 border border-indigo-500/20 rounded-3xl backdrop-blur-xl shadow-[0_0_40px_rgba(99,102,241,0.05)] overflow-hidden">
      <div className="p-4 border-b border-white/[0.05] bg-black/20 shrink-0">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
          Keyword Library
          <button 
            onClick={() => setIsAddingCategory(!isAddingCategory)}
            className="p-1 hover:bg-white/10 rounded-md transition-colors"
            title="Add Category"
          >
            <Plus className="w-5 h-5 text-indigo-400" />
          </button>
        </h2>
        
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-black/40 border border-white/[0.05] rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isAddingCategory && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category Name"
              className="flex-1 bg-black/40 border border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button 
              onClick={handleAddCategory}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium text-white transition-colors"
            >
              Add
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center p-6 text-neutral-500 text-sm">
            No categories found.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredCategories.map(category => {
              const isExpanded = expandedCategories.includes(category._id);
              return (
                <div key={category._id} className="bg-black/20 border border-white/[0.05] rounded-xl overflow-hidden">
                  <div 
                    onClick={() => toggleCategory(category._id)}
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02] transition-colors select-none group"
                  >
                    <div className="flex items-center gap-2 font-medium text-sm text-neutral-200">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
                      {category.name}
                      <span className="text-xs text-neutral-500 ml-1">({category.keywords.length})</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingKeywordTo(category._id);
                          if (!isExpanded) toggleCategory(category._id);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-md text-neutral-400 hover:text-indigo-400 transition-colors"
                        title="Add Keyword"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteCategory(category._id, e)}
                        className="p-1.5 hover:bg-white/10 rounded-md text-neutral-400 hover:text-red-400 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-black/40"
                      >
                        <div className="p-2 flex flex-col gap-1">
                          {addingKeywordTo === category._id && (
                            <form onSubmit={(e) => handleAddKeyword(category._id, e)} className="flex gap-2 p-1 mb-1">
                              <input
                                type="text"
                                autoFocus
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                placeholder="New keyword..."
                                className="flex-1 bg-black/40 border border-white/[0.1] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                              <button type="submit" className="px-2 py-1 bg-indigo-600/50 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white transition-colors">
                                Add
                              </button>
                            </form>
                          )}

                          {category.keywords.map(keyword => (
                            <div 
                              key={keyword}
                              onClick={() => onSelectKeyword(keyword)}
                              className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-indigo-500/10 cursor-pointer transition-colors border border-transparent hover:border-indigo-500/20"
                            >
                              <span className="text-xs text-neutral-400 group-hover:text-indigo-300 transition-colors truncate">
                                {keyword}
                              </span>
                              <button 
                                onClick={(e) => handleDeleteKeyword(category._id, keyword, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-neutral-500 hover:text-red-400 transition-all shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
