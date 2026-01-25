import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { getCategories, saveCategory, deleteCategory } from '../services/storageService';
import { 
  Tags, Plus, Trash2, Lock, AlertCircle, Loader2, 
  ArrowUpDown, Droplets, Zap, Flame, Fan, PaintRoller, 
  Building, CloudLightning, Flower2, Bug, DoorOpen, Wrench,
  Shield, Radio
} from 'lucide-react';

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estado para o Modal de Exclusão
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    const data = await getCategories();
    setCategories(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCatName.trim();
    
    if (!trimmedName) return;

    // Prevenção de duplicatas (Case insensitive)
    if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('Esta categoria já existe.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
        await saveCategory(trimmedName);
        setNewCatName('');
        refreshData();
    } catch (err: any) {
        setError(`Erro: ${err.message}`);
        setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    e.preventDefault();
    setCategoryToDelete(category);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
        await deleteCategory(categoryToDelete.id);
        setCategoryToDelete(null);
        refreshData();
    } catch (err: any) {
        alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();

    if (lower.includes('elevador')) return { icon: ArrowUpDown, color: 'text-blue-500', bg: 'bg-blue-100' };
    if (lower.includes('bomba') || lower.includes('hidr') || lower.includes('água')) return { icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-100' };
    if (lower.includes('gerador') || lower.includes('elétric') || lower.includes('energia')) return { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-100' };
    if (lower.includes('incêndio') || lower.includes('fogo') || lower.includes('extintor')) return { icon: Flame, color: 'text-red-500', bg: 'bg-red-100' };
    if (lower.includes('pressur') || lower.includes('ar ') || lower.includes('ventila')) return { icon: Fan, color: 'text-sky-500', bg: 'bg-sky-100' };
    if (lower.includes('pintura') || lower.includes('parede')) return { icon: PaintRoller, color: 'text-purple-500', bg: 'bg-purple-100' };
    if (lower.includes('fachada') || lower.includes('predial') || lower.includes('estrutura')) return { icon: Building, color: 'text-indigo-500', bg: 'bg-indigo-100' };
    if (lower.includes('spda') || lower.includes('raio')) return { icon: CloudLightning, color: 'text-amber-500', bg: 'bg-amber-100' };
    if (lower.includes('jard') || lower.includes('poda') || lower.includes('plant')) return { icon: Flower2, color: 'text-green-500', bg: 'bg-green-100' };
    if (lower.includes('dedetiza') || lower.includes('limpeza') || lower.includes('praga')) return { icon: Bug, color: 'text-teal-500', bg: 'bg-teal-100' };
    if (lower.includes('port') || lower.includes('acesso')) return { icon: DoorOpen, color: 'text-slate-600', bg: 'bg-slate-200' };
    if (lower.includes('segurança') || lower.includes('cftv') || lower.includes('câmera')) return { icon: Shield, color: 'text-blue-800', bg: 'bg-blue-100' };
    if (lower.includes('interfone') || lower.includes('antena')) return { icon: Radio, color: 'text-gray-600', bg: 'bg-gray-200' };

    return { icon: Wrench, color: 'text-slate-500', bg: 'bg-slate-100' };
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Tags className="text-blue-600" />
            Categorias de Manutenção
          </h2>
          <p className="text-sm text-slate-500">Gerencie as categorias usadas para classificar as manutenções.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1 text-slate-700">Nova Categoria</label>
            <input 
              className="w-full border p-3 sm:p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base sm:text-sm" 
              placeholder="Ex: Área de Lazer, Piscina, CFTV..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={!newCatName.trim()}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus size={18} /> Adicionar
          </button>
        </form>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const { icon: Icon, color, bg } = getCategoryIcon(cat.name);
          
          return (
            <div 
              key={cat.id} 
              className="p-4 rounded-xl border flex items-center justify-between transition-all hover:shadow-md bg-white border-blue-100 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg} ${color}`}>
                  <Icon size={20} />
                </div>

                <div className="flex flex-col">
                    <span className="font-semibold text-sm text-slate-800">
                        {cat.name}
                    </span>
                    {/* Tags de sistema removidas visualmente conforme solicitado */}
                </div>
              </div>

              {/* Botão de excluir habilitado para todas as categorias */}
              <button 
                onClick={(e) => handleDeleteClick(e, cat)}
                className="text-slate-400 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-lg relative z-50 cursor-pointer active:scale-95"
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {categoryToDelete && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center transform scale-100">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 size={32} className="text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Categoria?</h3>
                  <p className="text-sm text-slate-500 mb-6">
                      Você tem certeza que deseja remover <strong>{categoryToDelete.name}</strong>?
                  </p>
                  
                  <div className="flex gap-3 justify-center">
                      <button 
                        onClick={() => setCategoryToDelete(null)}
                        className="flex-1 px-4 py-3 sm:py-2.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="flex-1 px-4 py-3 sm:py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md shadow-red-200 transition"
                      >
                          Sim, Excluir
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CategoryList;